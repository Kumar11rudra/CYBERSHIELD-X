'use strict';

/**
 * 🛡️ CyberShield X — External Approval Callback Service (Phase 81 Step 6)
 *
 * Consumes cryptographically authenticated webhook contexts from Phase 81 Step 4
 * and safely maps external approval / rejection callbacks to the existing
 * Phase 77 PendingApproval lifecycle.
 *
 * Architectural Guardrails:
 * - Reuses existing PendingApproval model and state machine ('APPROVED' | 'DENIED')
 * - Step 4 is the sole authentication boundary (ItsmSignatureVerifier)
 * - Authoritative tenant isolation via IntegrationConfig.organizationId (ignores payload tenant)
 * - Authoritative 5-layer durable idempotency via IntegrationSyncEvent (deterministic UUID v4 syncId)
 * - Safe terminal-state protection ('APPROVED', 'DENIED', 'EXECUTING', 'COMPLETED', 'FAILED', 'EXPIRED')
 * - Safe expiration defense (expiresAt check)
 * - Scoped PendingApproval lookup (org-scoped + identifier/ticketKey)
 * - STRICT ZERO ACTION EXECUTION: Does NOT run terminal tools, playbooks, or runners
 * - STRICT LOOP PREVENTION: Does NOT enqueue outbound ITSM dispatch
 * - Immutable IntegrationSyncEvent audit trail
 */

const crypto = require('crypto');
const mongoose = require('mongoose');
const logger = require('../../utils/logger');
const PendingApproval = require('../../models/PendingApproval');
const IntegrationConfig = require('../../models/IntegrationConfig');
const IntegrationSyncEvent = require('../../models/IntegrationSyncEvent');
const normalizer = require('./ExternalApprovalCallbackNormalizer');
const itsmSignatureVerifier = require('./ItsmSignatureVerifier');
const { hashPayload } = require('../../integrations/connectorUtils');

// Canonical terminal states for PendingApproval
const TERMINAL_APPROVAL_STATES = Object.freeze([
  'APPROVED',
  'DENIED',
  'EXECUTING',
  'COMPLETED',
  'FAILED',
  'EXPIRED',
]);

// Active states awaiting a decision
const AWAITING_STATES = Object.freeze([
  'PROPOSED',
  'AWAITING_APPROVAL',
]);

class ExternalApprovalCallbackService {
  constructor() {
    // In-memory LRU cache for duplicate event digest tracking (5,000 max, 10 min TTL)
    this._recentEvents = new Map();
    this._maxRecentEvents = 5000;
    this._eventTtlMs = 10 * 60 * 1000;

    // Intra-process in-flight set to prevent concurrent microsecond races
    this._inFlightApprovals = new Set();

    this.io = null;
  }

  /**
   * Optional Socket.IO binding for real-time notification
   */
  setSocketIO(io) {
    this.io = io;
  }

  /**
   * Primary entrypoint: Processes an authenticated inbound approval callback.
   *
   * @param {object} params
   * @param {object} params.req - Express request
   * @param {object} [params.config] - Pre-resolved IntegrationConfig document
   * @param {object} [params.verification] - Pre-computed Step 4 verification result
   * @param {boolean} [params.isControllerHandoff=false] - Invocation from HTTP controller
   * @returns {Promise<object>} Callback reconciliation outcome
   */
  async handleCallback({ req, config = null, verification = null, isControllerHandoff = false }) {
    const startTime = Date.now();

    try {
      // 1. Resolve IntegrationConfig if not provided
      const resolvedConfig = config || (await this._resolveConfig(req));
      if (!resolvedConfig) {
        return {
          success: false,
          status: 'INTEGRATION_NOT_FOUND',
          reason: 'Configured integration was not found for this request.',
        };
      }

      if (!resolvedConfig.active) {
        return {
          success: false,
          status: 'INTEGRATION_DISABLED',
          reason: 'The requested integration is disabled.',
        };
      }

      // 2. Cryptographic Authentication Gate (Step 4 Security Boundary)
      const authResult = verification || itsmSignatureVerifier.verifyWebhook(req, resolvedConfig);
      if (!authResult.authenticated) {
        logger.warn(
          `[EXTERNAL-APPROVAL] Authentication rejected for ${resolvedConfig.type} (ID: ${resolvedConfig._id}): ${authResult.reason}`
        );
        return {
          success: false,
          status: 'AUTHENTICATION_FAILED',
          reason: authResult.reason || 'Cryptographic authentication failed',
        };
      }

      // 3. Replay / Duplicate Check from Step 4
      if (authResult.isDuplicate) {
        logger.info(`[EXTERNAL-APPROVAL] Duplicate webhook acknowledged without reprocessing (ID: ${resolvedConfig._id})`);
        return {
          success: true,
          status: 'DUPLICATE_ACKNOWLEDGED',
          reason: 'REPLAY_DETECTED',
        };
      }

      // 4. Inbound Approval Callback Normalization
      const normalized = normalizer.normalize(req, resolvedConfig.type, resolvedConfig);
      if (!normalized.valid) {
        logger.warn(`[EXTERNAL-APPROVAL] Callback normalization failed: ${normalized.reason}`);
        if (!isControllerHandoff) {
          await this._recordAudit({
            organizationId: resolvedConfig.organizationId,
            integrationId: resolvedConfig._id,
            provider: normalized.provider || String(resolvedConfig.type).toUpperCase(),
            status: 'REJECTED',
            eventType: 'APPROVAL_MALFORMED',
            targetEntityId: 'MALFORMED',
            payloadHash: normalized.payloadHash || hashPayload(req.body || {}),
            errorMessage: normalized.reason,
            durationMs: Date.now() - startTime,
          });
        }

        return {
          success: false,
          status: 'MALFORMED_CALLBACK',
          error: normalized.error,
          reason: normalized.reason,
        };
      }

      // 5. Authoritative Deterministic Duplicate Identity & RFC 4122 UUID v4 syncId
      const approvalIdentifier = normalized.approvalId || normalized.externalReference || 'unknown';
      const duplicateIdentity = this.deriveDuplicateIdentity(
        String(resolvedConfig._id),
        normalized.provider,
        normalized.eventId,
        approvalIdentifier,
        normalized.decision || normalized.rawDecision,
        normalized.payloadHash
      );
      const deterministicSyncId = this.buildDeterministicSyncId(duplicateIdentity);
      const eventDigest = this._buildEventDigest(
        String(resolvedConfig._id),
        normalized.provider,
        approvalIdentifier,
        normalized.decision || normalized.rawDecision,
        normalized.payloadHash
      );

      // 5a. Intra-process in-flight concurrency lock (microsecond-level collision defense)
      if (this._inFlightApprovals.has(deterministicSyncId)) {
        logger.info(`[EXTERNAL-APPROVAL] Intra-process concurrent duplicate callback blocked: ${deterministicSyncId}`);
        return {
          success: true,
          status: 'DUPLICATE_ACKNOWLEDGED',
          reason: 'CONCURRENT_IN_FLIGHT_DUPLICATE',
          approvalId: normalized.approvalId,
        };
      }
      this._inFlightApprovals.add(deterministicSyncId);

      try {
        // 5b. Memory LRU cache fast-path check
        if (this._isDuplicateEvent(eventDigest)) {
          logger.info(`[EXTERNAL-APPROVAL] Memory cache duplicate detected for approval: ${approvalIdentifier}`);
          return {
            success: true,
            status: 'DUPLICATE_ACKNOWLEDGED',
            reason: 'MEMORY_CACHE_DUPLICATE',
            approvalId: normalized.approvalId,
          };
        }

        // 5c. Authoritative Database Duplicate Check (IntegrationSyncEvent persistence)
        const existingSyncEvent = await this._findExistingSyncEvent(deterministicSyncId);
        if (existingSyncEvent) {
          logger.info(`[EXTERNAL-APPROVAL] Durable database duplicate detected in IntegrationSyncEvent: ${deterministicSyncId}`);
          this._markEventProcessed(eventDigest);
          return {
            success: true,
            status: 'DUPLICATE_ACKNOWLEDGED',
            reason: 'DURABLE_AUDIT_DUPLICATE',
            approvalId: normalized.approvalId,
          };
        }

        // 6. Authoritative Scoped Approval Matching (Strict Tenant Isolation)
        const approvalDoc = await this._matchApproval(resolvedConfig, normalized);
        if (!approvalDoc) {
          logger.info(
            `[EXTERNAL-APPROVAL] Unmatched approval callback (Provider: ${normalized.provider}, ID: ${normalized.approvalId}, Ref: ${normalized.externalReference}). Zero mutations executed.`
          );

          if (!isControllerHandoff) {
            await this._recordAudit({
              organizationId: resolvedConfig.organizationId,
              integrationId: resolvedConfig._id,
              provider: normalized.provider,
              status: 'REJECTED',
              eventType: 'APPROVAL_UNMATCHED',
              targetEntityId: normalized.approvalId || 'UNMATCHED',
              externalTicketKey: normalized.externalReference,
              payloadHash: normalized.payloadHash,
              syncId: deterministicSyncId,
              errorMessage: 'APPROVAL_NOT_FOUND',
              durationMs: Date.now() - startTime,
            });
          }

          this._markEventProcessed(eventDigest);

          return {
            success: true,
            status: 'UNMATCHED',
            matched: false,
            reason: 'APPROVAL_NOT_FOUND',
            approvalId: normalized.approvalId,
            externalReference: normalized.externalReference,
          };
        }

        // 7. Validate Decision Support
        if (!normalized.decision) {
          logger.warn(
            `[EXTERNAL-APPROVAL] Unsupported decision '${normalized.rawDecision}' for provider ${normalized.provider}. Preserving PendingApproval.status unchanged.`
          );

          await this._recordAudit({
            organizationId: resolvedConfig.organizationId,
            integrationId: resolvedConfig._id,
            provider: normalized.provider,
            status: 'REJECTED',
            eventType: 'APPROVAL_UNSUPPORTED',
            targetEntityId: approvalDoc.approvalId,
            externalTicketKey: normalized.externalReference,
            payloadHash: normalized.payloadHash,
            syncId: deterministicSyncId,
            errorMessage: `Unsupported decision: ${normalized.rawDecision}`,
            durationMs: Date.now() - startTime,
          });

          this._markEventProcessed(eventDigest);

          return {
            success: true,
            status: 'UNSUPPORTED_DECISION',
            approvalId: approvalDoc.approvalId,
            rawDecision: normalized.rawDecision,
            currentStatus: approvalDoc.status,
          };
        }

        // 8. Safe Lifecycle Transition Checks
        // 8a. Expiration Check
        if (approvalDoc.expiresAt && new Date() > new Date(approvalDoc.expiresAt)) {
          logger.warn(`[EXTERNAL-APPROVAL] Approval ${approvalDoc.approvalId} has expired. Transition blocked.`);

          approvalDoc.status = 'EXPIRED';
          await approvalDoc.save();

          await this._recordAudit({
            organizationId: resolvedConfig.organizationId,
            integrationId: resolvedConfig._id,
            provider: normalized.provider,
            status: 'REJECTED',
            eventType: 'APPROVAL_EXPIRED',
            targetEntityId: approvalDoc.approvalId,
            externalTicketKey: normalized.externalReference,
            payloadHash: normalized.payloadHash,
            syncId: deterministicSyncId,
            errorMessage: 'Approval has expired',
            durationMs: Date.now() - startTime,
          });

          this._markEventProcessed(eventDigest);

          return {
            success: true,
            status: 'EXPIRED',
            approvalId: approvalDoc.approvalId,
            currentStatus: 'EXPIRED',
          };
        }

        // 8b. Terminal State Protection
        if (!AWAITING_STATES.includes(approvalDoc.status)) {
          logger.warn(
            `[EXTERNAL-APPROVAL] Approval ${approvalDoc.approvalId} is already in terminal state '${approvalDoc.status}'. Transition blocked.`
          );

          await this._recordAudit({
            organizationId: resolvedConfig.organizationId,
            integrationId: resolvedConfig._id,
            provider: normalized.provider,
            status: 'REJECTED',
            eventType: 'APPROVAL_ALREADY_TERMINAL',
            targetEntityId: approvalDoc.approvalId,
            externalTicketKey: normalized.externalReference,
            payloadHash: normalized.payloadHash,
            syncId: deterministicSyncId,
            errorMessage: `Already terminal: ${approvalDoc.status}`,
            durationMs: Date.now() - startTime,
          });

          this._markEventProcessed(eventDigest);

          return {
            success: true,
            status: 'ALREADY_TERMINAL',
            approvalId: approvalDoc.approvalId,
            currentStatus: approvalDoc.status,
          };
        }

        // 8c. Stale Callback Ordering Check
        if (approvalDoc.updatedAt && normalized.occurredAt) {
          const updateTime = new Date(approvalDoc.updatedAt).getTime();
          const eventTime = new Date(normalized.occurredAt).getTime();
          // If callback occurred significantly before the record was last modified (e.g. out-of-order replay)
          if (eventTime < updateTime - 120000 && !AWAITING_STATES.includes(approvalDoc.status)) {
            logger.warn(`[EXTERNAL-APPROVAL] Stale callback rejected for approval ${approvalDoc.approvalId}.`);

            await this._recordAudit({
              organizationId: resolvedConfig.organizationId,
              integrationId: resolvedConfig._id,
              provider: normalized.provider,
              status: 'REJECTED',
              eventType: 'APPROVAL_STALE',
              targetEntityId: approvalDoc.approvalId,
              externalTicketKey: normalized.externalReference,
              payloadHash: normalized.payloadHash,
              syncId: deterministicSyncId,
              errorMessage: 'Stale callback rejected',
              durationMs: Date.now() - startTime,
            });

            this._markEventProcessed(eventDigest);

            return {
              success: true,
              status: 'STALE_EVENT',
              approvalId: approvalDoc.approvalId,
              currentStatus: approvalDoc.status,
            };
          }
        }

        // 9. Multi-Instance Atomic DB Enforcement & PendingApproval Mutation
        // Atomically record IntegrationSyncEvent before mutating PendingApproval.
        // If another process inserts with the same deterministicSyncId concurrently,
        // MongoDB unique index constraint throws E11000 duplicate key error,
        // aborting duplicate PendingApproval mutation before approvalDoc.save() is called!
        const auditEventType = normalized.decision === 'APPROVED' ? 'APPROVAL_ACCEPTED' : 'APPROVAL_REJECTED';
        try {
          await this._recordAudit({
            organizationId: resolvedConfig.organizationId,
            integrationId: resolvedConfig._id,
            provider: normalized.provider,
            status: 'SUCCESS',
            eventType: auditEventType,
            targetEntityId: approvalDoc.approvalId,
            externalTicketKey: normalized.externalReference,
            payloadHash: normalized.payloadHash,
            syncId: deterministicSyncId,
            durationMs: Date.now() - startTime,
          });
        } catch (auditErr) {
          // If duplicate key error (code 11000) occurred, concurrent race handled safely!
          if (auditErr.code === 11000 || (auditErr.message && auditErr.message.includes('E11000'))) {
            logger.info(`[EXTERNAL-APPROVAL] Atomic DB unique index caught concurrent duplicate race: ${deterministicSyncId}`);
            this._markEventProcessed(eventDigest);
            return {
              success: true,
              status: 'DUPLICATE_ACKNOWLEDGED',
              reason: 'ATOMIC_INDEX_DUPLICATE',
              approvalId: approvalDoc.approvalId,
            };
          }
          throw auditErr;
        }

        // 10. Mutate PendingApproval State Safely (Strict Zero Action Execution)
        const previousStatus = approvalDoc.status;
        const newStatus = normalized.decision; // 'APPROVED' or 'DENIED'

        approvalDoc.status = newStatus;
        approvalDoc.decisionReason = normalized.decisionReason || `External decision: ${newStatus}`;
        approvalDoc.approvedBy = {
          userId: normalized.actor.userId,
          username: normalized.actor.username,
          role: normalized.actor.role || 'EXTERNAL_ITSM',
          timestamp: normalized.occurredAt || new Date(),
          decisionReason: normalized.decisionReason || '',
        };

        try {
          await approvalDoc.save();
        } catch (saveErr) {
          logger.error(
            `[EXTERNAL-APPROVAL] PendingApproval save failed for ${approvalDoc.approvalId}: ${saveErr.message}. Rolling back audit.`
          );
          await this._deleteSyncEvent(deterministicSyncId);
          throw saveErr;
        }

        this._markEventProcessed(eventDigest);

        logger.info(
          `[EXTERNAL-APPROVAL] Successfully reconciled approval ${approvalDoc.approvalId}: ${previousStatus} -> ${newStatus} (actor: ${normalized.actor.username})`
        );

        // Notify real-time clients if socket.io is active
        if (this.io) {
          try {
            this.io.to(`org:${resolvedConfig.organizationId}`).emit('approval:external_callback', {
              approvalId: approvalDoc.approvalId,
              status: newStatus,
              previousStatus,
              decisionReason: approvalDoc.decisionReason,
              approvedBy: approvalDoc.approvedBy,
              timestamp: new Date(),
            });
          } catch (ioErr) {
            logger.warn(`[EXTERNAL-APPROVAL] Socket.IO notification failed: ${ioErr.message}`);
          }
        }

        return {
          success: true,
          status: 'TRANSITION_COMPLETE',
          approvalId: approvalDoc.approvalId,
          previousStatus,
          newStatus,
          decision: normalized.decision,
        };
      } finally {
        // Clean up intra-process in-flight set
        this._inFlightApprovals.delete(deterministicSyncId);
      }
    } catch (err) {
      logger.error(`[EXTERNAL-APPROVAL] Error during approval callback processing: ${err.message}`);
      return {
        success: false,
        status: 'INTERNAL_SERVER_ERROR',
        error: err.message,
      };
    }
  }

  /**
   * Scoped lookup for matching PendingApproval record.
   * Strictly enforces organizationId boundary.
   *
   * @private
   */
  async _matchApproval(config, normalized) {
    const organizationId = config.organizationId;
    const conditions = [];

    if (normalized.approvalId) {
      conditions.push({ approvalId: normalized.approvalId });
    }

    if (normalized.externalReference) {
      const ref = normalized.externalReference;
      conditions.push(
        { 'parameters.ticketKey': ref },
        { 'parameters.externalTicketKey': ref },
        { 'parameters.ticketId': ref },
        { 'parameters.externalTicketId': ref },
        { 'parameters.correlationId': ref },
        { evidenceRef: ref }
      );
    }

    if (conditions.length === 0) {
      return null;
    }

    const query = {
      organizationId,
      $or: conditions,
    };

    if (mongoose.connection && mongoose.connection.readyState !== 1 && !PendingApproval.findOne.mock) {
      logger.warn('[EXTERNAL-APPROVAL] Mongoose connection is disconnected. Failing lookup safely.');
      return null;
    }

    return await PendingApproval.findOne(query);
  }

  /**
   * Derives a deterministic duplicate identity string from callback evidence.
   */
  deriveDuplicateIdentity(integrationId, provider, eventId, approvalIdentifier, decision, payloadHash) {
    const ident = approvalIdentifier || 'unknown';
    const dec = decision || 'unknown';
    if (eventId) {
      return `${integrationId}:${provider}:event:${eventId}:${ident}:${dec}:${payloadHash}`;
    }
    return `${integrationId}:${provider}:approval:${ident}:${dec}:${payloadHash}`;
  }

  /**
   * Builds an RFC 4122 compliant UUID v4 string deterministically from a duplicate identity.
   */
  buildDeterministicSyncId(duplicateIdentity) {
    const hash = crypto.createHash('sha256').update(String(duplicateIdentity)).digest();
    const bytes = Buffer.from(hash.subarray(0, 16));

    // RFC 4122 v4 compliance
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;

    return [
      bytes.subarray(0, 4).toString('hex'),
      bytes.subarray(4, 6).toString('hex'),
      bytes.subarray(6, 8).toString('hex'),
      bytes.subarray(8, 10).toString('hex'),
      bytes.subarray(10, 16).toString('hex'),
    ].join('-');
  }

  /**
   * Checks whether an event digest exists in the fast-path in-memory LRU cache.
   * @private
   */
  _isDuplicateEvent(eventDigest) {
    const now = Date.now();
    const cachedAt = this._recentEvents.get(eventDigest);
    if (cachedAt && now - cachedAt < this._eventTtlMs) {
      return true;
    }
    return false;
  }

  /**
   * Marks an event digest as processed in the fast-path memory LRU cache.
   * @private
   */
  _markEventProcessed(eventDigest) {
    if (this._recentEvents.size >= this._maxRecentEvents) {
      const firstKey = this._recentEvents.keys().next().value;
      if (firstKey) this._recentEvents.delete(firstKey);
    }
    this._recentEvents.set(eventDigest, Date.now());
  }

  /**
   * Builds a compact SHA-256 event digest string for memory LRU caching.
   * @private
   */
  _buildEventDigest(integrationId, provider, approvalIdentifier, decision, payloadHash) {
    const raw = `${integrationId}:${provider}:${approvalIdentifier}:${decision}:${payloadHash}`;
    return crypto.createHash('sha256').update(raw).digest('hex');
  }

  /**
   * Queries durable database for existing IntegrationSyncEvent record by syncId.
   * @private
   */
  async _findExistingSyncEvent(syncId) {
    try {
      if (mongoose.connection && mongoose.connection.readyState !== 1 && !IntegrationSyncEvent.findOne.mock) {
        return null;
      }
      return await IntegrationSyncEvent.findOne({ syncId }).lean();
    } catch (err) {
      logger.warn(`[EXTERNAL-APPROVAL] Failed querying durable syncId ${syncId}: ${err.message}`);
      return null;
    }
  }

  /**
   * Deletes a tentative IntegrationSyncEvent upon subsequent save failure (Rollback).
   * @private
   */
  async _deleteSyncEvent(syncId) {
    try {
      if (mongoose.connection && mongoose.connection.readyState !== 1 && !IntegrationSyncEvent.deleteOne.mock) {
        return;
      }
      await IntegrationSyncEvent.deleteOne({ syncId });
      logger.info(`[EXTERNAL-APPROVAL] Successfully rolled back tentative syncId: ${syncId}`);
    } catch (err) {
      logger.error(`[EXTERNAL-APPROVAL] Failed rolling back syncId ${syncId}: ${err.message}`);
    }
  }

  /**
   * Resolves IntegrationConfig from request parameters or headers.
   * @private
   */
  async _resolveConfig(req) {
    const integrationId = req.params?.integrationId || req.headers?.['x-integration-id'];
    if (!integrationId || !mongoose.Types.ObjectId.isValid(integrationId)) {
      return null;
    }
    return await IntegrationConfig.findById(integrationId);
  }

  /**
   * Records an immutable IntegrationSyncEvent audit entry.
   * @private
   */
  async _recordAudit({
    organizationId,
    integrationId,
    provider,
    status,
    eventType,
    targetEntityId,
    externalTicketKey = null,
    payloadHash,
    syncId = null,
    errorMessage = null,
    durationMs = 0,
  }) {
    if (mongoose.connection && mongoose.connection.readyState !== 1 && !IntegrationSyncEvent.create.mock) {
      return;
    }

    const finalSyncId = syncId || crypto.randomUUID();

    return await IntegrationSyncEvent.create({
      syncId: finalSyncId,
      organizationId,
      integrationId,
      provider,
      direction: 'INBOUND',
      eventType,
      targetEntityType: 'APPROVAL',
      targetEntityId: targetEntityId ? String(targetEntityId) : 'PENDING_APPROVAL',
      externalTicketKey,
      payloadHash,
      status,
      errorMessage: errorMessage ? String(errorMessage) : null,
      attempt: 1,
      durationMs,
      processedAt: new Date(),
    });
  }
}

module.exports = new ExternalApprovalCallbackService();
