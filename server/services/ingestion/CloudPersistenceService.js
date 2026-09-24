/**
 * 🛡️ CyberShield X — CloudPersistenceService (Phase 80 Step 5)
 *
 * Synchronous Persistence & Idempotency Service for Cloud Telemetry:
 * - Persists already-normalized CloudTelemetryEvent data into MongoDB.
 * - Enforces tenant-scoped idempotency via compound unique index:
 *   { organizationId: 1, provider: 1, nativeEventId: 1 } (unique: true)
 * - Enforces authoritative canonical event ID:
 *   "CLOUD-${provider}-${organizationId}-${nativeEventId}"
 * - Synchronous durable commit: Guarantees MongoDB write completion before returning CREATED (no fire-and-forget).
 * - Handles concurrent duplicate-key races (E11000) safely, resolving them as DUPLICATE without 500 errors.
 * - Non-duplicate MongoDB failures are NOT swallowed and return PERSISTENCE_FAILURE.
 * - Preserves existing duplicate events immutably without payload/timestamp overwrites.
 * - Preserves tenant, provider, and enrolled cloud account bindings.
 * - Hard architectural boundary: Exactly zero Data Fabric graph writes and zero Decision Intelligence writes.
 */

'use strict';

const CloudTelemetryEvent = require('../../models/CloudTelemetryEvent');
const logger = require('../../utils/logger');

// Safe persistence status constants
const PERSISTENCE_STATUS = {
  CREATED: 'CREATED',
  DUPLICATE: 'DUPLICATE',
  REJECTED: 'REJECTED',
  PERSISTENCE_FAILURE: 'PERSISTENCE_FAILURE',
};

class CloudPersistenceService {
  /**
   * Derive the authoritative canonical event ID.
   * Format: "CLOUD-${provider}-${organizationId}-${nativeEventId}"
   *
   * @param {string} provider - 'AWS' | 'AZURE' | 'GCP'
   * @param {string|number} organizationId - Authenticated tenant ID
   * @param {string} nativeEventId - Provider native event ID
   * @returns {string}
   */
  static generateCanonicalEventId(provider, organizationId, nativeEventId) {
    const cleanProvider = String(provider).trim().toUpperCase();
    const cleanOrg = String(organizationId).trim();
    const cleanNativeId = String(nativeEventId).trim();
    return `CLOUD-${cleanProvider}-${cleanOrg}-${cleanNativeId}`;
  }

  /**
   * Synchronously persist an already-normalized event with strict idempotency and tenant isolation.
   *
   * @param {Object} normalizedEvent - Provider-neutral normalized telemetry event from Step 4
   * @param {Object} verificationContext - Trusted context from Step 3 verification
   * @returns {Promise<{
   *   status: 'CREATED' | 'DUPLICATE' | 'REJECTED' | 'PERSISTENCE_FAILURE',
   *   event?: Object,
   *   canonicalEventId?: string,
   *   nativeEventId?: string,
   *   isDuplicate?: boolean,
   *   reason?: string,
   *   error?: string
   * }>}
   */
  static async persist(normalizedEvent, verificationContext = {}) {
    // -------------------------------------------------------------------------
    // 1. Guard against empty inputs
    // -------------------------------------------------------------------------
    if (!normalizedEvent || typeof normalizedEvent !== 'object') {
      return {
        status: PERSISTENCE_STATUS.REJECTED,
        reason: 'MISSING_NORMALIZED_EVENT',
      };
    }

    if (!verificationContext || typeof verificationContext !== 'object') {
      return {
        status: PERSISTENCE_STATUS.REJECTED,
        reason: 'MISSING_VERIFICATION_CONTEXT',
      };
    }

    // -------------------------------------------------------------------------
    // 2. Tenant Security Boundary
    // -------------------------------------------------------------------------
    const authOrgId = verificationContext.organizationId;
    if (!authOrgId) {
      return {
        status: PERSISTENCE_STATUS.REJECTED,
        reason: 'UNAUTHENTICATED_TENANT',
      };
    }

    if (normalizedEvent.organizationId && String(normalizedEvent.organizationId) !== String(authOrgId)) {
      return {
        status: PERSISTENCE_STATUS.REJECTED,
        reason: 'TENANT_MISMATCH',
      };
    }

    // -------------------------------------------------------------------------
    // 3. Provider & Account Binding
    // -------------------------------------------------------------------------
    const authProvider = verificationContext.provider
      ? String(verificationContext.provider).trim().toUpperCase()
      : null;
    const eventProvider = normalizedEvent.provider
      ? String(normalizedEvent.provider).trim().toUpperCase()
      : null;

    if (!eventProvider || !['AWS', 'AZURE', 'GCP'].includes(eventProvider)) {
      return {
        status: PERSISTENCE_STATUS.REJECTED,
        reason: 'INVALID_PROVIDER',
      };
    }

    if (authProvider && authProvider !== eventProvider) {
      return {
        status: PERSISTENCE_STATUS.REJECTED,
        reason: 'PROVIDER_MISMATCH',
      };
    }

    // Enrolled cloud account validation
    if (
      verificationContext.enrolledAccountIds &&
      Array.isArray(verificationContext.enrolledAccountIds) &&
      verificationContext.enrolledAccountIds.length > 0
    ) {
      const cloudAccountId = normalizedEvent.cloudAccountId;
      if (!cloudAccountId || !verificationContext.enrolledAccountIds.includes(cloudAccountId)) {
        return {
          status: PERSISTENCE_STATUS.REJECTED,
          reason: 'CLOUD_ACCOUNT_MISMATCH',
        };
      }
    }

    // -------------------------------------------------------------------------
    // 4. Validate Core Required Fields
    // -------------------------------------------------------------------------
    const nativeEventId = normalizedEvent.nativeEventId;
    if (!nativeEventId || typeof nativeEventId !== 'string' || !nativeEventId.trim()) {
      return {
        status: PERSISTENCE_STATUS.REJECTED,
        reason: 'MISSING_NATIVE_EVENT_ID',
      };
    }

    const eventTime = normalizedEvent.eventTime instanceof Date
      ? normalizedEvent.eventTime
      : new Date(normalizedEvent.eventTime);

    if (isNaN(eventTime.getTime())) {
      return {
        status: PERSISTENCE_STATUS.REJECTED,
        reason: 'INVALID_EVENT_TIME',
      };
    }

    if (!normalizedEvent.rawPayloadHash || typeof normalizedEvent.rawPayloadHash !== 'string') {
      return {
        status: PERSISTENCE_STATUS.REJECTED,
        reason: 'MISSING_PAYLOAD_HASH',
      };
    }

    // -------------------------------------------------------------------------
    // 5. Canonical Event ID Enforcement
    // -------------------------------------------------------------------------
    const authoritativeCanonicalId = CloudPersistenceService.generateCanonicalEventId(
      eventProvider,
      authOrgId,
      nativeEventId
    );

    if (normalizedEvent.canonicalEventId && normalizedEvent.canonicalEventId !== authoritativeCanonicalId) {
      return {
        status: PERSISTENCE_STATUS.REJECTED,
        reason: 'CANONICAL_ID_MISMATCH',
      };
    }

    const organizationId = authOrgId;
    const connectorId = verificationContext.connectorId || normalizedEvent.connectorId || 'default-connector';

    // -------------------------------------------------------------------------
    // 6. Pre-Insert Idempotency Check (Fast Path)
    // -------------------------------------------------------------------------
    try {
      const existingDoc = await CloudTelemetryEvent.findOne({
        organizationId,
        provider: eventProvider,
        nativeEventId,
      }).lean();

      if (existingDoc) {
        return {
          status: PERSISTENCE_STATUS.DUPLICATE,
          event: existingDoc,
          canonicalEventId: existingDoc.canonicalEventId,
          nativeEventId: existingDoc.nativeEventId,
          isDuplicate: true,
        };
      }
    } catch (checkErr) {
      // Non-fatal query error, proceed to insert where unique compound index is final arbiter
      logger.warn('[CloudPersistenceService] Idempotency check query encountered warning:', {
        error: checkErr.message,
        canonicalEventId: authoritativeCanonicalId,
      });
    }

    // -------------------------------------------------------------------------
    // 7. Synchronous Durable Persistence
    // -------------------------------------------------------------------------
    const docData = {
      canonicalEventId: authoritativeCanonicalId,
      organizationId,
      connectorId,
      provider: eventProvider,
      nativeEventId,
      cloudAccountId: normalizedEvent.cloudAccountId,
      region: normalizedEvent.region || 'GLOBAL',
      eventTime,
      ingestionTime: normalizedEvent.ingestionTime || new Date(),
      lastObservedAt: new Date(),
      graphMaterialized: false,
      projectionRetryCount: 0,
      projectionStatus: 'PENDING',
      actor: {
        principalId: (normalizedEvent.actor && normalizedEvent.actor.principalId) || null,
        principalType: (normalizedEvent.actor && normalizedEvent.actor.principalType) || null,
        principalName: (normalizedEvent.actor && (normalizedEvent.actor.principalName || normalizedEvent.actor.username)) || null,
        callerIp: (normalizedEvent.actor && normalizedEvent.actor.callerIp) || null,
      },
      action: {
        service: (normalizedEvent.action && normalizedEvent.action.service) || null,
        operation: (normalizedEvent.action && (normalizedEvent.action.operation || normalizedEvent.action.name)) || null,
        category: (normalizedEvent.action && normalizedEvent.action.category) || null,
        tier: (normalizedEvent.action && normalizedEvent.action.tier) || 5,
        isMutating: Boolean(normalizedEvent.action && normalizedEvent.action.isMutating),
      },
      resources: Array.isArray(normalizedEvent.resources) ? normalizedEvent.resources : [],
      outcome: normalizedEvent.outcome || 'SUCCESS',
      severity: normalizedEvent.severity || 'INFORMATIONAL',
      signatureStatus: verificationContext.status || normalizedEvent.signatureStatus || 'VERIFIED',
      rawPayloadHash: normalizedEvent.rawPayloadHash,
      parameters: (normalizedEvent.parameters && typeof normalizedEvent.parameters === 'object') ? normalizedEvent.parameters : {},
    };

    try {
      // Direct durable creation (awaits commit from MongoDB replica/primary)
      const createdDoc = await CloudTelemetryEvent.create(docData);

      return {
        status: PERSISTENCE_STATUS.CREATED,
        event: createdDoc.toObject ? createdDoc.toObject() : createdDoc,
        canonicalEventId: authoritativeCanonicalId,
        nativeEventId,
        isDuplicate: false,
      };
    } catch (insertErr) {
      // -----------------------------------------------------------------------
      // 8. Duplicate Race Condition Handling (E11000)
      // -----------------------------------------------------------------------
      const isDuplicateKey =
        insertErr.code === 11000 ||
        (typeof insertErr.message === 'string' && insertErr.message.includes('E11000 duplicate key error'));

      if (isDuplicateKey) {
        // Confirm duplicate pertains to CloudTelemetryEvent compound uniqueness
        try {
          const raceDoc = await CloudTelemetryEvent.findOne({
            organizationId,
            provider: eventProvider,
            nativeEventId,
          }).lean();

          if (raceDoc) {
            return {
              status: PERSISTENCE_STATUS.DUPLICATE,
              event: raceDoc,
              canonicalEventId: raceDoc.canonicalEventId,
              nativeEventId: raceDoc.nativeEventId,
              isDuplicate: true,
            };
          }
        } catch (raceFetchErr) {
          logger.error('[CloudPersistenceService] Error fetching document after duplicate race:', {
            error: raceFetchErr.message,
            canonicalEventId: authoritativeCanonicalId,
          });
        }
      }

      // -----------------------------------------------------------------------
      // 9. Non-Duplicate Operational Failures (NOT Swallowed)
      // -----------------------------------------------------------------------
      logger.error('[CloudPersistenceService] MongoDB persistence failure:', {
        canonicalEventId: authoritativeCanonicalId,
        provider: eventProvider,
        errorCode: insertErr.code || 'UNKNOWN',
        errorMessage: insertErr.message,
      });

      return {
        status: PERSISTENCE_STATUS.PERSISTENCE_FAILURE,
        error: insertErr.message || 'Database write error',
        code: insertErr.code || 'DB_ERROR',
      };
    }
  }
}

module.exports = {
  CloudPersistenceService,
  PERSISTENCE_STATUS,
};
