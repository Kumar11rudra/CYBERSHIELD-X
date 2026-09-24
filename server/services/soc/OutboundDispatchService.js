'use strict';

/**
 * 🛡️ CyberShield X — Outbound Dispatch Service (Phase 81 Step 3)
 *
 * Enterprise ITSM Outbound Dispatch Orchestrator:
 * - Deterministic job packaging and queuing via existing MemoryQueue (integrationQueue)
 * - Strict tenant isolation: authoritatively re-resolves IntegrationConfig per tenant
 * - Credential protection: queue payloads and DLQ records strictly scrubbed of secrets
 * - Controlled connector resolution: static registry for Jira, ServiceNow, PagerDuty
 * - Deterministic error classification: RETRYABLE vs NON_RETRYABLE vs POISON
 * - Bounded exponential backoff with configurable jitter
 * - Retry limiting (max 3 attempts default)
 * - Dead-Letter Queue (DLQ) isolation preserving operator telemetry
 * - Audit logging via immutable IntegrationSyncEvent with UUID v4 syncId and SHA-256 payloadHash
 * - HTTP defense-in-depth: explicit maxRedirects: 0 enforcement
 */

const crypto = require('crypto');
const mongoose = require('mongoose');
const logger = require('../../utils/logger');
const IntegrationConfig = require('../../models/IntegrationConfig');
const IntegrationSyncEvent = require('../../models/IntegrationSyncEvent');
const { secureAxios, sanitizeError, hashPayload } = require('../../integrations/connectorUtils');

// Cached queue reference avoiding repeated require() calls
let _cachedIntegrationQueue = null;
function getIntegrationQueue() {
  if (!_cachedIntegrationQueue) {
    _cachedIntegrationQueue = require('../../workers/queueProvider').integrationQueue;
  }
  return _cachedIntegrationQueue;
}

// Enforce maxRedirects: 0 on secureAxios for worker-level HTTP defense-in-depth (P2-81-04)
if (secureAxios && secureAxios.defaults) {
  secureAxios.defaults.maxRedirects = 0;
}

// Static approved connector registry — strictly no dynamic require() from user payload
const CONNECTOR_REGISTRY = {
  JIRA: require('../../integrations/jira').jiraConnector,
  SERVICENOW: require('../../integrations/servicenow').serviceNowConnector,
  PAGERDUTY: require('../../integrations/pagerduty').pagerDutyConnector,
};

const SUPPORTED_PROVIDERS = Object.freeze(['JIRA', 'SERVICENOW', 'PAGERDUTY']);
const SUPPORTED_OPERATIONS = Object.freeze(['CREATE', 'UPDATE', 'TEST']);
const SUPPORTED_ENTITY_TYPES = Object.freeze(['CASE', 'INCIDENT', 'APPROVAL']);

// Secret keys that are forbidden in queue payloads
const FORBIDDEN_SECRET_KEYS = Object.freeze([
  'password',
  'apitoken',
  'api_token',
  'token',
  'secret',
  'webhooksecret',
  'webhook_secret',
  'apikey',
  'api_key',
  'routingkey',
  'routing_key',
  'authorization',
  'cookie',
]);

class OutboundDispatchService {
  constructor() {
    this._dlq = [];
    this._retryTimers = new Set();
    this.defaultMaxAttempts = 3;
    this.baseDelayMs = 1000;
    this.backoffMultiplier = 2;
    this.maxDelayMs = 60000;
    this.jitterMs = 200;
  }

  /**
   * Enqueues an outbound dispatch job to the existing integrationQueue.
   *
   * @param {object} params
   * @param {string|object} params.organizationId
   * @param {string|object} params.integrationId
   * @param {string} params.provider - 'JIRA' | 'SERVICENOW' | 'PAGERDUTY'
   * @param {string} [params.operation='CREATE']
   * @param {string} [params.targetEntityType='CASE']
   * @param {string} params.targetEntityId
   * @param {object} params.payload
   * @param {object} [params.options]
   * @returns {Promise<object>} Job dispatch metadata
   */
  async enqueueDispatch({
    organizationId,
    integrationId,
    provider,
    operation = 'CREATE',
    targetEntityType = 'CASE',
    targetEntityId,
    payload = {},
    options = {},
  }) {
    if (!organizationId) {
      throw new Error('OutboundDispatch: organizationId is required');
    }
    if (!integrationId) {
      throw new Error('OutboundDispatch: integrationId is required');
    }
    if (!provider) {
      throw new Error('OutboundDispatch: provider is required');
    }
    if (!targetEntityId) {
      throw new Error('OutboundDispatch: targetEntityId is required');
    }

    const normalizedProvider = String(provider).trim().toUpperCase();
    if (!SUPPORTED_PROVIDERS.includes(normalizedProvider)) {
      throw new Error(`OutboundDispatch: unsupported provider '${provider}'. Supported: ${SUPPORTED_PROVIDERS.join(', ')}`);
    }

    const normalizedOperation = String(operation).trim().toUpperCase();
    if (!SUPPORTED_OPERATIONS.includes(normalizedOperation)) {
      throw new Error(`OutboundDispatch: unsupported operation '${operation}'. Supported: ${SUPPORTED_OPERATIONS.join(', ')}`);
    }

    const normalizedEntityType = String(targetEntityType).trim().toUpperCase();
    if (!SUPPORTED_ENTITY_TYPES.includes(normalizedEntityType)) {
      throw new Error(`OutboundDispatch: unsupported targetEntityType '${targetEntityType}'. Supported: ${SUPPORTED_ENTITY_TYPES.join(', ')}`);
    }

    // Defense-in-depth: check for credential exposure in payload
    this._validateNoSecretsInPayload(payload);

    const jobId = crypto.randomUUID();
    const jobData = {
      jobType: 'OUTBOUND_DISPATCH',
      jobId,
      organizationId: organizationId.toString(),
      integrationId: integrationId.toString(),
      provider: normalizedProvider,
      operation: normalizedOperation,
      targetEntityType: normalizedEntityType,
      targetEntityId: String(targetEntityId),
      idempotencyKey: options.idempotencyKey || null,
      attempt: options.attempt || 1,
      maxAttempts: options.maxAttempts || this.defaultMaxAttempts,
      createdAt: new Date().toISOString(),
      payload: this._sanitizePayload(payload),
    };

    // Push into the repository's canonical integrationQueue
    getIntegrationQueue().enqueue(jobData);

    logger.info(
      `[OUTBOUND-DISPATCH] Enqueued job ${jobId} for provider ${normalizedProvider} (org: ${jobData.organizationId}, entity: ${jobData.targetEntityId})`
    );

    return {
      jobId,
      status: 'ENQUEUED',
      provider: normalizedProvider,
      operation: normalizedOperation,
      targetEntityId: jobData.targetEntityId,
      attempt: jobData.attempt,
      maxAttempts: jobData.maxAttempts,
      enqueuedAt: jobData.createdAt,
    };
  }

  /**
   * Processes an outbound dispatch job received by the IntegrationWorker.
   * Isolates failures, performs tenant check, classifies errors, schedules retries or DLQs.
   *
   * @param {object} jobData
   * @returns {Promise<object>} Processing outcome
   */
  async processJob(jobData) {
    const startTime = Date.now();

    // 1. Poison job check
    const poisonReason = this._detectPoisonJob(jobData);
    if (poisonReason) {
      logger.error(`[OUTBOUND-DISPATCH] Poison job detected (${poisonReason}). Routing immediately to DLQ.`);
      const dlqRecord = this._recordDlq(jobData, 'POISON_JOB', poisonReason, jobData?.attempt || 1);
      await this._recordAuditEvent({
        jobData,
        status: 'REJECTED',
        eventType: 'TICKET_DISPATCH_POISON',
        errorMessage: poisonReason,
        durationMs: Date.now() - startTime,
      });
      return {
        success: false,
        status: 'DLQ',
        reason: 'POISON_JOB',
        retryable: false,
        dlqId: dlqRecord.dlqId,
      };
    }

    const { jobId, organizationId, integrationId, provider, operation, targetEntityType, targetEntityId, payload } = jobData;
    const currentAttempt = Number(jobData.attempt) || 1;
    const maxAttempts = Number(jobData.maxAttempts) || this.defaultMaxAttempts;

    logger.info(`[OUTBOUND-DISPATCH] Processing job ${jobId} (attempt ${currentAttempt}/${maxAttempts}) for org ${organizationId}`);

    let config = null;

    try {
      // Safeguard against Mongoose buffering if disconnected during unit tests
      if (mongoose.connection && mongoose.connection.readyState !== 1 && !IntegrationConfig.findOne.mock) {
        return {
          success: false,
          status: 'DLQ',
          reason: 'DATABASE_DISCONNECTED',
          retryable: false,
        };
      }

      // 2. Authoritative tenant check & IntegrationConfig resolution
      config = await IntegrationConfig.findOne({
        _id: integrationId,
        organizationId: organizationId,
      });

      if (!config) {
        // Check if config exists under a different tenant (forgery attempt)
        const foreignConfig = await IntegrationConfig.findById(integrationId);
        if (foreignConfig && foreignConfig.organizationId.toString() !== organizationId.toString()) {
          const mismatchError = 'TENANT_MISMATCH: Authoritative integration ownership does not match job organizationId';
          logger.warn(`[OUTBOUND-DISPATCH] Security violation: ${mismatchError} (job: ${jobId})`);
          this._recordDlq(jobData, 'TENANT_MISMATCH', mismatchError, currentAttempt);
          await this._recordAuditEvent({
            jobData,
            status: 'REJECTED',
            eventType: 'TICKET_DISPATCH_TENANT_MISMATCH',
            errorMessage: mismatchError,
            durationMs: Date.now() - startTime,
          });
          return {
            success: false,
            status: 'DLQ',
            reason: 'TENANT_MISMATCH',
            retryable: false,
          };
        }

        const notFoundError = `IntegrationConfig not found: ${integrationId}`;
        this._recordDlq(jobData, 'CONFIG_NOT_FOUND', notFoundError, currentAttempt);
        await this._recordAuditEvent({
          jobData,
          status: 'REJECTED',
          eventType: 'TICKET_DISPATCH_CONFIG_NOT_FOUND',
          errorMessage: notFoundError,
          durationMs: Date.now() - startTime,
        });
        return {
          success: false,
          status: 'DLQ',
          reason: 'CONFIG_NOT_FOUND',
          retryable: false,
        };
      }

      if (!config.active) {
        const disabledError = `IntegrationConfig ${integrationId} is disabled`;
        this._recordDlq(jobData, 'INTEGRATION_DISABLED', disabledError, currentAttempt);
        await this._recordAuditEvent({
          jobData,
          status: 'REJECTED',
          eventType: 'TICKET_DISPATCH_DISABLED',
          errorMessage: disabledError,
          durationMs: Date.now() - startTime,
        });
        return {
          success: false,
          status: 'DLQ',
          reason: 'INTEGRATION_DISABLED',
          retryable: false,
        };
      }

      // 3. Connector Resolution
      const connector = CONNECTOR_REGISTRY[provider];
      if (!connector) {
        const unsuppError = `Unsupported connector provider: ${provider}`;
        this._recordDlq(jobData, 'UNSUPPORTED_PROVIDER', unsuppError, currentAttempt);
        await this._recordAuditEvent({
          jobData,
          status: 'REJECTED',
          eventType: 'TICKET_DISPATCH_UNSUPPORTED',
          errorMessage: unsuppError,
          durationMs: Date.now() - startTime,
        });
        return {
          success: false,
          status: 'DLQ',
          reason: 'UNSUPPORTED_PROVIDER',
          retryable: false,
        };
      }

      // Verify config.type matches requested provider
      const configTypeUpper = String(config.type).toUpperCase();
      if (configTypeUpper !== provider) {
        const typeMismatchError = `Provider mismatch: config is ${config.type}, job requested ${provider}`;
        this._recordDlq(jobData, 'PROVIDER_TYPE_MISMATCH', typeMismatchError, currentAttempt);
        await this._recordAuditEvent({
          jobData,
          status: 'REJECTED',
          eventType: 'TICKET_DISPATCH_TYPE_MISMATCH',
          errorMessage: typeMismatchError,
          durationMs: Date.now() - startTime,
        });
        return {
          success: false,
          status: 'DLQ',
          reason: 'PROVIDER_TYPE_MISMATCH',
          retryable: false,
        };
      }

      // 4. Build connector context
      const context = {
        organizationId: config.organizationId.toString(),
        targetEntityType,
        targetEntityId,
        caseId: targetEntityType === 'CASE' ? targetEntityId : undefined,
        incidentId: targetEntityType === 'INCIDENT' ? targetEntityId : undefined,
        idempotencyKey: jobData.idempotencyKey,
        ...payload,
      };

      const connectorOptions = {
        recordAudit: false, // OutboundDispatchService controls the audit trail deterministically
        maxRedirects: 0,
      };

      // 5. Execute connector operation
      let result;
      if (operation === 'CREATE') {
        result = await connector.createTicket(config, context, connectorOptions);
      } else if (operation === 'UPDATE') {
        const ticketIdentifier = payload.ticketIdentifier || payload.ticketKey || payload.ticketId || targetEntityId;
        result = await connector.updateTicket(config, ticketIdentifier, payload, connectorOptions);
      } else if (operation === 'TEST') {
        result = await connector.testConnection(config, connectorOptions);
      } else {
        throw new Error(`Unsupported operation: ${operation}`);
      }

      // 6. Handle connector response
      if (result && result.success) {
        logger.info(`[OUTBOUND-DISPATCH] Job ${jobId} succeeded for provider ${provider}`);
        await this._recordAuditEvent({
          jobData,
          status: 'SUCCESS',
          eventType: `TICKET_${operation}_SUCCESS`,
          externalTicketKey: result.externalTicketKey || null,
          durationMs: Date.now() - startTime,
        });
        return {
          success: true,
          status: 'COMPLETED',
          attempt: currentAttempt,
          result,
        };
      } else {
        // Normalized failure from connector
        const errObj = result?.error || { message: 'Connector operation returned unsuccessful result' };
        return await this._handleJobFailure({
          jobData,
          error: errObj,
          currentAttempt,
          maxAttempts,
          startTime,
        });
      }
    } catch (err) {
      // Uncaught exception during connector execution
      const sanitized = sanitizeError(err, provider);
      return await this._handleJobFailure({
        jobData,
        error: sanitized,
        rawError: err,
        currentAttempt,
        maxAttempts,
        startTime,
      });
    }
  }

  /**
   * Handles job failure by classifying error and deciding retry vs DLQ.
   *
   * @private
   */
  async _handleJobFailure({ jobData, error, rawError = null, currentAttempt, maxAttempts, startTime }) {
    const classification = this.classifyError(error, rawError);
    const sanitizedMessage = error.message || 'Operation failed';
    const durationMs = Date.now() - startTime;

    if (classification === 'RETRYABLE') {
      if (currentAttempt < maxAttempts) {
        const nextAttempt = currentAttempt + 1;
        const delayMs = this.calculateBackoff(nextAttempt);

        logger.warn(
          `[OUTBOUND-DISPATCH] Job ${jobData.jobId} failed (${sanitizedMessage}). Retrying in ${delayMs}ms (attempt ${nextAttempt}/${maxAttempts})`
        );

        await this._recordAuditEvent({
          jobData,
          status: 'FAILED',
          eventType: `TICKET_${jobData.operation}_RETRYING`,
          errorMessage: sanitizedMessage,
          attempt: currentAttempt,
          durationMs,
        });

        this._scheduleRetry(jobData, nextAttempt, delayMs);

        return {
          success: false,
          status: 'RETRYING',
          retryable: true,
          attempt: currentAttempt,
          nextAttempt,
          delayMs,
          error: {
            code: error.code || 'RETRYABLE_ERROR',
            message: sanitizedMessage,
          },
        };
      } else {
        // Max retries exhausted -> Move to DLQ
        logger.error(`[OUTBOUND-DISPATCH] Job ${jobData.jobId} exhausted ${maxAttempts} attempts. Moving to DLQ.`);

        const dlqRecord = this._recordDlq(jobData, 'RETRIES_EXHAUSTED', sanitizedMessage, currentAttempt);

        await this._recordAuditEvent({
          jobData,
          status: 'FAILED',
          eventType: `TICKET_${jobData.operation}_DLQ`,
          errorMessage: sanitizedMessage,
          attempt: currentAttempt,
          durationMs,
        });

        return {
          success: false,
          status: 'DLQ',
          reason: 'RETRIES_EXHAUSTED',
          retryable: false,
          attempt: currentAttempt,
          dlqId: dlqRecord.dlqId,
          error: {
            code: 'RETRIES_EXHAUSTED',
            message: sanitizedMessage,
          },
        };
      }
    } else {
      // Non-retryable or poison error -> Move to DLQ immediately without retrying
      logger.error(
        `[OUTBOUND-DISPATCH] Job ${jobData.jobId} encountered non-retryable error [${classification}]: ${sanitizedMessage}. Routing to DLQ.`
      );

      const dlqRecord = this._recordDlq(jobData, classification, sanitizedMessage, currentAttempt);

      await this._recordAuditEvent({
        jobData,
        status: 'REJECTED',
        eventType: `TICKET_${jobData.operation}_REJECTED`,
        errorMessage: sanitizedMessage,
        attempt: currentAttempt,
        durationMs,
      });

      return {
        success: false,
        status: 'DLQ',
        reason: classification,
        retryable: false,
        attempt: currentAttempt,
        dlqId: dlqRecord.dlqId,
        error: {
          code: error.code || classification,
          message: sanitizedMessage,
        },
      };
    }
  }

  /**
   * Classifies an error into RETRYABLE, NON_RETRYABLE, or POISON.
   *
   * @param {object} error - Sanitized error
   * @param {Error} [rawErr] - Optional original error
   * @returns {'RETRYABLE'|'NON_RETRYABLE'|'POISON'}
   */
  classifyError(error = {}, rawErr = null) {
    const statusCode = error.statusCode || rawErr?.response?.status || (rawErr?.status ? Number(rawErr.status) : null);
    const code = String(error.code || rawErr?.code || '').toUpperCase();
    const message = String(error.message || rawErr?.message || '').toLowerCase();

    // 1. Poison check
    if (code.includes('POISON') || message.includes('poison') || message.includes('malformed') || message.includes('corrupted')) {
      return 'POISON';
    }

    // 2. Explicit non-retryable error codes / messages
    if (
      code.includes('TENANT_MISMATCH') ||
      code.includes('AUTHENTICATION_FAILED') ||
      code.includes('UNSUPPORTED_PROVIDER') ||
      code.includes('RESOURCE_NOT_FOUND') ||
      code.includes('BAD_REQUEST') ||
      code.includes('SSRF_BLOCKED') ||
      code.includes('CONFIG_NOT_FOUND') ||
      message.includes('tenant mismatch') ||
      message.includes('invalid credentials') ||
      message.includes('unauthorized') ||
      message.includes('forbidden') ||
      message.includes('not found') ||
      message.includes('ssrf') ||
      message.includes('missing required')
    ) {
      return 'NON_RETRYABLE';
    }

    // 3. HTTP status-based classification
    if (statusCode) {
      if (statusCode === 429) {
        return 'RETRYABLE'; // Rate-limited upstream
      }
      if (statusCode >= 500 && statusCode <= 599) {
        return 'RETRYABLE'; // Server/gateway error
      }
      if (statusCode >= 400 && statusCode < 500) {
        return 'NON_RETRYABLE'; // Client configuration/auth error
      }
    }

    // 4. Network / Socket transient errors
    if (
      code.includes('TIMEOUT') ||
      code.includes('ETIMEDOUT') ||
      code.includes('ECONNABORTED') ||
      code.includes('ECONNRESET') ||
      code.includes('ENOTFOUND') ||
      code.includes('EAI_AGAIN') ||
      code.includes('RATE_LIMITED') ||
      code.includes('UPSTREAM_SERVER_ERROR') ||
      message.includes('timeout') ||
      message.includes('connection reset') ||
      message.includes('socket hang up') ||
      message.includes('econnreset') ||
      message.includes('etimedout') ||
      message.includes('econnrefused') ||
      message.includes('enotfound') ||
      message.includes('network error')
    ) {
      return 'RETRYABLE';
    }

    // Default to NON_RETRYABLE for safety against infinite retry storms
    return 'NON_RETRYABLE';
  }

  /**
   * Calculates bounded exponential backoff with jitter.
   *
   * Formula:
   * delay = Math.min(baseDelayMs * Math.pow(backoffMultiplier, attempt - 2), maxDelayMs) + jitter
   *
   * @param {number} attempt - Current retry attempt (2 for 1st retry, 3 for 2nd retry)
   * @param {object} [options]
   * @returns {number} Delay in milliseconds
   */
  calculateBackoff(attempt, options = {}) {
    const base = options.baseDelayMs ?? this.baseDelayMs;
    const mult = options.backoffMultiplier ?? this.backoffMultiplier;
    const max = options.maxDelayMs ?? this.maxDelayMs;
    const jitter = options.jitterMs !== undefined ? options.jitterMs : this.jitterMs;

    const exponent = Math.max(0, attempt - 2);
    const exponentialDelay = base * Math.pow(mult, exponent);
    const boundedDelay = Math.min(exponentialDelay, max);
    const jitterAmount = jitter > 0 ? Math.floor(Math.random() * jitter) : 0;

    return boundedDelay + jitterAmount;
  }

  /**
   * Schedules a delayed retry job back to integrationQueue.
   *
   * @private
   */
  _scheduleRetry(jobData, nextAttempt, delayMs) {
    const nextJobData = {
      ...jobData,
      attempt: nextAttempt,
      retriedAt: new Date().toISOString(),
    };

    const timer = setTimeout(() => {
      this._retryTimers.delete(timer);
      try {
        getIntegrationQueue().enqueue(nextJobData);
      } catch (err) {
        logger.error(`[OUTBOUND-DISPATCH] Failed to re-enqueue retry for job ${jobData.jobId}: ${err.message}`);
      }
    }, delayMs);

    // Unref timer so it doesn't hold open process during shutdown/tests
    if (typeof timer.unref === 'function') {
      timer.unref();
    }

    this._retryTimers.add(timer);
  }

  /**
   * Records a failed or poison job to the Dead-Letter Queue (DLQ).
   * Strictly sanitizes all data to guarantee zero credential leakage.
   *
   * @private
   */
  _recordDlq(jobData, failureReason, errorMessage, attempts = 1) {
    const dlqRecord = {
      dlqId: crypto.randomUUID(),
      jobId: jobData?.jobId || 'UNKNOWN',
      organizationId: jobData?.organizationId ? String(jobData.organizationId) : null,
      integrationId: jobData?.integrationId ? String(jobData.integrationId) : null,
      provider: jobData?.provider || 'UNKNOWN',
      operation: jobData?.operation || 'UNKNOWN',
      targetEntityType: jobData?.targetEntityType || 'UNKNOWN',
      targetEntityId: jobData?.targetEntityId ? String(jobData.targetEntityId) : 'UNKNOWN',
      failureReason,
      error: this._cleanErrorMessage(errorMessage),
      attempts,
      enqueuedAt: jobData?.createdAt || null,
      deadLetteredAt: new Date().toISOString(),
      sanitizedPayload: this._sanitizePayload(jobData?.payload),
    };

    this._dlq.push(dlqRecord);

    // Sync to integrationQueue's native dlq array for unified metrics
    const queue = getIntegrationQueue();
    if (queue && Array.isArray(queue.dlq)) {
      queue.dlq.push({
        id: dlqRecord.jobId,
        dlqId: dlqRecord.dlqId,
        data: dlqRecord,
        error: dlqRecord.error,
        failedAt: Date.now(),
        attempts,
      });
      if (queue.metrics) {
        queue.metrics.failed = (queue.metrics.failed || 0) + 1;
      }
    }

    return Object.freeze(dlqRecord);
  }

  /**
   * Records an immutable audit event via IntegrationSyncEvent.
   *
   * @private
   */
  async _recordAuditEvent({ jobData, status, eventType, externalTicketKey = null, errorMessage = null, attempt = 1, durationMs = 0 }) {
    try {
      // If mongoose is disconnected in unit tests without active mock, avoid buffering timeout
      if (mongoose.connection && mongoose.connection.readyState !== 1 && !IntegrationSyncEvent.create.mock) {
        return;
      }

      const syncId = crypto.randomUUID();
      const payloadHash = hashPayload(jobData?.payload || {});

      await IntegrationSyncEvent.create({
        syncId,
        organizationId: jobData?.organizationId || 'UNKNOWN',
        integrationId: jobData?.integrationId || new mongoose.Types.ObjectId(),
        provider: SUPPORTED_PROVIDERS.includes(jobData?.provider) ? jobData.provider : 'GENERIC',
        direction: 'OUTBOUND',
        eventType,
        targetEntityType: SUPPORTED_ENTITY_TYPES.includes(jobData?.targetEntityType) ? jobData.targetEntityType : 'CASE',
        targetEntityId: String(jobData?.targetEntityId || 'UNKNOWN'),
        externalTicketKey,
        payloadHash,
        status,
        errorMessage: this._cleanErrorMessage(errorMessage),
        attempt: Number(attempt) || 1,
        durationMs,
        processedAt: new Date(),
      });
    } catch (err) {
      logger.warn(`[OUTBOUND-DISPATCH] Failed writing IntegrationSyncEvent audit: ${err.message}`);
    }
  }

  /**
   * Queries DLQ items filtered by tenant organizationId and optional provider.
   *
   * @param {object} filter
   * @param {string} filter.organizationId
   * @param {string} [filter.provider]
   * @param {number} [filter.limit=50]
   * @returns {Array<object>}
   */
  getDlq({ organizationId, provider, limit = 50 }) {
    if (!organizationId) {
      throw new Error('getDlq: organizationId is required for tenant isolation');
    }

    let records = this._dlq.filter((item) => item.organizationId === String(organizationId));

    if (provider) {
      const provUpper = String(provider).toUpperCase();
      records = records.filter((item) => item.provider === provUpper);
    }

    return records.slice(-limit);
  }

  /**
   * Retrieves a single DLQ item with tenant ownership check.
   *
   * @param {string} dlqId
   * @param {string} organizationId
   * @returns {object|null}
   */
  getDlqItem(dlqId, organizationId) {
    if (!dlqId || !organizationId) return null;
    const item = this._dlq.find((i) => i.dlqId === dlqId);
    if (!item) return null;
    if (item.organizationId !== String(organizationId)) {
      return null; // Cross-tenant denial
    }
    return item;
  }

  /**
   * Clears DLQ entries for testing or operational purge.
   *
   * @param {object} [filter]
   * @param {string} [filter.organizationId]
   */
  clearDlq(filter = {}) {
    if (filter.organizationId) {
      this._dlq = this._dlq.filter((i) => i.organizationId !== String(filter.organizationId));
    } else {
      this._dlq = [];
    }
  }

  /**
   * Clears active retry timers.
   */
  clearRetryTimers() {
    for (const timer of this._retryTimers) {
      clearTimeout(timer);
    }
    this._retryTimers.clear();
  }

  /**
   * Validates that caller has not passed credentials inside the payload.
   *
   * @private
   */
  _validateNoSecretsInPayload(payload) {
    if (!payload || typeof payload !== 'object') return;

    for (const key of Object.keys(payload)) {
      const lowerKey = key.toLowerCase();
      if (FORBIDDEN_SECRET_KEYS.includes(lowerKey)) {
        throw new Error(`OutboundDispatch: payload contains forbidden credential field '${key}'. Secrets must not be queued.`);
      }
      if (typeof payload[key] === 'object' && payload[key] !== null) {
        this._validateNoSecretsInPayload(payload[key]);
      }
    }
  }

  /**
   * Recursively sanitizes a payload to guarantee zero credentials.
   *
   * @private
   */
  _sanitizePayload(payload) {
    if (!payload || typeof payload !== 'object') return {};

    const clean = {};
    for (const [k, v] of Object.entries(payload)) {
      const lower = k.toLowerCase();
      if (FORBIDDEN_SECRET_KEYS.includes(lower)) {
        clean[k] = '••••••••';
      } else if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
        clean[k] = this._sanitizePayload(v);
      } else {
        clean[k] = v;
      }
    }
    return clean;
  }

  /**
   * Detects whether a job is malformed or in an impossible state (poison).
   *
   * @private
   */
  _detectPoisonJob(jobData) {
    if (!jobData || typeof jobData !== 'object') {
      return 'Job payload is not an object';
    }
    if (!jobData.jobId) {
      return 'Missing jobId';
    }
    if (!jobData.organizationId) {
      return 'Missing organizationId';
    }
    if (!jobData.integrationId) {
      return 'Missing integrationId';
    }
    if (!jobData.provider) {
      return 'Missing provider';
    }
    if (!SUPPORTED_PROVIDERS.includes(String(jobData.provider).toUpperCase())) {
      return `Unsupported provider: ${jobData.provider}`;
    }
    if (typeof jobData.payload !== 'object') {
      return 'Invalid payload structure';
    }
    return null;
  }

  /**
   * Cleans an error message to ensure no secrets remain.
   *
   * @private
   */
  _cleanErrorMessage(msg) {
    if (!msg) return null;
    return String(msg)
      .replace(/(Bearer\s+)[^\s,;'"]+/gi, '$1••••••••')
      .replace(/(Basic\s+)[^\s,;'"]+/gi, '$1••••••••')
      .replace(/((?:password|api[_-]?token|secret|webhookSecret|routing[_-]?key)\s*[:=\s]\s*)[^\s,;'"]+/gi, '$1••••••••');
  }
}

module.exports = new OutboundDispatchService();
