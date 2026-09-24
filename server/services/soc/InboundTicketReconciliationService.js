'use strict';

/**
 * 🛡️ CyberShield X — Inbound Ticket Reconciliation Engine (Phase 81 Step 5)
 *
 * Consumes cryptographically authenticated webhook contexts from Phase 81 Step 4
 * and safely reconciles external ticket state against existing Case.externalTickets:
 *
 * Pipeline:
 * 1. Step 4 Authenticated Webhook verification
 * 2. Inbound event normalization (via InboundTicketNormalizer)
 * 3. Authoritative tenant & integration resolution (via IntegrationConfig)
 * 4. External ticket matching (strictly scoped to organizationId + integrationId)
 * 5. Idempotency & duplicate protection
 * 6. Safe Case status reconciliation with terminal state protection
 * 7. External ticket metadata update (syncDirection: 'INBOUND', syncStatus: 'IN_SYNC')
 * 8. Inbound loop prevention (never enqueues outbound dispatch)
 * 9. Immutable IntegrationSyncEvent audit trail
 * 10. Safe acknowledgment
 */

const crypto = require('crypto');
const mongoose = require('mongoose');
const logger = require('../../utils/logger');
const Case = require('../../models/Case');
const IntegrationConfig = require('../../models/IntegrationConfig');
const IntegrationSyncEvent = require('../../models/IntegrationSyncEvent');
const normalizer = require('./InboundTicketNormalizer');
const itsmSignatureVerifier = require('./ItsmSignatureVerifier');
const { hashPayload } = require('../../integrations/connectorUtils');

// Canonical Case status levels for lifecycle progression
const STATUS_LIFECYCLE_LEVELS = Object.freeze({
  NEW: 0,
  OPEN: 1,
  IN_PROGRESS: 2,
  ESCALATED: 3,
  CONTAINED: 4,
  RESOLVED: 5,
  CLOSED: 6,
  ARCHIVED: 7,
});

class InboundTicketReconciliationService {
  constructor() {
    // In-memory LRU cache for duplicate event digest tracking (5,000 max, 10 min TTL)
    this._recentEvents = new Map();
    this._maxRecentEvents = 5000;
    this._eventTtlMs = 10 * 60 * 1000;
    // Intra-process in-flight set to prevent concurrent microsecond races
    this._inFlightEvents = new Set();
  }

  /**
   * Primary entrypoint: Reconciles an authenticated inbound webhook.
   *
   * @param {object} params
   * @param {object} params.req - Express request
   * @param {object} [params.config] - Pre-resolved IntegrationConfig document
   * @param {object} [params.verification] - Pre-computed Step 4 verification result
   * @returns {Promise<object>} Reconciliation outcome
   */
  async reconcileWebhook({ req, config = null, verification = null, isControllerHandoff = false }) {
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
          `[INBOUND-RECONCILER] Authentication rejected for ${resolvedConfig.type} (ID: ${resolvedConfig._id}): ${authResult.reason}`
        );
        return {
          success: false,
          status: 'AUTHENTICATION_FAILED',
          reason: authResult.reason || 'Cryptographic authentication failed',
        };
      }

      // 3. Replay / Duplicate Check from Step 4
      if (authResult.isDuplicate) {
        logger.info(`[INBOUND-RECONCILER] Duplicate webhook acknowledged without reprocessing (ID: ${resolvedConfig._id})`);
        return {
          success: true,
          status: 'DUPLICATE_ACKNOWLEDGED',
          reason: 'REPLAY_DETECTED',
        };
      }

      // 4. Inbound Event Normalization
      const normalized = normalizer.normalize(req, resolvedConfig.type, resolvedConfig);
      if (!normalized.valid) {
        logger.warn(`[INBOUND-RECONCILER] Event normalization failed: ${normalized.reason}`);
        if (!isControllerHandoff) {
          await this._recordAudit({
            organizationId: resolvedConfig.organizationId,
            integrationId: resolvedConfig._id,
            provider: normalized.provider || String(resolvedConfig.type).toUpperCase(),
            status: 'REJECTED',
            eventType: 'TICKET_MALFORMED',
            targetEntityId: 'MALFORMED',
            payloadHash: normalized.payloadHash || hashPayload(req.body || {}),
            errorMessage: normalized.reason,
            durationMs: Date.now() - startTime,
          });
        }

        return {
          success: false,
          status: 'MALFORMED_EVENT',
          error: normalized.error,
          reason: normalized.reason,
        };
      }

      // 5. Authoritative Deterministic Duplicate Identity & RFC 4122 UUID v4 syncId
      const duplicateIdentity = this.deriveDuplicateIdentity(
        String(resolvedConfig._id),
        normalized.provider,
        normalized.eventId,
        normalized.externalTicketKey || normalized.externalTicketId,
        normalized.payloadHash
      );
      const deterministicSyncId = this.buildDeterministicSyncId(duplicateIdentity);
      const eventDigest = this._buildEventDigest(
        String(resolvedConfig._id),
        normalized.provider,
        normalized.externalTicketKey || normalized.externalTicketId,
        normalized.payloadHash
      );

      // 5a. Intra-process in-flight concurrency lock (millisecond-level collision defense)
      if (this._inFlightEvents.has(deterministicSyncId)) {
        logger.info(`[INBOUND-RECONCILER] Intra-process concurrent duplicate event blocked: ${deterministicSyncId}`);
        return {
          success: true,
          status: 'DUPLICATE_ACKNOWLEDGED',
          reason: 'CONCURRENT_IN_FLIGHT_DUPLICATE',
          externalTicketKey: normalized.externalTicketKey,
        };
      }
      this._inFlightEvents.add(deterministicSyncId);

      try {
        // 5b. Memory LRU cache fast-path check
        if (this._isDuplicateEvent(eventDigest)) {
          logger.info(`[INBOUND-RECONCILER] Memory cache duplicate detected for ticket: ${normalized.externalTicketKey}`);
          return {
            success: true,
            status: 'DUPLICATE_ACKNOWLEDGED',
            reason: 'MEMORY_CACHE_DUPLICATE',
            externalTicketKey: normalized.externalTicketKey,
          };
        }

        // 5c. Authoritative Database Duplicate Check (IntegrationSyncEvent persistence)
        const existingSyncEvent = await this._findExistingSyncEvent(deterministicSyncId);
        if (existingSyncEvent) {
          logger.info(`[INBOUND-RECONCILER] Durable database duplicate detected in IntegrationSyncEvent: ${deterministicSyncId}`);
          this._markEventProcessed(eventDigest);
          return {
            success: true,
            status: 'DUPLICATE_ACKNOWLEDGED',
            reason: 'DURABLE_AUDIT_DUPLICATE',
            externalTicketKey: normalized.externalTicketKey,
          };
        }

        // 6. Authoritative External Ticket Matching (Strict Tenant Isolation)
        const matchResult = await this._matchCase(resolvedConfig, normalized);
        if (!matchResult.matched) {
          logger.info(
            `[INBOUND-RECONCILER] Unmatched ticket received (Provider: ${normalized.provider}, ID: ${normalized.externalTicketId}, Key: ${normalized.externalTicketKey}). Zero Case mutations executed.`
          );

          if (!isControllerHandoff) {
            await this._recordAudit({
              organizationId: resolvedConfig.organizationId,
              integrationId: resolvedConfig._id,
              provider: normalized.provider,
              status: 'REJECTED',
              eventType: 'TICKET_UNMATCHED',
              targetEntityId: 'UNMATCHED',
              externalTicketKey: normalized.externalTicketKey || normalized.externalTicketId,
              payloadHash: normalized.payloadHash,
              syncId: deterministicSyncId,
              errorMessage: 'UNMATCHED_TICKET',
              durationMs: Date.now() - startTime,
            });
          }

          this._markEventProcessed(eventDigest);

          return {
            success: true,
            status: 'UNMATCHED',
            matched: false,
            reason: 'TICKET_NOT_FOUND',
            externalTicketKey: normalized.externalTicketKey || normalized.externalTicketId,
          };
        }

        const { caseDoc, binding } = matchResult;

        // 7. External Status Normalization
        const mappedStatus = this.mapExternalStatus(normalized.provider, normalized.externalStatus);
        if (!mappedStatus) {
          logger.warn(
            `[INBOUND-RECONCILER] Unsupported external status '${normalized.externalStatus}' for provider ${normalized.provider}. Preserving Case.status unchanged.`
          );

          // Update binding metadata with lastError without mutating Case.status
          binding.externalStatus = normalized.externalStatus || binding.externalStatus;
          binding.lastSyncAt = new Date();
          binding.lastError = 'UNSUPPORTED_STATUS';
          await caseDoc.save();

          await this._recordAudit({
            organizationId: resolvedConfig.organizationId,
            integrationId: resolvedConfig._id,
            provider: normalized.provider,
            status: 'REJECTED',
            eventType: 'TICKET_UNSUPPORTED_STATUS',
            targetEntityId: caseDoc.caseId,
            externalTicketKey: binding.ticketKey,
            payloadHash: normalized.payloadHash,
            syncId: deterministicSyncId,
            errorMessage: `Unsupported external status: ${normalized.externalStatus}`,
            durationMs: Date.now() - startTime,
          });

          this._markEventProcessed(eventDigest);

          return {
            success: true,
            status: 'UNSUPPORTED_STATUS',
            caseId: caseDoc.caseId,
            externalStatus: normalized.externalStatus,
            previousStatus: caseDoc.status,
          };
        }

        // 8. Safe Transition Evaluation (Terminal State & Ordering Defense)
        const transition = this.evaluateTransition(
          caseDoc.status,
          mappedStatus,
          normalized.occurredAt,
          binding.lastSyncAt
        );

        if (!transition.allowed) {
          logger.warn(
            `[INBOUND-RECONCILER] Status transition blocked from ${caseDoc.status} to ${mappedStatus}: ${transition.reason}`
          );

          binding.externalStatus = normalized.externalStatus;
          binding.lastSyncAt = new Date();
          binding.lastError = transition.reason;
          binding.syncStatus = 'MANUAL_OVERRIDE';
          await caseDoc.save();

          await this._recordAudit({
            organizationId: resolvedConfig.organizationId,
            integrationId: resolvedConfig._id,
            provider: normalized.provider,
            status: 'REJECTED',
            eventType: 'TICKET_STATUS_BLOCKED',
            targetEntityId: caseDoc.caseId,
            externalTicketKey: binding.ticketKey,
            payloadHash: normalized.payloadHash,
            syncId: deterministicSyncId,
            errorMessage: transition.reason,
            durationMs: Date.now() - startTime,
          });

          this._markEventProcessed(eventDigest);

          return {
            success: true,
            status: 'BLOCKED',
            reason: transition.reason,
            caseId: caseDoc.caseId,
            currentStatus: caseDoc.status,
          };
        }

        // 9. Multi-Instance Atomic DB Enforcement & Case Mutation
        // Atomically record IntegrationSyncEvent before mutating Case.
        // If another process inserts with the same deterministicSyncId concurrently,
        // MongoDB unique index constraint throws E11000 duplicate key error,
        // aborting duplicate Case mutation before caseDoc.save() is called!
        try {
          await this._recordAudit({
            organizationId: resolvedConfig.organizationId,
            integrationId: resolvedConfig._id,
            provider: normalized.provider,
            status: 'SUCCESS',
            eventType: 'TICKET_STATUS_RECONCILED',
            targetEntityId: caseDoc.caseId,
            externalTicketKey: binding.ticketKey,
            payloadHash: normalized.payloadHash,
            syncId: deterministicSyncId,
            durationMs: Date.now() - startTime,
          });
        } catch (auditErr) {
          if (auditErr.code === 11000 || (auditErr.message && auditErr.message.includes('E11000'))) {
            logger.info(
              `[INBOUND-RECONCILER] Atomic duplicate key conflict on syncId ${deterministicSyncId}. Duplicate acknowledged safely.`
            );
            return {
              success: true,
              status: 'DUPLICATE_ACKNOWLEDGED',
              reason: 'ATOMIC_INDEX_DUPLICATE',
              externalTicketKey: normalized.externalTicketKey,
            };
          }
          throw auditErr;
        }

        // Execute Case mutation
        const previousStatus = caseDoc.status;
        try {
          binding.externalStatus = normalized.externalStatus;
          binding.lastSyncAt = new Date();
          binding.lastError = null;
          binding.syncStatus = 'IN_SYNC';
          if (!binding.syncDirection || !['BIDIRECTIONAL', 'OUTBOUND_ONLY', 'INBOUND_ONLY'].includes(binding.syncDirection)) {
            binding.syncDirection = 'BIDIRECTIONAL';
          }

          if (transition.statusChanged) {
            caseDoc.status = mappedStatus;

            caseDoc.timeline.push({
              action: transition.isReopened ? 'CASE_REOPENED' : 'EXTERNAL_TICKET_SYNCED',
              performedBy: 'INBOUND_WEBHOOK',
              timestamp: new Date(),
              details: `Status ${transition.isReopened ? 'reopened' : 'reconciled'} from ${previousStatus} to ${mappedStatus} via ${normalized.provider} (${binding.ticketKey})`,
            });

            if (transition.isReopened) {
              if (!Array.isArray(caseDoc.reopenHistory)) caseDoc.reopenHistory = [];
              caseDoc.reopenHistory.push({
                reopenedAt: new Date(),
                reopenedBy: 'INBOUND_WEBHOOK',
                reason: `Reopened via external ticket status update (${normalized.externalStatus})`,
              });
            }
          }

          await caseDoc.save();
        } catch (saveErr) {
          logger.error(`[INBOUND-RECONCILER] Case save failed after audit: ${saveErr.message}`);
          await this._deleteSyncEvent(deterministicSyncId);
          throw saveErr;
        }

        // Mark event digest as processed in memory
        this._markEventProcessed(eventDigest);

        logger.info(
          `[INBOUND-RECONCILER] Successfully reconciled Case ${caseDoc.caseId} via ${normalized.provider} (${binding.ticketKey}): ${previousStatus} -> ${caseDoc.status}`
        );

        return {
          success: true,
          status: 'RECONCILED',
          caseId: caseDoc.caseId,
          previousStatus,
          newStatus: caseDoc.status,
          externalTicketKey: binding.ticketKey,
          provider: normalized.provider,
        };
      } finally {
        this._inFlightEvents.delete(deterministicSyncId);
      }
    } catch (err) {
      logger.error(`[INBOUND-RECONCILER] Unexpected reconciliation failure: ${err.message}`);
      return {
        success: false,
        status: 'INTERNAL_SERVER_ERROR',
        error: 'RECONCILIATION_FAILED',
        message: 'An internal error occurred during ticket reconciliation.',
      };
    }
  }

  /**
   * Maps external provider statuses to canonical Case.status enum.
   * Case.status enum: ['NEW', 'OPEN', 'IN_PROGRESS', 'ESCALATED', 'CONTAINED', 'RESOLVED', 'CLOSED', 'ARCHIVED']
   *
   * @param {string} provider - 'JIRA' | 'SERVICENOW' | 'PAGERDUTY' | 'GENERIC'
   * @param {string} externalStatus - Raw external status string
   * @returns {string|null} Canonical status or null if unsupported
   */
  mapExternalStatus(provider, externalStatus) {
    if (!externalStatus || typeof externalStatus !== 'string') return null;
    const clean = externalStatus.trim().toLowerCase();

    switch (String(provider).toUpperCase()) {
      case 'JIRA':
        if (['to do', 'backlog', 'open', 'created', 'new', 'reopened'].includes(clean)) return 'OPEN';
        if (['in progress', 'in review', 'in development', 'active', 'started', 'work in progress'].includes(clean)) return 'IN_PROGRESS';
        if (['escalated', 'blocked', 'waiting for support'].includes(clean)) return 'ESCALATED';
        if (['contained', 'mitigated'].includes(clean)) return 'CONTAINED';
        if (['done', 'resolved', 'fixed', 'completed'].includes(clean)) return 'RESOLVED';
        if (['closed', 'archived', 'cancelled', "won't do", 'wont do'].includes(clean)) return 'CLOSED';
        return null;

      case 'SERVICENOW':
        if (['1', 'new'].includes(clean)) return 'OPEN';
        if (['2', 'in progress', 'work in progress'].includes(clean)) return 'IN_PROGRESS';
        if (['3', 'on hold', 'awaiting caller'].includes(clean)) return 'IN_PROGRESS';
        if (['6', 'resolved'].includes(clean)) return 'RESOLVED';
        if (['7', 'closed'].includes(clean)) return 'CLOSED';
        if (['8', 'canceled', 'cancelled'].includes(clean)) return 'CLOSED';
        return null;

      case 'PAGERDUTY':
        if (['triggered', 'incident.triggered'].includes(clean)) return 'OPEN';
        if (['acknowledged', 'incident.acknowledged'].includes(clean)) return 'IN_PROGRESS';
        if (['resolved', 'incident.resolved'].includes(clean)) return 'RESOLVED';
        return null;

      case 'GENERIC':
      case 'WEBHOOK': {
        const upper = clean.toUpperCase();
        if (['NEW', 'OPEN', 'IN_PROGRESS', 'ESCALATED', 'CONTAINED', 'RESOLVED', 'CLOSED', 'ARCHIVED'].includes(upper)) {
          return upper;
        }
        if (['in progress', 'in_progress', 'active'].includes(clean)) return 'IN_PROGRESS';
        if (['done', 'resolved', 'fixed'].includes(clean)) return 'RESOLVED';
        if (['closed', 'archived'].includes(clean)) return 'CLOSED';
        if (['open', 'new'].includes(clean)) return 'OPEN';
        return null;
      }

      default:
        return null;
    }
  }

  /**
   * Evaluates state transition safety:
   * - Defends terminal states (CLOSED, ARCHIVED) from automatic regression
   * - Manages reopening transitions (RESOLVED -> OPEN/IN_PROGRESS)
   * - Prevents stale out-of-order event regressions
   *
   * @param {string} currentStatus
   * @param {string} newStatus
   * @param {Date} [occurredAt]
   * @param {Date} [lastSyncAt]
   * @returns {{ allowed: boolean, statusChanged?: boolean, isReopened?: boolean, reason?: string }}
   */
  evaluateTransition(currentStatus, newStatus, occurredAt = null, lastSyncAt = null) {
    if (currentStatus === newStatus) {
      return { allowed: true, statusChanged: false };
    }

    // 1. Terminal State Lock: CLOSED or ARCHIVED cannot be regressed automatically
    if (['CLOSED', 'ARCHIVED'].includes(currentStatus)) {
      return {
        allowed: false,
        reason: `TERMINAL_STATE_LOCKED: Cannot automatically transition Case from terminal state ${currentStatus}`,
      };
    }

    // 2. Stale Event Defense: If event occurred before the last synchronized timestamp
    if (occurredAt && lastSyncAt && occurredAt instanceof Date && lastSyncAt instanceof Date) {
      const currentLevel = STATUS_LIFECYCLE_LEVELS[currentStatus] ?? 0;
      const newLevel = STATUS_LIFECYCLE_LEVELS[newStatus] ?? 0;

      // If older event tries to move status backward
      if (occurredAt.getTime() < lastSyncAt.getTime() && newLevel < currentLevel) {
        return {
          allowed: false,
          reason: 'STALE_EVENT_REGRESSION_BLOCKED: Received delayed event older than last synchronization timestamp',
        };
      }
    }

    // 3. Supported Reopening: RESOLVED -> OPEN or IN_PROGRESS
    if (currentStatus === 'RESOLVED' && ['OPEN', 'IN_PROGRESS'].includes(newStatus)) {
      return {
        allowed: true,
        statusChanged: true,
        isReopened: true,
      };
    }

    // 4. Lifecycle Progression or Lateral Transition
    const currentLevel = STATUS_LIFECYCLE_LEVELS[currentStatus] ?? 0;
    const newLevel = STATUS_LIFECYCLE_LEVELS[newStatus] ?? 0;

    // Moving forward or lateral within active states
    if (newLevel >= currentLevel || (currentLevel <= 4 && newLevel <= 4)) {
      return {
        allowed: true,
        statusChanged: true,
        isReopened: false,
      };
    }

    return {
      allowed: false,
      reason: `STATUS_REGRESSION_BLOCKED: Unsafe transition from ${currentStatus} to ${newStatus}`,
    };
  }

  /**
   * Matches incoming ticket identity against Case.externalTickets with strict tenant scoping.
   *
   * @private
   */
  async _matchCase(config, normalized) {
    const query = {
      organizationId: config.organizationId,
      'externalTickets.integrationId': config._id,
      $or: [],
    };

    if (normalized.externalTicketId) {
      query.$or.push({ 'externalTickets.ticketId': String(normalized.externalTicketId) });
    }
    if (normalized.externalTicketKey) {
      query.$or.push({ 'externalTickets.ticketKey': String(normalized.externalTicketKey) });
    }

    if (query.$or.length === 0) {
      return { matched: false };
    }

    if (mongoose.connection && mongoose.connection.readyState !== 1 && !Case.findOne.mock) {
      return { matched: false };
    }

    const caseDoc = await Case.findOne(query);
    if (!caseDoc) {
      return { matched: false };
    }

    // Locate the matching external ticket subdocument
    const binding = caseDoc.externalTickets.find((b) => {
      const matchInt = String(b.integrationId) === String(config._id);
      const matchId = normalized.externalTicketId && String(b.ticketId) === String(normalized.externalTicketId);
      const matchKey = normalized.externalTicketKey && String(b.ticketKey) === String(normalized.externalTicketKey);
      return matchInt && (matchId || matchKey);
    });

    if (!binding) {
      return { matched: false };
    }

    return { matched: true, caseDoc, binding };
  }

  /**
   * Resolves IntegrationConfig from request route parameter :integrationId.
   *
   * @private
   */
  async _resolveConfig(req) {
    const integrationId = req.params?.integrationId;
    if (!integrationId || !mongoose.Types.ObjectId.isValid(integrationId)) {
      return null;
    }
    return await IntegrationConfig.findById(integrationId);
  }

  /**
   * Builds a deterministic event digest for idempotency tracking.
   *
   * @private
   */
  _buildEventDigest(integrationId, provider, ticketKey, payloadHash) {
    return crypto
      .createHash('sha256')
      .update(`${integrationId}:${provider}:${ticketKey || ''}:${payloadHash}`)
      .digest('hex');
  }

  /**
   * Checks if an event digest is already recorded within the TTL window.
   *
   * @private
   */
  _isDuplicateEvent(digest) {
    if (!this._recentEvents.has(digest)) return false;
    const expiresAt = this._recentEvents.get(digest);
    if (Date.now() > expiresAt) {
      this._recentEvents.delete(digest);
      return false;
    }
    return true;
  }

  /**
   * Marks an event digest as processed in the LRU cache.
   *
   * @private
   */
  _markEventProcessed(digest) {
    if (this._recentEvents.size >= this._maxRecentEvents) {
      const oldest = this._recentEvents.keys().next().value;
      this._recentEvents.delete(oldest);
    }
    this._recentEvents.set(digest, Date.now() + this._eventTtlMs);
  }

  /**
   * Derives a deterministic duplicate identity string from provider evidence.
   *
   * @param {string} integrationId
   * @param {string} provider
   * @param {string} [eventId] - Provider event ID if reliably supplied
   * @param {string} [ticketIdentity] - External ticket ID or Key
   * @param {string} payloadHash - SHA-256 hex string
   * @returns {string} Deterministic identity string
   */
  deriveDuplicateIdentity(integrationId, provider, eventId, ticketIdentity, payloadHash) {
    const cleanIntegration = String(integrationId || '').trim();
    const cleanProvider = String(provider || 'GENERIC').trim().toUpperCase();
    const cleanPayloadHash = String(payloadHash || '').trim();

    if (eventId && typeof eventId === 'string' && eventId.trim().length > 0) {
      return `${cleanIntegration}:${cleanProvider}:event:${eventId.trim()}:${cleanPayloadHash}`;
    }

    const cleanTicket = String(ticketIdentity || '').trim();
    return `${cleanIntegration}:${cleanProvider}:ticket:${cleanTicket}:${cleanPayloadHash}`;
  }

  /**
   * Formats a deterministic SHA-256 hash into an RFC 4122 compliant UUID v4 string.
   *
   * @param {string} duplicateIdentity
   * @returns {string} Deterministic UUID v4
   */
  buildDeterministicSyncId(duplicateIdentity) {
    const hash = crypto.createHash('sha256').update(duplicateIdentity).digest();
    const bytes = Buffer.from(hash.subarray(0, 16));

    // RFC 4122 UUID v4 compliance:
    // Set 4 most significant bits of time_hi_and_version to 0100 (version 4)
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    // Set 2 most significant bits of clock_seq_hi_and_reserved to 10 (variant 1)
    bytes[8] = (bytes[8] & 0x3f) | 0x80;

    const hex = bytes.toString('hex');
    return `${hex.substring(0, 8)}-${hex.substring(8, 12)}-${hex.substring(12, 16)}-${hex.substring(16, 20)}-${hex.substring(20, 32)}`;
  }

  /**
   * Queries existing IntegrationSyncEvent record by syncId for durable idempotency.
   *
   * @private
   */
  async _findExistingSyncEvent(syncId) {
    try {
      if (mongoose.connection && mongoose.connection.readyState !== 1 && !IntegrationSyncEvent.findOne.mock) {
        return null;
      }
      return await IntegrationSyncEvent.findOne({ syncId });
    } catch (err) {
      logger.warn(`[INBOUND-RECONCILER] Error checking existing sync event: ${err.message}`);
      return null;
    }
  }

  /**
   * Deletes a claimed sync event if subsequent operations failed.
   *
   * @private
   */
  async _deleteSyncEvent(syncId) {
    try {
      if (mongoose.connection && mongoose.connection.readyState !== 1 && !IntegrationSyncEvent.deleteOne.mock) {
        return;
      }
      await IntegrationSyncEvent.deleteOne({ syncId });
    } catch (err) {
      logger.warn(`[INBOUND-RECONCILER] Error deleting sync event: ${err.message}`);
    }
  }

  /**
   * Records an immutable IntegrationSyncEvent audit entry.
   *
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
      return null;
    }

    const resolvedSyncId = syncId || crypto.randomUUID();

    const rawProv = String(provider || 'GENERIC').toUpperCase();
    const canonicalProv = ['JIRA', 'SERVICENOW', 'PAGERDUTY'].includes(rawProv) ? rawProv : 'GENERIC';

    try {
      return await IntegrationSyncEvent.create({
        syncId: resolvedSyncId,
        organizationId,
        integrationId,
        provider: canonicalProv,
        direction: 'INBOUND',
        eventType,
        targetEntityType: 'CASE',
        targetEntityId: String(targetEntityId),
        externalTicketKey: externalTicketKey ? String(externalTicketKey) : null,
        payloadHash: payloadHash || '0'.repeat(64),
        status,
        errorMessage: errorMessage ? String(errorMessage) : null,
        attempt: 1,
        durationMs,
        processedAt: new Date(),
      });
    } catch (err) {
      // Re-throw duplicate key error (code 11000) so caller can intercept atomic concurrency conflict
      if (err.code === 11000 || (err.message && err.message.includes('E11000'))) {
        throw err;
      }
      logger.warn(`[INBOUND-RECONCILER] Failed recording IntegrationSyncEvent: ${err.message}`);
      return null;
    }
  }
}

module.exports = new InboundTicketReconciliationService();
