/**
 * 🛡️ CyberShield X — CloudIngestionController (Phase 80 Step 7)
 *
 * Multi-Cloud Ingestion Controller for AWS SNS, GCP Pub/Sub, and Azure Event Grid:
 * - Enforces authoritative processing order:
 *   1. Request body-size limit (2MB) & connector-scoped rate limit (600 req/min).
 *   2. Connector resolution from authoritative configuration registry (never from payload).
 *   3. Authenticity verification via CloudSignatureVerifier (connected & air-gapped modes).
 *   4. Subscription handshake handling (AWS SubscriptionConfirmation, Azure SubscriptionValidation).
 *   5. Telemetry normalization via CloudTelemetryNormalizer.
 *   6. Synchronous durable persistence via CloudPersistenceService.persist().
 *   7. Asynchronous, non-blocking Data Fabric projection via CloudDataFabricAdapter.
 *   8. Provider-compatible HTTP acknowledgment (202 CREATED, 200 DUPLICATE, 503 PERSISTENCE_FAILURE).
 *
 * Invariant Guarantees:
 * - HTTP 202 is NEVER returned before CloudPersistenceService confirms durable MongoDB commit.
 * - Data Fabric graph projection is asynchronous and never blocks HTTP acknowledgment.
 * - Subscription handshakes are authenticated before response and never stored as telemetry.
 * - Zero query-string credential acceptance.
 * - Zero sensitive credentials exposed in logs or error responses.
 */

'use strict';

const { CloudSignatureVerifier } = require('../services/ingestion/CloudSignatureVerifier');
const CloudTelemetryNormalizer = require('../services/ingestion/CloudTelemetryNormalizer');
const { CloudPersistenceService } = require('../services/ingestion/CloudPersistenceService');
const { CloudDataFabricAdapter } = require('../services/ingestion/CloudDataFabricAdapter');
const { defaultObservabilityService } = require('../services/ingestion/CloudObservabilityService');
const logger = require('../utils/logger');

// Max body size in bytes: 2 MB
const MAX_BODY_BYTES = 2 * 1024 * 1024;

/**
 * In-Memory Connector Registry supporting runtime registration and resolution.
 */
class CloudConnectorRegistry {
  constructor() {
    this.connectors = new Map();
  }

  /**
   * Register a connector configuration.
   *
   * @param {Object} config
   */
  registerConnector(config) {
    if (!config || !config.connectorId) {
      throw new Error('Connector ID is required');
    }
    const cleanId = String(config.connectorId).trim();
    this.connectors.set(cleanId, {
      ...config,
      connectorId: cleanId,
      provider: String(config.provider || '').toUpperCase(),
      organizationId: config.organizationId,
      enrolledAccountIds: Array.isArray(config.enrolledAccountIds)
        ? config.enrolledAccountIds.map(String)
        : [],
    });
  }

  /**
   * Retrieve a connector configuration by ID.
   *
   * @param {string} connectorId
   * @returns {Object|null}
   */
  getConnector(connectorId) {
    if (!connectorId) return null;
    return this.connectors.get(String(connectorId).trim()) || null;
  }

  /**
   * Remove a connector from the registry.
   *
   * @param {string} connectorId
   */
  removeConnector(connectorId) {
    if (!connectorId) return;
    this.connectors.delete(String(connectorId).trim());
  }

  /**
   * Clear all registered connectors (primarily for testing isolation).
   */
  clearConnectors() {
    this.connectors.clear();
  }
}

const connectorRegistry = new CloudConnectorRegistry();
const signatureVerifier = new CloudSignatureVerifier();

class CloudIngestionController {
  constructor(verifier = signatureVerifier, registry = connectorRegistry, observability = defaultObservabilityService) {
    this.verifier = verifier;
    this.registry = registry;
    this.observability = observability;
  }

  /**
   * Safe non-blocking hook wrapper ensuring observability failures never impact request processing.
   */
  safeRecord(fn) {
    try {
      if (this.observability && typeof fn === 'function') {
        fn(this.observability);
      }
    } catch (err) {
      // Ingestion proceeds uninterrupted
    }
  }

  /**
   * Helper to resolve connector configuration from URL params or headers.
   *
   * @param {Object} req
   * @param {string} expectedProvider - 'AWS' | 'GCP' | 'AZURE'
   * @returns {Object|null}
   */
  resolveConnector(req, expectedProvider) {
    const connectorId =
      req.params.connectorId ||
      req.headers['x-connector-id'] ||
      req.headers['x-cybershield-connector-id'];

    if (!connectorId) return null;

    const config = this.registry.getConnector(connectorId);
    if (!config) return null;

    if (expectedProvider && config.provider !== expectedProvider) {
      return { error: 'PROVIDER_MISMATCH' };
    }

    return config;
  }

  /**
   * Prohibit query-string credentials across all endpoints.
   *
   * @param {Object} query
   * @returns {boolean} True if query contains forbidden credentials
   */
  hasForbiddenQueryCredentials(query) {
    if (!query || typeof query !== 'object') return false;
    const forbiddenKeys = [
      'token',
      'key',
      'secret',
      'sig',
      'signature',
      'apikey',
      'accesskey',
      'auth',
      'authorization',
      'password',
    ];
    return Object.keys(query).some((k) => forbiddenKeys.includes(k.toLowerCase().trim()));
  }

  /**
   * Convert verification failure reasons into safe, structured HTTP responses.
   *
   * @param {Object} verificationResult
   * @param {Object} res
   * @returns {Object} Express response
   */
  handleVerificationFailure(verificationResult, res) {
    const reason = verificationResult.reason || 'AUTHENTICATION_FAILED';

    switch (reason) {
      case 'QUERY_SECRET_PROHIBITED':
        return res.status(400).json({
          error: 'QUERY_SECRET_PROHIBITED',
          message: 'Passing credentials in query parameters is strictly prohibited',
        });

      case 'STALE_TRANSPORT':
      case 'TRANSPORT_TIMESTAMP_EXPIRED':
        return res.status(400).json({
          error: 'TRANSPORT_TIMESTAMP_EXPIRED',
          message: 'Transport delivery timestamp is expired (>15 minutes old)',
        });

      case 'FUTURE_TRANSPORT':
      case 'FUTURE_CLOCK_SKEW_EXCEEDED':
        return res.status(400).json({
          error: 'FUTURE_CLOCK_SKEW_EXCEEDED',
          message: 'Transport timestamp exceeds future clock skew allowance (>5 minutes in future)',
        });

      case 'TENANT_MISMATCH':
        return res.status(403).json({
          error: 'TENANT_MISMATCH',
          message: 'Payload or header specifies a differing organization context',
        });

      case 'CLOUD_ACCOUNT_MISMATCH':
        return res.status(403).json({
          error: 'CLOUD_ACCOUNT_MISMATCH',
          message: 'Cloud account ID is not enrolled in this connector',
        });

      case 'MISSING_AUTHENTICATION':
      case 'INVALID_SIGNATURE':
      case 'INVALID_SHARED_SECRET':
      case 'INVALID_OIDC_TOKEN':
      case 'EXPIRED_OIDC_TOKEN':
      case 'INVALID_JWKS_KEY':
      case 'CERT_VERIFICATION_FAILED':
        return res.status(401).json({
          error: 'UNAUTHORIZED',
          message: 'Provider authenticity verification failed',
        });

      case 'SSRF_BLOCKED':
      case 'INVALID_CERT_URL':
      case 'CERT_FETCH_FAILED':
        return res.status(400).json({
          error: 'INVALID_SIGNING_CERTIFICATE',
          message: 'The certificate URL is invalid, unsafe, or unreachable',
        });

      default:
        return res.status(400).json({
          error: 'VERIFICATION_FAILED',
          message: 'Request failed transport security validation',
        });
    }
  }

  /**
   * Handle AWS SNS Ingestion (Notification & SubscriptionConfirmation).
   *
   * Route: POST /api/ingestion/cloud/aws/:connectorId (or /aws with x-connector-id)
   */
  async handleAws(req, res) {
    const startTime = Date.now();
    this.safeRecord((obs) => obs.recordRequest('AWS'));

    try {
      // 1. Prohibit query-string secrets
      if (this.hasForbiddenQueryCredentials(req.query)) {
        this.safeRecord((obs) => obs.recordRejected('AWS', 'QUERY_SECRET_PROHIBITED'));
        return res.status(400).json({
          error: 'QUERY_SECRET_PROHIBITED',
          message: 'Passing credentials in query parameters is strictly prohibited',
        });
      }

      // 2. Resolve connector configuration
      const connectorConfig = this.resolveConnector(req, 'AWS');
      if (!connectorConfig) {
        this.safeRecord((obs) => obs.recordRejected('AWS', 'MALFORMED_REQUEST'));
        return res.status(404).json({
          error: 'CONNECTOR_NOT_FOUND',
          message: 'The requested AWS connector configuration was not found',
        });
      }
      if (connectorConfig.error === 'PROVIDER_MISMATCH') {
        this.safeRecord((obs) => obs.recordRejected('AWS', 'MALFORMED_REQUEST'));
        return res.status(400).json({
          error: 'PROVIDER_MISMATCH',
          message: 'Connector provider does not match endpoint provider AWS',
        });
      }

      // 3. Cryptographic & Transport Verification
      const requestData = {
        body: req.body,
        headers: req.headers,
        query: req.query,
        meta: {
          organizationId: connectorConfig.organizationId,
        },
      };

      const tVer = Date.now();
      const verificationResult = await this.verifier.verifyAwsSns(requestData, connectorConfig);
      this.safeRecord((obs) => obs.recordVerificationDuration(Date.now() - tVer));

      if (!verificationResult.isValid) {
        this.safeRecord((obs) => {
          const reason = verificationResult.reason || 'AUTHENTICATION_FAILURE';
          obs.recordVerificationFailure('AWS', reason);
          obs.recordRejected('AWS', reason);
        });
        return this.handleVerificationFailure(verificationResult, res);
      }

      // 4. Handle SubscriptionConfirmation Handshake
      const isSubConfirm = Boolean(
        verificationResult.isSubscriptionConfirmation || req.body?.Type === 'SubscriptionConfirmation'
      );
      if (isSubConfirm) {
        if (connectorConfig.autoConfirm || verificationResult.confirmed) {
          logger.info(`[CloudIngestion] AWS SNS Subscription confirmed for connector ${connectorConfig.connectorId}`);
          return res.status(200).json({
            status: 'SUBSCRIPTION_CONFIRMED',
            message: 'AWS SNS subscription successfully confirmed',
          });
        } else {
          logger.info(`[CloudIngestion] AWS SNS Subscription staged for connector ${connectorConfig.connectorId}`);
          return res.status(200).json({
            status: 'SUBSCRIPTION_STAGED',
            message: 'AWS SNS subscription staged for manual confirmation',
          });
        }
      }

      // 5. Telemetry Normalization
      const verificationContext = {
        ...verificationResult,
        connectorId: connectorConfig.connectorId,
        enrolledAccountIds: connectorConfig.enrolledAccountIds,
        provider: 'AWS',
        organizationId: connectorConfig.organizationId,
      };

      const tNorm = Date.now();
      const normResult = CloudTelemetryNormalizer.normalize(req.body, verificationContext);
      this.safeRecord((obs) => obs.recordNormalizationDuration(Date.now() - tNorm));

      if (!normResult || !normResult.success || !normResult.event) {
        logger.warn(`[CloudIngestion] AWS normalization failed: ${normResult?.reason || 'UNKNOWN'}`);
        const reason = normResult?.reason || 'NORMALIZATION_FAILED';
        this.safeRecord((obs) => obs.recordRejected('AWS', reason));
        const statusCode = reason === 'CLOUD_ACCOUNT_MISMATCH' || reason === 'TENANT_MISMATCH' ? 403 : 400;
        return res.status(statusCode).json({
          error: reason,
          message: normResult?.message || 'Telemetry payload could not be normalized',
        });
      }
      const normalizedEvent = normResult.event;

      // 6. Synchronous Durable Persistence
      const tPersist = Date.now();
      const persistResult = await CloudPersistenceService.persist(normalizedEvent, verificationContext);
      this.safeRecord((obs) => obs.recordPersistenceDuration(Date.now() - tPersist));

      // 7. Evaluate Durable Persistence Status
      if (persistResult.status === 'CREATED') {
        this.safeRecord((obs) => {
          obs.recordAccepted('AWS');
          obs.recordTotalDuration(Date.now() - startTime);
        });

        // Asynchronously project into Data Fabric (non-blocking, never delays response)
        setImmediate(() => {
          CloudDataFabricAdapter.projectEvent(persistResult.event).catch((projErr) => {
            logger.warn(`[CloudIngestion] Async graph projection warning: ${projErr.message}`);
          });
        });

        return res.status(202).json({
          status: 'ACCEPTED',
          canonicalEventId: persistResult.canonicalEventId,
          nativeEventId: persistResult.nativeEventId,
        });
      } else if (persistResult.status === 'DUPLICATE') {
        this.safeRecord((obs) => {
          obs.recordDuplicate('AWS');
          obs.recordTotalDuration(Date.now() - startTime);
        });

        return res.status(200).json({
          status: 'DUPLICATE_ACKNOWLEDGED',
          canonicalEventId: persistResult.canonicalEventId,
          nativeEventId: persistResult.nativeEventId,
          isDuplicate: true,
        });
      } else if (persistResult.status === 'PERSISTENCE_FAILURE') {
        this.safeRecord((obs) => {
          obs.recordPersistenceFailure('AWS');
          obs.recordRejected('AWS', 'PERSISTENCE_FAILURE');
        });
        logger.error(`[CloudIngestion] MongoDB commit failed for event ${persistResult.canonicalEventId}`);
        return res.status(503).json({
          error: 'PERSISTENCE_FAILURE',
          message: 'Durable persistence commit failed',
        });
      } else {
        const reason = persistResult.reason || 'PERSISTENCE_REJECTED';
        this.safeRecord((obs) => obs.recordRejected('AWS', reason));
        const statusCode = reason === 'TENANT_MISMATCH' || reason === 'CLOUD_ACCOUNT_MISMATCH' ? 403 : 400;
        return res.status(statusCode).json({
          error: 'PERSISTENCE_REJECTED',
          reason: persistResult.reason,
        });
      }
    } catch (err) {
      this.safeRecord((obs) => obs.recordRejected('AWS', 'INTERNAL_ERROR'));
      logger.error(`[CloudIngestion] Internal error in handleAws: ${err.message}`);
      return res.status(500).json({
        error: 'INTERNAL_INGESTION_ERROR',
        message: 'An internal error occurred while processing the telemetry event',
      });
    }
  }

  /**
   * Handle GCP Pub/Sub Ingestion.
   *
   * Route: POST /api/ingestion/cloud/gcp/:connectorId (or /gcp with x-connector-id)
   */
  async handleGcp(req, res) {
    const startTime = Date.now();
    this.safeRecord((obs) => obs.recordRequest('GCP'));

    try {
      // 1. Prohibit query-string secrets
      if (this.hasForbiddenQueryCredentials(req.query)) {
        this.safeRecord((obs) => obs.recordRejected('GCP', 'QUERY_SECRET_PROHIBITED'));
        return res.status(400).json({
          error: 'QUERY_SECRET_PROHIBITED',
          message: 'Passing credentials in query parameters is strictly prohibited',
        });
      }

      // 2. Resolve connector configuration
      const connectorConfig = this.resolveConnector(req, 'GCP');
      if (!connectorConfig) {
        this.safeRecord((obs) => obs.recordRejected('GCP', 'MALFORMED_REQUEST'));
        return res.status(404).json({
          error: 'CONNECTOR_NOT_FOUND',
          message: 'The requested GCP connector configuration was not found',
        });
      }
      if (connectorConfig.error === 'PROVIDER_MISMATCH') {
        this.safeRecord((obs) => obs.recordRejected('GCP', 'MALFORMED_REQUEST'));
        return res.status(400).json({
          error: 'PROVIDER_MISMATCH',
          message: 'Connector provider does not match endpoint provider GCP',
        });
      }

      // 3. Authenticity Verification
      const requestData = {
        body: req.body,
        headers: req.headers,
        query: req.query,
        meta: {
          organizationId: connectorConfig.organizationId,
        },
      };

      const tVer = Date.now();
      const verificationResult = await this.verifier.verifyGcp(requestData, connectorConfig);
      this.safeRecord((obs) => obs.recordVerificationDuration(Date.now() - tVer));

      if (!verificationResult.isValid) {
        this.safeRecord((obs) => {
          const reason = verificationResult.reason || 'AUTHENTICATION_FAILURE';
          obs.recordVerificationFailure('GCP', reason);
          obs.recordRejected('GCP', reason);
        });
        return this.handleVerificationFailure(verificationResult, res);
      }

      // 4. Telemetry Normalization
      const verificationContext = {
        ...verificationResult,
        connectorId: connectorConfig.connectorId,
        enrolledAccountIds: connectorConfig.enrolledAccountIds,
        provider: 'GCP',
        organizationId: connectorConfig.organizationId,
      };

      const tNorm = Date.now();
      const normResult = CloudTelemetryNormalizer.normalize(req.body, verificationContext);
      this.safeRecord((obs) => obs.recordNormalizationDuration(Date.now() - tNorm));

      if (!normResult || !normResult.success || !normResult.event) {
        logger.warn(`[CloudIngestion] GCP normalization failed: ${normResult?.reason || 'UNKNOWN'}`);
        const reason = normResult?.reason || 'NORMALIZATION_FAILED';
        this.safeRecord((obs) => obs.recordRejected('GCP', reason));
        const statusCode = reason === 'CLOUD_ACCOUNT_MISMATCH' || reason === 'TENANT_MISMATCH' ? 403 : 400;
        return res.status(statusCode).json({
          error: reason,
          message: normResult?.message || 'Telemetry payload could not be normalized',
        });
      }
      const normalizedEvent = normResult.event;

      // 5. Synchronous Durable Persistence
      const tPersist = Date.now();
      const persistResult = await CloudPersistenceService.persist(normalizedEvent, verificationContext);
      this.safeRecord((obs) => obs.recordPersistenceDuration(Date.now() - tPersist));

      // 6. Evaluate Durable Persistence Status
      if (persistResult.status === 'CREATED') {
        this.safeRecord((obs) => {
          obs.recordAccepted('GCP');
          obs.recordTotalDuration(Date.now() - startTime);
        });

        // Asynchronously project into Data Fabric (non-blocking)
        setImmediate(() => {
          CloudDataFabricAdapter.projectEvent(persistResult.event).catch((projErr) => {
            logger.warn(`[CloudIngestion] Async graph projection warning: ${projErr.message}`);
          });
        });

        return res.status(202).json({
          status: 'ACCEPTED',
          canonicalEventId: persistResult.canonicalEventId,
          nativeEventId: persistResult.nativeEventId,
        });
      } else if (persistResult.status === 'DUPLICATE') {
        this.safeRecord((obs) => {
          obs.recordDuplicate('GCP');
          obs.recordTotalDuration(Date.now() - startTime);
        });

        return res.status(200).json({
          status: 'DUPLICATE_ACKNOWLEDGED',
          canonicalEventId: persistResult.canonicalEventId,
          nativeEventId: persistResult.nativeEventId,
          isDuplicate: true,
        });
      } else if (persistResult.status === 'PERSISTENCE_FAILURE') {
        this.safeRecord((obs) => {
          obs.recordPersistenceFailure('GCP');
          obs.recordRejected('GCP', 'PERSISTENCE_FAILURE');
        });
        logger.error(`[CloudIngestion] MongoDB commit failed for event ${persistResult.canonicalEventId}`);
        return res.status(503).json({
          error: 'PERSISTENCE_FAILURE',
          message: 'Durable persistence commit failed',
        });
      } else {
        const reason = persistResult.reason || 'PERSISTENCE_REJECTED';
        this.safeRecord((obs) => obs.recordRejected('GCP', reason));
        const statusCode = reason === 'TENANT_MISMATCH' || reason === 'CLOUD_ACCOUNT_MISMATCH' ? 403 : 400;
        return res.status(statusCode).json({
          error: 'PERSISTENCE_REJECTED',
          reason: persistResult.reason,
        });
      }
    } catch (err) {
      this.safeRecord((obs) => obs.recordRejected('GCP', 'INTERNAL_ERROR'));
      logger.error(`[CloudIngestion] Internal error in handleGcp: ${err.message}`);
      return res.status(500).json({
        error: 'INTERNAL_INGESTION_ERROR',
        message: 'An internal error occurred while processing the telemetry event',
      });
    }
  }

  /**
   * Handle Azure Event Grid Ingestion (Telemetry & SubscriptionValidation Handshake).
   *
   * Route: POST /api/ingestion/cloud/azure/:connectorId (or /azure with x-connector-id)
   */
  async handleAzure(req, res) {
    const startTime = Date.now();
    this.safeRecord((obs) => obs.recordRequest('AZURE'));

    try {
      // 1. Prohibit query-string secrets
      if (this.hasForbiddenQueryCredentials(req.query)) {
        this.safeRecord((obs) => obs.recordRejected('AZURE', 'QUERY_SECRET_PROHIBITED'));
        return res.status(400).json({
          error: 'QUERY_SECRET_PROHIBITED',
          message: 'Passing credentials in query parameters is strictly prohibited',
        });
      }

      // 2. Resolve connector configuration
      const connectorConfig = this.resolveConnector(req, 'AZURE');
      if (!connectorConfig) {
        this.safeRecord((obs) => obs.recordRejected('AZURE', 'MALFORMED_REQUEST'));
        return res.status(404).json({
          error: 'CONNECTOR_NOT_FOUND',
          message: 'The requested Azure connector configuration was not found',
        });
      }
      if (connectorConfig.error === 'PROVIDER_MISMATCH') {
        this.safeRecord((obs) => obs.recordRejected('AZURE', 'MALFORMED_REQUEST'));
        return res.status(400).json({
          error: 'PROVIDER_MISMATCH',
          message: 'Connector provider does not match endpoint provider AZURE',
        });
      }

      // 3. Authenticity & Handshake Verification
      const requestData = {
        body: req.body,
        headers: req.headers,
        query: req.query,
        meta: {
          organizationId: connectorConfig.organizationId,
        },
      };

      const tVer = Date.now();
      const verificationResult = await this.verifier.verifyAzure(requestData, connectorConfig);
      this.safeRecord((obs) => obs.recordVerificationDuration(Date.now() - tVer));

      if (!verificationResult.isValid) {
        this.safeRecord((obs) => {
          const reason = verificationResult.reason || 'AUTHENTICATION_FAILURE';
          obs.recordVerificationFailure('AZURE', reason);
          obs.recordRejected('AZURE', reason);
        });
        return this.handleVerificationFailure(verificationResult, res);
      }

      // 4. Synchronous SubscriptionValidation Challenge-Response
      if (verificationResult.isSubscriptionValidation) {
        logger.info(`[CloudIngestion] Azure SubscriptionValidation handshake answered for connector ${connectorConfig.connectorId}`);
        // Return required Event Grid validation format
        return res.status(200).json({
          validationResponse: verificationResult.validationResponse,
        });
      }

      // 5. Telemetry Normalization
      const verificationContext = {
        ...verificationResult,
        connectorId: connectorConfig.connectorId,
        enrolledAccountIds: connectorConfig.enrolledAccountIds,
        provider: 'AZURE',
        organizationId: connectorConfig.organizationId,
      };

      const tNorm = Date.now();
      const normResult = CloudTelemetryNormalizer.normalize(req.body, verificationContext);
      this.safeRecord((obs) => obs.recordNormalizationDuration(Date.now() - tNorm));

      if (!normResult || !normResult.success || !normResult.event) {
        logger.warn(`[CloudIngestion] Azure normalization failed: ${normResult?.reason || 'UNKNOWN'}`);
        const reason = normResult?.reason || 'NORMALIZATION_FAILED';
        this.safeRecord((obs) => obs.recordRejected('AZURE', reason));
        const statusCode = reason === 'CLOUD_ACCOUNT_MISMATCH' || reason === 'TENANT_MISMATCH' ? 403 : 400;
        return res.status(statusCode).json({
          error: reason,
          message: normResult?.message || 'Telemetry payload could not be normalized',
        });
      }
      const normalizedEvent = normResult.event;

      // 6. Synchronous Durable Persistence
      const tPersist = Date.now();
      const persistResult = await CloudPersistenceService.persist(normalizedEvent, verificationContext);
      this.safeRecord((obs) => obs.recordPersistenceDuration(Date.now() - tPersist));

      // 7. Evaluate Durable Persistence Status
      if (persistResult.status === 'CREATED') {
        this.safeRecord((obs) => {
          obs.recordAccepted('AZURE');
          obs.recordTotalDuration(Date.now() - startTime);
        });

        // Asynchronously project into Data Fabric (non-blocking)
        setImmediate(() => {
          CloudDataFabricAdapter.projectEvent(persistResult.event).catch((projErr) => {
            logger.warn(`[CloudIngestion] Async graph projection warning: ${projErr.message}`);
          });
        });

        return res.status(202).json({
          status: 'ACCEPTED',
          canonicalEventId: persistResult.canonicalEventId,
          nativeEventId: persistResult.nativeEventId,
        });
      } else if (persistResult.status === 'DUPLICATE') {
        this.safeRecord((obs) => {
          obs.recordDuplicate('AZURE');
          obs.recordTotalDuration(Date.now() - startTime);
        });

        return res.status(200).json({
          status: 'DUPLICATE_ACKNOWLEDGED',
          canonicalEventId: persistResult.canonicalEventId,
          nativeEventId: persistResult.nativeEventId,
          isDuplicate: true,
        });
      } else if (persistResult.status === 'PERSISTENCE_FAILURE') {
        this.safeRecord((obs) => {
          obs.recordPersistenceFailure('AZURE');
          obs.recordRejected('AZURE', 'PERSISTENCE_FAILURE');
        });
        logger.error(`[CloudIngestion] MongoDB commit failed for event ${persistResult.canonicalEventId}`);
        return res.status(503).json({
          error: 'PERSISTENCE_FAILURE',
          message: 'Durable persistence commit failed',
        });
      } else {
        const reason = persistResult.reason || 'PERSISTENCE_REJECTED';
        this.safeRecord((obs) => obs.recordRejected('AZURE', reason));
        const statusCode = reason === 'TENANT_MISMATCH' || reason === 'CLOUD_ACCOUNT_MISMATCH' ? 403 : 400;
        return res.status(statusCode).json({
          error: 'PERSISTENCE_REJECTED',
          reason: persistResult.reason,
        });
      }
    } catch (err) {
      this.safeRecord((obs) => obs.recordRejected('AZURE', 'INTERNAL_ERROR'));
      logger.error(`[CloudIngestion] Internal error in handleAzure: ${err.message}`);
      return res.status(500).json({
        error: 'INTERNAL_INGESTION_ERROR',
        message: 'An internal error occurred while processing the telemetry event',
      });
    }
  }

  /**
   * Health status endpoint for Phase 80 ingestion subsystem.
   *
   * Route: GET /api/ingestion/cloud/health
   */
  async getHealth(req, res) {
    try {
      const health = await this.observability.getHealth();
      const statusCode = health.status === 'HEALTHY' || health.status === 'DEGRADED' ? 200 : 503;
      return res.status(statusCode).json(health);
    } catch (err) {
      return res.status(503).json({
        status: 'UNAVAILABLE',
        timestamp: new Date().toISOString(),
        error: 'HEALTH_CHECK_FAILED',
        message: 'Subsystem health evaluation failed',
      });
    }
  }

  /**
   * Telemetry metrics endpoint for Phase 80 ingestion subsystem.
   *
   * Route: GET /api/ingestion/cloud/metrics
   */
  getMetrics(req, res) {
    try {
      const metrics = this.observability.getMetrics();
      return res.status(200).json(metrics);
    } catch (err) {
      return res.status(500).json({
        error: 'METRICS_FETCH_FAILED',
        message: 'Subsystem metrics evaluation failed',
      });
    }
  }
}

const defaultController = new CloudIngestionController();
defaultController.CloudIngestionController = CloudIngestionController;
defaultController.connectorRegistry = connectorRegistry;
defaultController.CloudConnectorRegistry = CloudConnectorRegistry;
defaultController.MAX_BODY_BYTES = MAX_BODY_BYTES;

module.exports = defaultController;
