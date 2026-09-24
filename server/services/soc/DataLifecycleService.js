/**
 * 🛡️ CyberShield X — DataLifecycleService (Phase 75)
 *
 * Enterprise Data Retention & Lifecycle Engine:
 * - Real timestamp-based eligibility calculation against persisted platform collections
 * - Non-mutating dry-run preview with blocker analysis
 * - Strict LEGAL_HOLD enforcement checked before and at mutation boundary
 * - Bounded destructive execution strictly capped at 500 records per batch
 * - Complete audit trail, operation IDs, and real-time socket events
 */

const crypto = require('crypto');
const RetentionPolicy = require('../../models/RetentionPolicy');
const AuditEvent = require('../../models/AuditEvent');
const SOCReport = require('../../models/SOCReport');
const ComplianceEvidence = require('../../models/ComplianceEvidence');
const Incident = require('../../models/Incident');
const Case = require('../../models/Case');
const Finding = require('../../models/Finding');
const Alert = require('../../models/Alert');
const ThreatHunt = require('../../models/ThreatHunt');
const ThreatHuntExecution = require('../../models/ThreatHuntExecution');
const DetectionRule = require('../../models/DetectionRule');
const MetricSnapshot = require('../../models/MetricSnapshot');
const CloudTelemetryEvent = require('../../models/CloudTelemetryEvent');
const IntegrationSyncEvent = require('../../models/IntegrationSyncEvent');
const logger = require('../../utils/logger');

class DataLifecycleService {
  constructor() {
    this.io = null;
    this.MAX_BATCH_SIZE = 500;
  }

  setIO(ioInstance) {
    this.io = ioInstance;
  }

  _broadcast(eventName, payload, customIO = null) {
    const io = customIO || this.io;
    if (!io) return;
    try {
      io.emit(eventName, payload);
    } catch (err) {
      logger.warn(`Failed to broadcast ${eventName}: ${err.message}`);
    }
  }

  async _recordAudit({ organizationId, actor, action, resourceId, details, outcome = 'SUCCESS' }) {
    try {
      const eventId = 'AUD-' + crypto.randomBytes(6).toString('hex');
      await AuditEvent.create({
        eventId,
        organizationId,
        actor: {
          userId: actor?.id || actor?._id || actor?.userId || 'system',
          username: actor?.username || 'SYSTEM',
          email: actor?.email || 'system@cybershield.local',
          role: actor?.role || 'ADMIN',
          ip: actor?.ip || '127.0.0.1',
        },
        action,
        resource: {
          resourceType: 'RETENTION_POLICY',
          resourceId: String(resourceId),
          type: 'RETENTION_POLICY',
          id: String(resourceId),
        },
        outcome,
        details: details || {},
        timestamp: new Date(),
      });
    } catch (err) {
      logger.warn(`DataLifecycleService audit recording failed: ${err.message}`);
    }
  }

  /**
   * Resolves the Mongoose model and primary date field for an entityType
   */
  _resolveEntityModel(entityType) {
    switch (entityType) {
      case 'audit_events':
        return { model: AuditEvent, dateField: 'timestamp', idField: 'eventId' };
      case 'reports':
        return { model: SOCReport, dateField: 'createdAt', idField: 'reportId' };
      case 'evidence_packages':
        return { model: ComplianceEvidence, dateField: 'createdAt', idField: 'evidenceId' };
      case 'incidents':
        return { model: Incident, dateField: 'createdAt', idField: 'incidentId' };
      case 'cases':
        return { model: Case, dateField: 'createdAt', idField: 'caseId' };
      case 'findings':
        return { model: Finding, dateField: 'createdAt', idField: 'findingId' };
      case 'alerts':
        return { model: Alert, dateField: 'createdAt', idField: '_id' };
      case 'threat_hunts':
        return { model: ThreatHunt, dateField: 'createdAt', idField: 'huntId' };
      case 'threat_hunt_executions':
        return { model: ThreatHuntExecution, dateField: 'createdAt', idField: 'executionId' };
      case 'detection_rules':
        return { model: DetectionRule, dateField: 'createdAt', idField: 'ruleId' };
      case 'metric_snapshots':
        return { model: MetricSnapshot, dateField: 'timestamp', idField: 'snapshotId' };
      case 'cloud_telemetry':
        return { model: CloudTelemetryEvent, dateField: 'eventTime', idField: 'canonicalEventId' };
      case 'integration_audit':
        return { model: IntegrationSyncEvent, dateField: 'processedAt', idField: 'syncId' };
      default:
        throw new Error(`Unsupported entityType for data retention: ${entityType}`);
    }
  }

  /**
   * Retrieves or builds a tenant-scoped query for the target entity collection
   */
  _buildTenantQuery(organizationId, cutoffDate, dateField) {
    return {
      organizationId,
      [dateField]: { $lt: cutoffDate },
    };
  }

  /**
   * Dry Run: Evaluates retention eligibility WITHOUT mutating any data.
   */
  async dryRunRetention(organizationId, entityType, customIO = null) {
    if (!organizationId) throw new Error('organizationId is required');
    if (!entityType) throw new Error('entityType is required');

    const { model, dateField, idField } = this._resolveEntityModel(entityType);

    // Look up retention policy for this tenant and entityType
    const policy = await RetentionPolicy.findOne({ organizationId, entityType });
    const retentionDays = policy?.retentionDays || 90;
    const retentionClass = policy?.retentionClass || 'EXPIRE';
    const legalHoldActive = Boolean(policy?.legalHoldActive);

    const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
    const query = this._buildTenantQuery(organizationId, cutoffDate, dateField);

    // Count eligible records in real persisted database
    const eligibleCount = await model.countDocuments(query);

    // Fetch sample IDs (up to 10)
    const samples = await model.find(query).limit(10).select(`${idField} ${dateField}`).lean();
    const sampleIds = samples.map((s) => String(s[idField] || s._id));

    const blockers = [];
    if (legalHoldActive) {
      blockers.push('LEGAL_HOLD_ACTIVE');
    }
    if (!policy) {
      blockers.push('RETENTION_POLICY_NOT_CONFIGURED');
    }

    const projectedAction = legalHoldActive
      ? 'BLOCKED'
      : retentionClass === 'ARCHIVE'
      ? 'ARCHIVE'
      : 'DELETE';

    const result = {
      dryRun: true,
      organizationId,
      entityType,
      retentionDays,
      retentionClass,
      legalHoldActive,
      legalHoldReason: policy?.legalHoldReason || null,
      cutoffDate,
      eligibleCount,
      sampleIds,
      projectedAction,
      blockers,
      executedAt: new Date(),
    };

    this._broadcast('retention:dry-run-completed', result, customIO);
    return result;
  }

  /**
   * Destructive or Archival Retention Execution:
   * Strictly bounded to MAX 500 records per execution.
   * Legal hold is strictly enforced before execution and at mutation boundary.
   */
  async executeRetention(organizationId, entityType, adminUser, options = {}, customIO = null) {
    if (!organizationId) throw new Error('organizationId is required');
    if (!entityType) throw new Error('entityType is required');
    if (!adminUser || adminUser.role !== 'ADMIN') {
      throw new Error('UNAUTHORIZED: Retention execution requires explicit ADMIN authorization');
    }

    const operationId = 'RET-' + crypto.randomBytes(6).toString('hex').toUpperCase();
    const requestedBatch = parseInt(options.batchSize || options.limit, 10) || this.MAX_BATCH_SIZE;
    const batchLimit = Math.min(Math.max(1, requestedBatch), this.MAX_BATCH_SIZE);

    this._broadcast(
      'retention:execution-started',
      { operationId, organizationId, entityType, batchLimit },
      customIO
    );

    // 1. BOUNDARY CHECK 1: Verify legal hold before querying records
    const policy = await RetentionPolicy.findOne({ organizationId, entityType });
    if (policy && policy.legalHoldActive) {
      const blockedResult = {
        operationId,
        status: 'LEGAL_HOLD',
        blocked: true,
        organizationId,
        entityType,
        deletedCount: 0,
        archivedCount: 0,
        eligibleCount: 0,
        reason: `Active legal hold blocks retention execution: ${policy.legalHoldReason || 'Regulatory Preservation Hold'}`,
        executedAt: new Date(),
      };

      await this._recordAudit({
        organizationId,
        actor: adminUser,
        action: 'RETENTION_EXECUTION_BLOCKED_LEGAL_HOLD',
        resourceId: entityType,
        details: blockedResult,
        outcome: 'BLOCKED',
      });

      this._broadcast('retention:execution-failed', blockedResult, customIO);
      return blockedResult;
    }

    const retentionDays = policy?.retentionDays || 90;
    const retentionClass = policy?.retentionClass || 'EXPIRE';
    const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);

    const { model, dateField, idField } = this._resolveEntityModel(entityType);
    const query = this._buildTenantQuery(organizationId, cutoffDate, dateField);

    // Count all currently eligible records
    const totalEligible = await model.countDocuments(query);

    // Fetch batch to process
    const targetRecords = await model.find(query).limit(batchLimit).select(`_id ${idField}`).lean();
    const targetInternalIds = targetRecords.map((r) => r._id);
    const sampleProcessedIds = targetRecords.slice(0, 10).map((r) => String(r[idField] || r._id));

    // 2. BOUNDARY CHECK 2: Re-verify legal hold AT MUTATION BOUNDARY
    const policyRecheck = await RetentionPolicy.findOne({ organizationId, entityType });
    if (policyRecheck && policyRecheck.legalHoldActive) {
      const blockedAtBoundaryResult = {
        operationId,
        status: 'LEGAL_HOLD',
        blocked: true,
        organizationId,
        entityType,
        deletedCount: 0,
        archivedCount: 0,
        eligibleCount: totalEligible,
        reason: 'Legal hold was engaged immediately prior to mutation boundary',
        executedAt: new Date(),
      };

      this._broadcast('retention:execution-failed', blockedAtBoundaryResult, customIO);
      return blockedAtBoundaryResult;
    }

    let deletedCount = 0;
    let archivedCount = 0;
    let failedCount = 0;

    if (targetInternalIds.length > 0) {
      if (retentionClass === 'ARCHIVE') {
        // Mark as archived if supported, otherwise soft delete or set retentionStatus
        try {
          const updateRes = await model.updateMany(
            { _id: { $in: targetInternalIds }, organizationId },
            { $set: { retentionStatus: 'ARCHIVED', archivedAt: new Date() } }
          );
          archivedCount = updateRes.modifiedCount || targetInternalIds.length;
        } catch (err) {
          logger.error(`Retention archive error: ${err.message}`);
          failedCount = targetInternalIds.length;
        }
      } else {
        // Destructive deletion strictly bounded to the target internal IDs
        try {
          const delRes = await model.deleteMany({
            _id: { $in: targetInternalIds },
            organizationId,
          });
          deletedCount = delRes.deletedCount || 0;
        } catch (err) {
          logger.error(`Retention delete error: ${err.message}`);
          failedCount = targetInternalIds.length;
        }
      }
    }

    const outcome = {
      operationId,
      status: failedCount > 0 && deletedCount === 0 && archivedCount === 0 ? 'FAILED' : 'SUCCESS',
      organizationId,
      entityType,
      retentionDays,
      retentionClass,
      batchLimit,
      eligibleCount: totalEligible,
      processedCount: targetInternalIds.length,
      deletedCount,
      archivedCount,
      failedCount,
      sampleProcessedIds,
      executedAt: new Date(),
    };

    await this._recordAudit({
      organizationId,
      actor: adminUser,
      action: 'RETENTION_EXECUTION_COMPLETED',
      resourceId: entityType,
      details: outcome,
      outcome: outcome.status,
    });

    this._broadcast('retention:execution-completed', outcome, customIO);
    return outcome;
  }

  /**
   * Applies or lifts a legal hold on a specific entity type
   */
  async setLegalHold(organizationId, entityType, active, reason = '', adminUser, customIO = null) {
    if (!organizationId) throw new Error('organizationId is required');
    if (!entityType) throw new Error('entityType is required');
    if (!adminUser || adminUser.role !== 'ADMIN') {
      throw new Error('UNAUTHORIZED: Modifying legal holds requires ADMIN privileges');
    }

    let policy = await RetentionPolicy.findOne({ organizationId, entityType });

    if (!policy) {
      const retentionId = 'RET-' + crypto.randomBytes(6).toString('hex').toUpperCase();
      policy = new RetentionPolicy({
        retentionId,
        organizationId,
        name: `${entityType} Retention Policy`,
        entityType,
        retentionDays: 90,
        retentionClass: active ? 'LEGAL_HOLD' : 'EXPIRE',
      });
    }

    policy.legalHoldActive = Boolean(active);
    if (active) {
      policy.legalHoldReason = reason || 'Regulatory legal hold order';
      policy.legalHoldAppliedBy = {
        id: String(adminUser._id || adminUser.id || 'admin'),
        username: adminUser.username || 'ADMIN',
        role: adminUser.role || 'ADMIN',
      };
      policy.legalHoldAppliedAt = new Date();
      policy.retentionClass = 'LEGAL_HOLD';
    } else {
      policy.legalHoldReason = null;
      policy.retentionClass = 'EXPIRE';
    }

    await policy.save();

    await this._recordAudit({
      organizationId,
      actor: adminUser,
      action: active ? 'LEGAL_HOLD_APPLIED' : 'LEGAL_HOLD_REMOVED',
      resourceId: entityType,
      details: { entityType, active, reason: policy.legalHoldReason },
    });

    return policy;
  }

  /**
   * Lists all retention policies for an organization
   */
  async getRetentionPolicies(organizationId) {
    return await RetentionPolicy.find({ organizationId }).sort({ entityType: 1 });
  }

  /**
   * Upserts a retention policy for an entity type
   */
  async upsertRetentionPolicy(organizationId, policyData, adminUser) {
    if (!organizationId) throw new Error('organizationId is required');
    if (!adminUser || adminUser.role !== 'ADMIN') {
      throw new Error('UNAUTHORIZED: Retention policy management requires ADMIN privileges');
    }

    const { entityType, name, description, retentionDays, retentionClass } = policyData;
    if (!entityType) throw new Error('entityType is required');

    let policy = await RetentionPolicy.findOne({ organizationId, entityType });

    if (policy) {
      if (name) policy.name = name;
      if (description !== undefined) policy.description = description;
      if (retentionDays) policy.retentionDays = retentionDays;
      if (retentionClass && !policy.legalHoldActive) policy.retentionClass = retentionClass;
      await policy.save();
    } else {
      const retentionId = 'RET-' + crypto.randomBytes(6).toString('hex').toUpperCase();
      policy = await RetentionPolicy.create({
        retentionId,
        organizationId,
        name: name || `${entityType} Retention Policy`,
        description: description || '',
        entityType,
        retentionDays: retentionDays || 90,
        retentionClass: retentionClass || 'EXPIRE',
        status: 'ACTIVE',
      });
    }

    await this._recordAudit({
      organizationId,
      actor: adminUser,
      action: 'RETENTION_POLICY_UPSERTED',
      resourceId: entityType,
      details: { entityType, retentionDays: policy.retentionDays, retentionClass: policy.retentionClass },
    });

    return policy;
  }
}

module.exports = new DataLifecycleService();
