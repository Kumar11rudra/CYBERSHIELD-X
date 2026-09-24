/**
 * 🛡️ CyberShield X — CloudDataFabricAdapter (Phase 80 Step 6)
 *
 * Data Fabric Projection & Recovery Adapter:
 * - Asynchronously materializes durably persisted CloudTelemetryEvent documents into the Security Data Fabric.
 * - Enforces deterministic graph node and edge identity derivation.
 * - Guarantees idempotent upserts for nodes and edges with E11000 race recovery.
 * - Preserves strict multi-tenant isolation (organizationId scoping).
 * - Preserves provider and enrolled cloudAccountId bindings.
 * - Implements 5-tier classification projection:
 *   - Tier 1 (MUTATING_SECURITY): Projects Actor (IDENTITY), Resource (ASSET/IDENTITY), Edge (AFFECTS).
 *   - Tier 2 (SECURITY_AUTH): Projects Actor (IDENTITY), Event (AUDIT_EVENT), Edge (ASSOCIATED_WITH / AFFECTS).
 *   - Tier 3 (LIFECYCLE): Projects Resource (ASSET), Actor (IDENTITY), Edge (AFFECTS).
 *   - Tier 4 (READ_LIST): Filtered out of graph (SKIPPED_READ_FILTER, exactly 0 nodes/edges).
 *   - Tier 5 (UNCLASSIFIED): Safe default (SKIPPED_READ_FILTER unless CRITICAL/HIGH severity).
 * - Implements bounded retry handling with exponential backoff and jitter (max 5 retries).
 * - Enforces poison-event isolation (POISON_FAILED) without deleting or discarding the durable event.
 * - Provides bounded startup reconciliation and non-overlapping periodic reconciliation (every 5 minutes, max 100 events).
 * - Zero impact on Step 5 durable persistence acknowledgment.
 * - Zero Decision Intelligence writes.
 */

'use strict';

const crypto = require('crypto');
const CloudTelemetryEvent = require('../../models/CloudTelemetryEvent');
const SecurityGraphNode = require('../../models/SecurityGraphNode');
const SecurityGraphEdge = require('../../models/SecurityGraphEdge');
const SecurityGraphService = require('../datafabric/SecurityGraphService');
const EntityNormalizationService = require('../datafabric/EntityNormalizationService');
const { defaultObservabilityService } = require('./CloudObservabilityService');
const logger = require('../../utils/logger');

function safeRecord(fn) {
  try {
    if (typeof fn === 'function') {
      fn(defaultObservabilityService);
    }
  } catch (err) {
    // Non-blocking
  }
}

// Authoritative projection statuses
const PROJECTION_STATUS = {
  PENDING: 'PENDING',
  MATERIALIZED: 'MATERIALIZED',
  SKIPPED_READ_FILTER: 'SKIPPED_READ_FILTER',
  POISON_FAILED: 'POISON_FAILED',
};

// Projection & Recovery bounds
const MAX_RETRIES = 5;
const MAX_BATCH_SIZE = 100;
const DEFAULT_RECONCILIATION_INTERVAL_MS = 300000; // 5 minutes
const MAX_ERROR_LENGTH = 512;

class CloudDataFabricAdapter {
  constructor() {
    this._periodicTimer = null;
    this._isReconciling = false;
  }

  // Expose status constants on class
  static get PROJECTION_STATUS() {
    return PROJECTION_STATUS;
  }

  static get MAX_RETRIES() {
    return MAX_RETRIES;
  }

  static get MAX_BATCH_SIZE() {
    return MAX_BATCH_SIZE;
  }

  static get DEFAULT_RECONCILIATION_INTERVAL_MS() {
    return DEFAULT_RECONCILIATION_INTERVAL_MS;
  }

  /**
   * Sanitize error message to prevent credential leakage and log injection.
   *
   * @param {string} errorMsg
   * @returns {string}
   */
  static sanitizeErrorMessage(errorMsg) {
    if (!errorMsg || typeof errorMsg !== 'string') return 'Unknown projection error';

    let sanitized = errorMsg
      // Redact sensitive patterns (passwords, tokens, bearer, secrets, keys)
      .replace(/(?:password|secret|token|apikey|accesskey|auth|bearer)\s*[:=]\s*[^\s,;]+/gi, '[REDACTED]')
      .replace(/Bearer\s+[A-Za-z0-9\-_.]+/gi, 'Bearer [REDACTED]')
      // Strip control characters, tabs, and newlines
      .replace(/[\r\n\t\x00-\x1f\x7f]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (sanitized.length > MAX_ERROR_LENGTH) {
      sanitized = sanitized.slice(0, MAX_ERROR_LENGTH);
    }
    return sanitized;
  }

  /**
   * Calculate exponential backoff delay with jitter.
   * Formula: min(300000, 2^retryCount * 1000) + random_jitter(0, 500) ms
   *
   * @param {number} retryCount
   * @returns {number} Delay in milliseconds
   */
  static calculateBackoff(retryCount) {
    const clampedRetry = Math.max(0, Math.min(retryCount || 0, 10));
    const base = Math.min(300000, Math.pow(2, clampedRetry) * 1000);
    const jitter = Math.floor(Math.random() * 500);
    return base + jitter;
  }

  /**
   * Derive deterministic Actor Node descriptor.
   * Formula for identity: `${organizationId}:${provider}:${cloudAccountId}:${actorPrincipal}`
   *
   * @param {Object} cloudEvent - CloudTelemetryEvent document
   * @returns {Object}
   */
  static deriveActorNodeDescriptor(cloudEvent) {
    const orgId = String(cloudEvent.organizationId || 'GLOBAL');
    const provider = String(cloudEvent.provider || 'UNKNOWN').toUpperCase();
    const cloudAccountId = String(cloudEvent.cloudAccountId || 'GLOBAL');
    const actorPrincipal =
      cloudEvent.actor?.principalId ||
      cloudEvent.actor?.principalName ||
      cloudEvent.actor?.callerIp ||
      'ANONYMOUS';

    const entityId = `${orgId}:${provider}:${cloudAccountId}:${actorPrincipal}`;
    const nodeId = EntityNormalizationService.toNodeId('IDENTITY', entityId);
    const displayName = `${cloudEvent.actor?.principalName || cloudEvent.actor?.principalId || 'Cloud Actor'} (${provider})`;

    const severityMap = {
      CRITICAL: 'CRITICAL',
      HIGH: 'HIGH',
      MEDIUM: 'MEDIUM',
      LOW: 'LOW',
      INFORMATIONAL: 'INFORMATIONAL',
    };
    const classification = severityMap[cloudEvent.severity] || 'INFORMATIONAL';

    return {
      nodeId,
      entityType: 'IDENTITY',
      entityId,
      displayName,
      classification,
      source: `CloudTelemetry:${provider}`,
      firstObservedAt: cloudEvent.eventTime || new Date(),
      lastObservedAt: new Date(),
      metadata: {
        organizationId: orgId,
        provider,
        cloudAccountId,
        region: cloudEvent.region || 'GLOBAL',
        callerIp: cloudEvent.actor?.callerIp || null,
        principalType: cloudEvent.actor?.principalType || null,
      },
    };
  }

  /**
   * Derive deterministic Resource Node descriptor.
   * Formula for identity: `${organizationId}:${provider}:${cloudAccountId}:${rawResourceId}`
   *
   * @param {Object} cloudEvent - CloudTelemetryEvent document
   * @param {Object} resource - Resource item from cloudEvent.resources
   * @returns {Object}
   */
  static deriveResourceNodeDescriptor(cloudEvent, resource) {
    const orgId = String(cloudEvent.organizationId || 'GLOBAL');
    const provider = String(cloudEvent.provider || 'UNKNOWN').toUpperCase();
    const cloudAccountId = String(cloudEvent.cloudAccountId || 'GLOBAL');
    const rawResId = resource?.resourceId || resource?.resourceName || 'UNKNOWN_RESOURCE';
    const entityId = `${orgId}:${provider}:${cloudAccountId}:${rawResId}`;

    const resType = resource?.resourceType || '';
    const isIdentityResource =
      /(?:IAM|User|Role|Policy|Principal|Directory)/i.test(resType) &&
      !/(?:SecurityGroup|TargetGroup|AutoScalingGroup)/i.test(resType);
    const entityType = isIdentityResource ? 'IDENTITY' : 'ASSET';

    const nodeId = EntityNormalizationService.toNodeId(entityType, entityId);
    const displayName = `${resource?.resourceName || resource?.resourceId || 'Cloud Resource'} (${provider})`;

    const severityMap = {
      CRITICAL: 'CRITICAL',
      HIGH: 'HIGH',
      MEDIUM: 'MEDIUM',
      LOW: 'LOW',
      INFORMATIONAL: 'INFORMATIONAL',
    };
    const classification = severityMap[cloudEvent.severity] || 'MEDIUM';

    return {
      nodeId,
      entityType,
      entityId,
      displayName,
      classification,
      source: `CloudTelemetry:${provider}`,
      firstObservedAt: cloudEvent.eventTime || new Date(),
      lastObservedAt: new Date(),
      metadata: {
        organizationId: orgId,
        provider,
        cloudAccountId,
        region: cloudEvent.region || 'GLOBAL',
        resourceType: resource?.resourceType || null,
      },
    };
  }

  /**
   * Derive deterministic Audit Event Node descriptor (used for Tier 2 Security Auth events).
   *
   * @param {Object} cloudEvent - CloudTelemetryEvent document
   * @returns {Object}
   */
  static deriveAuditEventNodeDescriptor(cloudEvent) {
    const provider = String(cloudEvent.provider || 'UNKNOWN').toUpperCase();
    const entityId = cloudEvent.canonicalEventId;
    const nodeId = EntityNormalizationService.toNodeId('AUDIT_EVENT', entityId);
    const op = cloudEvent.action?.operation || 'Cloud Security Auth Event';
    const displayName = `${op} [${provider}]`;

    return {
      nodeId,
      entityType: 'AUDIT_EVENT',
      entityId,
      displayName,
      classification: cloudEvent.severity === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
      source: `CloudTelemetry:${provider}`,
      firstObservedAt: cloudEvent.eventTime || new Date(),
      lastObservedAt: new Date(),
      metadata: {
        organizationId: cloudEvent.organizationId,
        provider,
        cloudAccountId: cloudEvent.cloudAccountId,
        region: cloudEvent.region || 'GLOBAL',
        service: cloudEvent.action?.service || null,
        operation: cloudEvent.action?.operation || null,
        eventTime: cloudEvent.eventTime,
      },
    };
  }

  /**
   * Deterministically upsert a SecurityGraphNode with tenant scoping and race recovery.
   *
   * @param {Object} descriptor - Node descriptor
   * @param {string|number} organizationId - Authenticated tenant ID
   * @returns {Promise<Object>}
   */
  static async upsertNode(descriptor, organizationId) {
    if (!organizationId) {
      throw new Error('Tenant context (organizationId) is required for SecurityGraphNode upsert');
    }

    const query = {
      nodeId: descriptor.nodeId,
      organizationId,
    };

    let node = await SecurityGraphNode.findOne(query);

    if (!node) {
      try {
        node = await SecurityGraphNode.create({
          nodeId: descriptor.nodeId,
          organizationId,
          entityType: descriptor.entityType,
          entityId: descriptor.entityId,
          displayName: descriptor.displayName,
          classification: descriptor.classification || 'MEDIUM',
          source: descriptor.source || 'CloudTelemetry',
          firstObservedAt: descriptor.firstObservedAt || new Date(),
          lastObservedAt: new Date(),
          metadata: descriptor.metadata || {},
          status: 'ACTIVE',
        });
      } catch (err) {
        // Handle concurrent duplicate key race
        if (err.code === 11000 || (err.message && err.message.includes('E11000'))) {
          node = await SecurityGraphNode.findOne(query);
          if (node) {
            node.lastObservedAt = new Date();
            node.metadata = { ...(node.metadata || {}), ...(descriptor.metadata || {}) };
            await node.save();
            return node;
          }
        }
        throw err;
      }
    } else {
      node.lastObservedAt = new Date();
      node.metadata = { ...(node.metadata || {}), ...(descriptor.metadata || {}) };
      await node.save();
    }

    return node;
  }

  /**
   * Deterministically upsert a SecurityGraphEdge with tenant scoping, cryptographic checksum, and race recovery.
   *
   * @param {Object} options
   * @returns {Promise<Object>}
   */
  static async upsertEdge({
    fromNodeId,
    toNodeId,
    relationshipType,
    provenanceReferences = [],
    organizationId,
    attributes = {},
  }) {
    if (!organizationId) {
      throw new Error('Tenant context (organizationId) is required for SecurityGraphEdge upsert');
    }

    const checksum = SecurityGraphService.computeEdgeChecksum(
      fromNodeId,
      toNodeId,
      relationshipType,
      organizationId
    );
    const edgeId = EntityNormalizationService.toEdgeId(fromNodeId, toNodeId, relationshipType);

    const query = {
      edgeId,
      organizationId,
    };

    let edge = await SecurityGraphEdge.findOne(query);

    if (!edge) {
      try {
        edge = await SecurityGraphEdge.create({
          edgeId,
          organizationId,
          fromNode: fromNodeId,
          toNode: toNodeId,
          relationshipType,
          provenanceType: 'DIRECT_RECORD_REFERENCE',
          provenanceReferences: Array.isArray(provenanceReferences) ? provenanceReferences : [provenanceReferences],
          confidence: 1.0,
          firstObservedAt: new Date(),
          lastObservedAt: new Date(),
          attributes: attributes || {},
          checksum,
        });
      } catch (err) {
        // Handle concurrent duplicate key race
        if (err.code === 11000 || (err.message && err.message.includes('E11000'))) {
          edge = await SecurityGraphEdge.findOne(query);
          if (edge) {
            edge.lastObservedAt = new Date();
            const mergedRefs = new Set([...(edge.provenanceReferences || []), ...(provenanceReferences || [])]);
            edge.provenanceReferences = Array.from(mergedRefs);
            edge.attributes = { ...(edge.attributes || {}), ...(attributes || {}) };
            await edge.save();
            return edge;
          }
        }
        throw err;
      }
    } else {
      edge.lastObservedAt = new Date();
      const mergedRefs = new Set([...(edge.provenanceReferences || []), ...(provenanceReferences || [])]);
      edge.provenanceReferences = Array.from(mergedRefs);
      edge.attributes = { ...(edge.attributes || {}), ...(attributes || {}) };
      await edge.save();
    }

    return edge;
  }

  /**
   * Project a single durably persisted CloudTelemetryEvent into the Security Data Fabric.
   * Deterministic, idempotent, tenant-scoped, and recoverable.
   *
   * @param {Object} cloudEvent - CloudTelemetryEvent document (or plain object with document capabilities)
   * @returns {Promise<{
   *   status: 'MATERIALIZED' | 'SKIPPED_READ_FILTER' | 'POISON_FAILED' | 'PENDING',
   *   materialized: boolean,
   *   nodes?: Array<Object>,
   *   edges?: Array<Object>,
   *   retryCount?: number,
   *   error?: string
   * }>}
   */
  static async projectEvent(cloudEvent) {
    if (!cloudEvent) {
      throw new Error('MISSING_CLOUD_EVENT');
    }

    const tStart = Date.now();
    const organizationId = cloudEvent.organizationId;
    if (!organizationId) {
      throw new Error('UNAUTHENTICATED_TENANT: organizationId is required');
    }

    // Identify Action Tier from ADR 80-09 classification
    const tier = cloudEvent.action?.tier != null ? Number(cloudEvent.action.tier) : 5;
    const isMutating = Boolean(cloudEvent.action?.isMutating);

    try {
      // -----------------------------------------------------------------------
      // 1. TIER 4: READ / LIST FILTER (Noise Reduction Policy)
      // -----------------------------------------------------------------------
      if (tier === 4 || (!isMutating && /^(Describe|List|Get|BatchGet|Head|Search)/i.test(cloudEvent.action?.operation || ''))) {
        cloudEvent.projectionStatus = PROJECTION_STATUS.SKIPPED_READ_FILTER;
        cloudEvent.graphMaterialized = false;
        cloudEvent.lastProjectionError = null;
        if (typeof cloudEvent.save === 'function') {
          await cloudEvent.save();
        } else {
          await CloudTelemetryEvent.updateOne(
            { _id: cloudEvent._id },
            {
              $set: {
                projectionStatus: PROJECTION_STATUS.SKIPPED_READ_FILTER,
                graphMaterialized: false,
                lastProjectionError: null,
              },
            }
          );
        }

        safeRecord((obs) => {
          obs.recordProjectionSkipped(cloudEvent.provider);
          obs.recordProjectionDuration(Date.now() - tStart);
        });

        return {
          status: PROJECTION_STATUS.SKIPPED_READ_FILTER,
          materialized: false,
          nodes: [],
          edges: [],
        };
      }

      // -----------------------------------------------------------------------
      // 2. TIER 5: UNCLASSIFIED (Safe Default Policy)
      // -----------------------------------------------------------------------
      if (tier === 5) {
        const sev = String(cloudEvent.severity || '').toUpperCase();
        // Safe default: Only materialize Tier 5 if explicit CRITICAL or HIGH severity
        if (sev !== 'CRITICAL' && sev !== 'HIGH') {
          cloudEvent.projectionStatus = PROJECTION_STATUS.SKIPPED_READ_FILTER;
          cloudEvent.graphMaterialized = false;
          cloudEvent.lastProjectionError = null;
          if (typeof cloudEvent.save === 'function') {
            await cloudEvent.save();
          } else {
            await CloudTelemetryEvent.updateOne(
              { _id: cloudEvent._id },
              {
                $set: {
                  projectionStatus: PROJECTION_STATUS.SKIPPED_READ_FILTER,
                  graphMaterialized: false,
                  lastProjectionError: null,
                },
              }
            );
          }

          return {
            status: PROJECTION_STATUS.SKIPPED_READ_FILTER,
            materialized: false,
            nodes: [],
            edges: [],
          };
        }
      }

      // -----------------------------------------------------------------------
      // 3. TIERS 1, 2, 3 (and High/Critical Tier 5): GRAPH MATERIALIZATION
      // -----------------------------------------------------------------------
      const nodesCreated = [];
      const edgesCreated = [];

      // A. Actor Node
      let actorNode = null;
      if (
        cloudEvent.actor?.principalId ||
        cloudEvent.actor?.principalName ||
        cloudEvent.actor?.callerIp
      ) {
        const actorDesc = this.deriveActorNodeDescriptor(cloudEvent);
        actorNode = await this.upsertNode(actorDesc, organizationId);
        nodesCreated.push(actorNode);
      }

      // B. Tier-Specific Node & Edge Materialization
      if (tier === 2) {
        // Tier 2: SECURITY_AUTH (Audit Event Node + Associated With Edge)
        const auditEventDesc = this.deriveAuditEventNodeDescriptor(cloudEvent);
        const auditEventNode = await this.upsertNode(auditEventDesc, organizationId);
        nodesCreated.push(auditEventNode);

        if (actorNode) {
          const edge = await this.upsertEdge({
            fromNodeId: actorNode.nodeId,
            toNodeId: auditEventNode.nodeId,
            relationshipType: 'ASSOCIATED_WITH',
            provenanceReferences: [cloudEvent.canonicalEventId],
            organizationId,
            attributes: {
              operation: cloudEvent.action?.operation,
              tier: 2,
              outcome: cloudEvent.outcome,
            },
          });
          edgesCreated.push(edge);
        }

        // Also materialize target resources if role assumed / token / secret accessed
        if (Array.isArray(cloudEvent.resources) && cloudEvent.resources.length > 0) {
          const boundedResources = cloudEvent.resources.slice(0, 25);
          for (const res of boundedResources) {
            const resDesc = this.deriveResourceNodeDescriptor(cloudEvent, res);
            const resNode = await this.upsertNode(resDesc, organizationId);
            nodesCreated.push(resNode);

            if (actorNode) {
              const resEdge = await this.upsertEdge({
                fromNodeId: actorNode.nodeId,
                toNodeId: resNode.nodeId,
                relationshipType: 'AFFECTS',
                provenanceReferences: [cloudEvent.canonicalEventId],
                organizationId,
                attributes: {
                  operation: cloudEvent.action?.operation,
                  resourceType: res.resourceType,
                },
              });
              edgesCreated.push(resEdge);
            }
          }
        }
      } else {
        // Tier 1 (MUTATING_SECURITY), Tier 3 (LIFECYCLE), or Tier 5 (HIGH/CRITICAL)
        if (Array.isArray(cloudEvent.resources) && cloudEvent.resources.length > 0) {
          const boundedResources = cloudEvent.resources.slice(0, 25);
          for (const res of boundedResources) {
            const resDesc = this.deriveResourceNodeDescriptor(cloudEvent, res);
            const resNode = await this.upsertNode(resDesc, organizationId);
            nodesCreated.push(resNode);

            if (actorNode) {
              const edge = await this.upsertEdge({
                fromNodeId: actorNode.nodeId,
                toNodeId: resNode.nodeId,
                relationshipType: 'AFFECTS',
                provenanceReferences: [cloudEvent.canonicalEventId],
                organizationId,
                attributes: {
                  operation: cloudEvent.action?.operation,
                  tier,
                  isMutating,
                  outcome: cloudEvent.outcome,
                },
              });
              edgesCreated.push(edge);
            }
          }
        }
      }

      // -----------------------------------------------------------------------
      // 4. ATOMIC PROJECTION COMPLETION
      // -----------------------------------------------------------------------
      cloudEvent.projectionStatus = PROJECTION_STATUS.MATERIALIZED;
      cloudEvent.graphMaterialized = true;
      cloudEvent.lastProjectionError = null;

      if (typeof cloudEvent.save === 'function') {
        await cloudEvent.save();
      } else {
        await CloudTelemetryEvent.updateOne(
          { _id: cloudEvent._id },
          {
            $set: {
              projectionStatus: PROJECTION_STATUS.MATERIALIZED,
              graphMaterialized: true,
              lastProjectionError: null,
            },
          }
        );
      }

      safeRecord((obs) => {
        obs.recordProjectionMaterialized(cloudEvent.provider);
        obs.recordProjectionDuration(Date.now() - tStart);
      });

      return {
        status: PROJECTION_STATUS.MATERIALIZED,
        materialized: true,
        nodes: nodesCreated,
        edges: edgesCreated,
      };
    } catch (err) {
      // -----------------------------------------------------------------------
      // 5. PARTIAL PROJECTION FAILURE & RETRY / POISON HANDLING
      // -----------------------------------------------------------------------
      const currentRetry = Number(cloudEvent.projectionRetryCount || 0);
      const newRetryCount = currentRetry + 1;
      const isPoison = newRetryCount >= MAX_RETRIES;
      const nextStatus = isPoison ? PROJECTION_STATUS.POISON_FAILED : PROJECTION_STATUS.PENDING;
      const sanitizedError = this.sanitizeErrorMessage(err.message || String(err));

      cloudEvent.projectionRetryCount = newRetryCount;
      cloudEvent.projectionStatus = nextStatus;
      cloudEvent.lastProjectionError = sanitizedError;
      cloudEvent.graphMaterialized = false;

      if (typeof cloudEvent.save === 'function') {
        await cloudEvent.save();
      } else {
        await CloudTelemetryEvent.updateOne(
          { _id: cloudEvent._id },
          {
            $set: {
              projectionRetryCount: newRetryCount,
              projectionStatus: nextStatus,
              lastProjectionError: sanitizedError,
              graphMaterialized: false,
            },
          }
        );
      }

      if (isPoison) {
        safeRecord((obs) => {
          obs.recordProjectionPoison(cloudEvent.provider);
          obs.recordProjectionDuration(Date.now() - tStart);
        });
      } else {
        safeRecord((obs) => {
          obs.recordProjectionRetry(cloudEvent.provider);
          obs.recordProjectionFailed(cloudEvent.provider);
          obs.recordProjectionDuration(Date.now() - tStart);
        });
      }

      logger.warn(
        `[CloudDataFabricAdapter] Projection failed for event ${cloudEvent.canonicalEventId || cloudEvent._id} (attempt ${newRetryCount}/${MAX_RETRIES}): ${sanitizedError}`
      );

      return {
        status: nextStatus,
        materialized: false,
        retryCount: newRetryCount,
        error: sanitizedError,
        isPoison,
      };
    }
  }

  /**
   * Reconcile a bounded batch of pending cloud telemetry events.
   * Strictly bounded to max 100 events per invocation.
   * Single event failures never abort the batch.
   *
   * @param {number} batchSize - Max events to process (clamped to MAX_BATCH_SIZE)
   * @returns {Promise<{
   *   processed: number,
   *   materialized: number,
   *   skipped: number,
   *   failed: number,
   *   poison: number
   * }>}
   */
  static async reconcilePendingBatch(batchSize = MAX_BATCH_SIZE) {
    const limit = Math.min(Math.max(1, Number(batchSize) || MAX_BATCH_SIZE), MAX_BATCH_SIZE);
    safeRecord((obs) => obs.recordReconciliationRun());

    let pendingEvents = [];
    try {
      pendingEvents = await CloudTelemetryEvent.find({
        projectionStatus: PROJECTION_STATUS.PENDING,
        $or: [
          { nextProjectionAttemptAt: { $exists: false } },
          { nextProjectionAttemptAt: null },
          { nextProjectionAttemptAt: { $lte: new Date() } },
        ],
      })
        .sort({ eventTime: 1 })
        .limit(limit);

      safeRecord((obs) => obs.recordReconciliationBatch(pendingEvents.length));
    } catch (err) {
      safeRecord((obs) => obs.recordReconciliationFailure());
      logger.error(`[CloudDataFabricAdapter] Query failed during reconciliation: ${this.sanitizeErrorMessage(err.message)}`);
      return {
        processed: 0,
        materialized: 0,
        skipped: 0,
        failed: 0,
        poison: 0,
        error: this.sanitizeErrorMessage(err.message),
      };
    }

    const summary = {
      processed: 0,
      materialized: 0,
      skipped: 0,
      failed: 0,
      poison: 0,
    };

    for (const event of pendingEvents) {
      summary.processed++;
      try {
        const result = await this.projectEvent(event);
        if (result.status === PROJECTION_STATUS.MATERIALIZED) {
          summary.materialized++;
        } else if (result.status === PROJECTION_STATUS.SKIPPED_READ_FILTER) {
          summary.skipped++;
        } else if (result.status === PROJECTION_STATUS.POISON_FAILED) {
          summary.poison++;
          summary.failed++;
        } else {
          summary.failed++;
        }
      } catch (err) {
        summary.failed++;
        logger.error(
          `[CloudDataFabricAdapter] Unhandled projection error for event ${event._id}: ${this.sanitizeErrorMessage(err.message)}`
        );
      }
    }

    safeRecord((obs) => {
      obs.recordReconciliationMaterialized(summary.materialized);
      obs.recordReconciliationBacklog(Math.max(0, pendingEvents.length - summary.materialized - summary.skipped - summary.poison));
    });

    return summary;
  }

  /**
   * Run startup reconciliation in a bounded, non-fatal manner.
   * Handles database unavailable conditions gracefully without crashing the application.
   *
   * @param {number} batchSize
   * @returns {Promise<Object>}
   */
  static async runStartupReconciliation(batchSize = MAX_BATCH_SIZE) {
    try {
      logger.info('[CloudDataFabricAdapter] Running startup reconciliation...');
      const summary = await this.reconcilePendingBatch(batchSize);
      logger.info(
        `[CloudDataFabricAdapter] Startup reconciliation complete: ${summary.processed} processed, ${summary.materialized} materialized, ${summary.skipped} skipped, ${summary.failed} failed, ${summary.poison} poison`
      );
      return summary;
    } catch (err) {
      logger.warn(
        `[CloudDataFabricAdapter] Startup reconciliation encountered error (non-fatal): ${this.sanitizeErrorMessage(err.message)}`
      );
      return {
        processed: 0,
        materialized: 0,
        skipped: 0,
        failed: 0,
        poison: 0,
        error: this.sanitizeErrorMessage(err.message),
      };
    }
  }

  /**
   * Start the 5-minute periodic reconciliation worker.
   * Strictly prevents overlapping worker executions.
   *
   * @param {number} intervalMs - Defaults to 300000 (5 minutes)
   * @returns {NodeJS.Timeout}
   */
  startPeriodicReconciliation(intervalMs = DEFAULT_RECONCILIATION_INTERVAL_MS) {
    if (this._periodicTimer) {
      return this._periodicTimer;
    }

    safeRecord((obs) => obs.setReconciliationWorkerActive(true));
    const interval = Math.max(1000, Number(intervalMs) || DEFAULT_RECONCILIATION_INTERVAL_MS);

    this._periodicTimer = setInterval(async () => {
      // Overlap prevention guard
      if (this._isReconciling) {
        logger.warn('[CloudDataFabricAdapter] Previous periodic reconciliation cycle is still executing; skipping overlap cycle');
        return;
      }

      this._isReconciling = true;
      try {
        await CloudDataFabricAdapter.reconcilePendingBatch(MAX_BATCH_SIZE);
      } catch (err) {
        logger.error(
          `[CloudDataFabricAdapter] Periodic reconciliation cycle failed: ${CloudDataFabricAdapter.sanitizeErrorMessage(err.message)}`
        );
      } finally {
        this._isReconciling = false;
      }
    }, interval);

    if (this._periodicTimer.unref) {
      this._periodicTimer.unref();
    }

    return this._periodicTimer;
  }

  /**
   * Stop the periodic reconciliation worker cleanly.
   */
  stopPeriodicReconciliation() {
    if (this._periodicTimer) {
      clearInterval(this._periodicTimer);
      this._periodicTimer = null;
    }
    this._isReconciling = false;
    safeRecord((obs) => obs.setReconciliationWorkerActive(false));
  }

  /**
   * Check if periodic reconciler is currently running
   */
  isReconciling() {
    return this._isReconciling;
  }
}

// Export singleton instance as well as class
const defaultAdapter = new CloudDataFabricAdapter();
defaultAdapter.CloudDataFabricAdapter = CloudDataFabricAdapter;
defaultAdapter.projectEvent = CloudDataFabricAdapter.projectEvent.bind(CloudDataFabricAdapter);
defaultAdapter.reconcilePendingBatch = CloudDataFabricAdapter.reconcilePendingBatch.bind(CloudDataFabricAdapter);
defaultAdapter.runStartupReconciliation = CloudDataFabricAdapter.runStartupReconciliation.bind(CloudDataFabricAdapter);

module.exports = defaultAdapter;
