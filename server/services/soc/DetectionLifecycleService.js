/**
 * 🛡️ CyberShield X — DetectionLifecycleService (Phase 73)
 *
 * Enforces detection content lifecycle, immutable revisions, rollback,
 * promotion pipeline, human review governance, dependency verification, and safe import/export.
 */

const DetectionRule = require('../../models/DetectionRule');
const DetectionRuleRevision = require('../../models/DetectionRuleRevision');
const auditLogger = require('../../utils/auditLogger');
const logger = require('../../utils/logger');

const LEGAL_TRANSITIONS = {
  DRAFT: ['TESTING', 'REVIEW', 'RETIRED'],
  TESTING: ['REVIEW', 'DRAFT', 'RETIRED'],
  REVIEW: ['APPROVED', 'DRAFT', 'RETIRED'],
  APPROVED: ['ACTIVE', 'DRAFT', 'RETIRED'],
  ACTIVE: ['DISABLED', 'TESTING', 'RETIRED'],
  DISABLED: ['TESTING', 'DRAFT', 'ACTIVE', 'RETIRED'],
  RETIRED: ['DRAFT'],
};

const ALLOWED_OPERATORS = [
  'equals',
  'not_equals',
  'contains',
  'regex',
  'greater_than',
  'less_than',
  'in',
];

class DetectionLifecycleService {
  constructor(io = null) {
    this.io = io;
  }

  setIO(io) {
    this.io = io;
  }

  emitRealTimeEvent(event, data) {
    if (this.io) {
      try {
        this.io.emit(event, data);
      } catch (err) {
        logger.warn(`Failed to emit ${event} via Socket.IO: ${err.message}`);
      }
    }
  }

  async _findRule(ruleId, organizationId = null) {
    const or = [];
    if (ruleId && require('mongoose').Types.ObjectId.isValid(ruleId)) {
      or.push({ _id: ruleId });
    }
    if (ruleId) {
      or.push({ ruleId: String(ruleId) });
      or.push({ contentId: String(ruleId) });
    }
    const query = { $or: or };
    if (organizationId) {
      query.organizationId = organizationId;
    }
    return DetectionRule.findOne(query);
  }

  /**
   * Validates structural security of rule conditions to prevent injection
   */
  validateRuleSecurity(conditions = []) {
    const rawSerialized = JSON.stringify(conditions || {});
    const dangerousKeys = ['$where', '$eval', '$expr', '$regex', '$function', 'function', 'eval'];
    for (const dangerous of dangerousKeys) {
      if (rawSerialized.includes(`"${dangerous}"`) || rawSerialized.includes(`'${dangerous}'`)) {
        throw new Error(`Security Violation: Disallowed operator/keyword detected in condition: ${dangerous}`);
      }
    }

    const condList = Array.isArray(conditions)
      ? conditions
      : conditions && typeof conditions === 'object'
      ? [conditions]
      : [];

    for (const cond of condList) {
      if (!cond || typeof cond !== 'object') {
        throw new Error('Invalid condition item in array');
      }

      const { field, operator, value } = cond;
      if (!field || typeof field !== 'string') {
        throw new Error('Condition field must be a valid string');
      }

      const opNorm = operator ? String(operator).toLowerCase() : 'equals';
      if (!ALLOWED_OPERATORS.includes(opNorm)) {
        throw new Error(`Unsupported or unsafe operator: ${operator}`);
      }

      const strField = field.toLowerCase();
      const strVal = typeof value === 'string' ? value.toLowerCase() : JSON.stringify(value || '');

      for (const dangerous of dangerousKeys) {
        if (strField.includes(dangerous) || strVal.includes(dangerous)) {
          throw new Error(`Security Violation: Disallowed operator/keyword detected in condition: ${dangerous}`);
        }
      }

      // Prohibit shell execution strings
      if (typeof value === 'string' && /[;&|`$><]/.test(value)) {
        if (value.startsWith('sh ') || value.startsWith('bash ') || value.includes('/bin/sh')) {
          throw new Error('Security Violation: Shell execution string detected in rule condition value');
        }
      }
    }

    return true;
  }

  /**
   * Creates a new immutable revision when modifying or tuning a rule
   */
  async createRevision(ruleId, updates = {}, optionsOrActor = {}, orgId = null, noteStr = '') {
    let actor = {};
    let organizationId = null;
    let changeReason = '';
    if (typeof optionsOrActor === 'string') {
      actor = { username: optionsOrActor };
      organizationId = orgId;
      changeReason = noteStr;
    } else if (optionsOrActor && typeof optionsOrActor === 'object') {
      if (optionsOrActor.username || optionsOrActor.role) {
        actor = optionsOrActor;
        organizationId = orgId;
        changeReason = noteStr;
      } else {
        actor = optionsOrActor.actor || {};
        organizationId = optionsOrActor.organizationId || orgId;
        changeReason = optionsOrActor.changeReason || noteStr;
      }
    }

    const rule = await this._findRule(ruleId, organizationId);
    if (!rule) {
      throw new Error(`Detection rule ${ruleId} not found`);
    }

    if (updates.conditions) {
      this.validateRuleSecurity(updates.conditions);
    }

    const existingCount = await DetectionRuleRevision.countDocuments({
      $or: [
        { ruleId: rule.ruleId },
        { ruleId: String(rule._id) },
        { contentId: rule.contentId },
      ],
    });
    const newRevisionNum = existingCount === 0 ? 1 : (rule.revision || existingCount) + 1;

    // Increment semver ruleVersion (e.g. 1.0.0 -> 1.1.0 or custom)
    let newVersion = updates.ruleVersion;
    if (!newVersion) {
      if (newRevisionNum === 1) {
        newVersion = rule.ruleVersion || '1.0.0';
      } else {
        const parts = String(rule.ruleVersion || '1.0.0').split('.');
        const minor = parseInt(parts[1] || '0', 10) + 1;
        newVersion = `${parts[0] || '1'}.${minor}.0`;
      }
    }

    // Compute simple diff
    const diff = {};
    for (const key of ['name', 'description', 'severity', 'category', 'conditions', 'mitreAttack', 'dataSources', 'tags', 'confidence']) {
      if (updates[key] !== undefined) {
        diff[key] = {
          before: rule[key],
          after: updates[key],
        };
      }
    }

    // Archive current snapshot into DetectionRuleRevision
    const revisionRecord = new DetectionRuleRevision({
      revisionId: `REV-${rule.ruleId}-r${newRevisionNum}`,
      ruleId: rule.ruleId,
      contentId: rule.contentId || `DET-${rule.ruleId}`,
      revision: newRevisionNum,
      revisionNumber: newRevisionNum,
      version: newVersion,
      author: actor.username || actor.name || 'OPERATOR',
      changeReason: changeReason || updates.changeReason || 'Rule tuned/updated',
      changeSummary: changeReason || updates.changeReason || 'Rule tuned/updated',
      diff,
      ruleSnapshot: rule.toObject(),
      testSummary: {
        total: rule.testFixtures?.length || 0,
        passed: rule.testFixtures?.filter((f) => f.lastResult === 'PASS').length || 0,
        failed: rule.testFixtures?.filter((f) => f.lastResult === 'FAIL').length || 0,
        lastRunAt: new Date(),
      },
      status: 'TESTING',
      organizationId: rule.organizationId,
    });

    await revisionRecord.save();

    // Mutate rule
    Object.assign(rule, updates);
    rule.revision = newRevisionNum;
    rule.ruleVersion = newVersion;
    rule.changeReason = changeReason || updates.changeReason || 'Rule tuned/updated';
    // When tuning logic, rule must re-enter testing
    rule.status = 'TESTING';
    rule.healthStatus = 'NEEDS_TEST';

    // Mark existing fixtures as NOT_RUN because logic changed
    if (rule.testFixtures && rule.testFixtures.length > 0) {
      for (const f of rule.testFixtures) {
        f.lastResult = 'NOT_RUN';
        f.actualMatch = null;
      }
    }

    await rule.save();

    this.emitRealTimeEvent('detection:created', {
      ruleId: rule.ruleId,
      contentId: rule.contentId,
      revision: rule.revision,
      version: rule.ruleVersion,
      status: rule.status,
    });

    await auditLogger.log({
      actor,
      organizationId: rule.organizationId || organizationId,
      action: 'DETECTION_RULE_REVISION_CREATED',
      resource: { type: 'DETECTION_RULE', id: rule.ruleId },
      outcome: 'SUCCESS',
      details: { revision: newRevisionNum, version: newVersion, changeReason },
    });

    revisionRecord.rule = rule;
    revisionRecord.revisionNumber = newRevisionNum;
    return revisionRecord;
  }

  /**
   * Rollback a rule to a previously approved revision
   */
  async rollbackRule(ruleId, targetRevisionNum, optionsOrActor = {}, orgId = null, reasonStr = '') {
    let actor = {};
    let organizationId = null;
    let reason = '';
    if (typeof optionsOrActor === 'string') {
      actor = { username: optionsOrActor };
      organizationId = orgId;
      reason = reasonStr;
    } else if (optionsOrActor && typeof optionsOrActor === 'object') {
      if (optionsOrActor.username || optionsOrActor.role) {
        actor = optionsOrActor;
        organizationId = orgId;
        reason = reasonStr;
      } else {
        actor = optionsOrActor.actor || {};
        organizationId = optionsOrActor.organizationId || orgId;
        reason = optionsOrActor.reason || reasonStr;
      }
    }

    const rule = await this._findRule(ruleId, organizationId);
    if (!rule) {
      throw new Error(`Detection rule ${ruleId} not found`);
    }

    const targetRevision = await DetectionRuleRevision.findOne({
      $or: [
        { ruleId: rule.ruleId },
        { ruleId: String(rule._id) },
        { contentId: rule.contentId },
      ],
      $and: [
        { $or: [{ revision: Number(targetRevisionNum) }, { revisionNumber: Number(targetRevisionNum) }] },
      ],
    });

    if (!targetRevision) {
      throw new Error(`Target revision r${targetRevisionNum} not found for rule ${ruleId}`);
    }

    const snapshot = targetRevision.ruleSnapshot;
    const newRevisionNum = (rule.revision || 1) + 1;
    const newVersion = `${targetRevision.version}-rollback-r${newRevisionNum}`;

    // Restore conditions and metadata from snapshot
    rule.name = snapshot.name || rule.name;
    rule.description = snapshot.description || rule.description;
    rule.severity = snapshot.severity || rule.severity;
    rule.category = snapshot.category || rule.category;
    rule.conditions = snapshot.conditions || [];
    rule.mitreAttack = snapshot.mitreAttack || [];
    rule.dataSources = snapshot.dataSources || [];
    rule.testFixtures = snapshot.testFixtures || [];
    rule.revision = newRevisionNum;
    rule.ruleVersion = newVersion;
    rule.changeReason = `Rollback to revision ${targetRevisionNum}: ${reason || 'Operator rollback'}`;
    rule.status = 'APPROVED';
    rule.healthStatus = 'HEALTHY';
    rule.approvedAt = new Date();
    rule.approvedBy = actor.username || actor.name || 'OPERATOR';

    await rule.save();

    // Archive rollback event as an immutable revision itself
    const rollbackRevision = new DetectionRuleRevision({
      revisionId: `REV-${rule.ruleId}-r${newRevisionNum}`,
      ruleId: rule.ruleId,
      contentId: rule.contentId,
      revision: newRevisionNum,
      revisionNumber: newRevisionNum,
      version: newVersion,
      author: actor.username || actor.name || 'OPERATOR',
      changeReason: `Rollback to revision ${targetRevisionNum}: ${reason || 'Operator rollback'}`,
      changeSummary: `Rollback to revision ${targetRevisionNum}: ${reason || 'Operator rollback'}`,
      diff: { rolledBackTo: targetRevisionNum },
      ruleSnapshot: rule.toObject(),
      status: 'APPROVED',
      approvedAt: rule.approvedAt,
      approvedBy: rule.approvedBy,
      organizationId: rule.organizationId,
    });

    await rollbackRevision.save();

    this.emitRealTimeEvent('detection:rollback', {
      ruleId: rule.ruleId,
      contentId: rule.contentId,
      targetRevision: targetRevisionNum,
      newRevision: newRevisionNum,
    });

    await auditLogger.log({
      actor,
      organizationId: rule.organizationId || organizationId,
      action: 'DETECTION_RULE_ROLLBACK',
      resource: { type: 'DETECTION_RULE', id: rule.ruleId },
      outcome: 'SUCCESS',
      details: { targetRevisionNum, newRevisionNum, reason },
    });

    return rule;
  }

  /**
   * Promotes or transitions a rule across the lifecycle state machine
   */
  async transitionState(ruleId, targetStatus, optionsOrActor = {}, orgId = null, reasonStr = '') {
    const normTarget = String(targetStatus || '').toUpperCase();
    let actor = {};
    let organizationId = null;
    let reason = '';
    if (typeof optionsOrActor === 'string') {
      actor = { username: optionsOrActor };
      organizationId = orgId;
      reason = reasonStr;
    } else if (optionsOrActor && typeof optionsOrActor === 'object') {
      if (optionsOrActor.username || optionsOrActor.role) {
        actor = optionsOrActor;
        organizationId = orgId;
        reason = reasonStr;
      } else {
        actor = optionsOrActor.actor || {};
        organizationId = optionsOrActor.organizationId || orgId;
        reason = optionsOrActor.reason || reasonStr;
      }
    }

    const rule = await this._findRule(ruleId, organizationId);
    if (!rule) {
      throw new Error(`Detection rule ${ruleId} not found`);
    }

    const currentStatus = rule.status || 'DRAFT';
    if (currentStatus === normTarget) {
      return rule;
    }
    const allowedTargets = LEGAL_TRANSITIONS[currentStatus] || [];

    if (!allowedTargets.includes(normTarget)) {
      throw new Error(`Illegal state transition from ${currentStatus} to ${normTarget}. Allowed: ${allowedTargets.join(', ')}`);
    }

    // Guard: Moving to REVIEW requires all fixtures to be PASS
    if (normTarget === 'REVIEW') {
      const fixtures = rule.testFixtures || [];
      if (fixtures.length === 0) {
        throw new Error('Rule cannot move to REVIEW without at least one test fixture');
      }
      if (rule.healthStatus !== 'HEALTHY') {
        const hasFails = fixtures.some((f) => f.lastResult === 'FAIL');
        const hasNotRun = fixtures.some((f) => f.lastResult === 'NOT_RUN' || !f.lastResult);
        if (hasFails || hasNotRun) {
          throw new Error('Rule must pass all test fixtures before moving to REVIEW');
        }
      }
    }

    rule.status = normTarget;
    if (normTarget === 'ACTIVE') {
      rule.enabled = true;
      rule.activatedAt = new Date();
    } else if (normTarget === 'DISABLED') {
      rule.enabled = false;
      rule.disabledAt = new Date();
    } else if (normTarget === 'RETIRED') {
      rule.enabled = false;
      rule.retiredAt = new Date();
    }

    await rule.save();

    this.emitRealTimeEvent(`detection:${normTarget.toLowerCase()}`, {
      ruleId: rule.ruleId,
      status: normTarget,
      actor: actor.username || actor.name,
    });

    await auditLogger.log({
      actor,
      organizationId: rule.organizationId || organizationId,
      action: 'DETECTION_RULE_TRANSITIONED',
      resource: { type: 'DETECTION_RULE', id: rule.ruleId },
      outcome: 'SUCCESS',
      details: { previousStatus: currentStatus, newStatus: normTarget, reason },
    });

    return rule;
  }

  /**
   * Human review workflow (Operator/Admin)
   */
  async reviewRule(ruleId, decision, optionsOrActor = {}, orgId = null, notesStr = '') {
    const normDecision = String(decision || '').toUpperCase();
    if (!['APPROVE', 'REJECT', 'REQUEST_CHANGES'].includes(normDecision)) {
      throw new Error('Invalid review decision. Must be APPROVE, REJECT, or REQUEST_CHANGES');
    }

    let actor = {};
    let organizationId = null;
    let decisionReason = '';
    let risk = 'LOW';
    if (typeof optionsOrActor === 'string') {
      actor = { username: optionsOrActor };
      organizationId = orgId;
      decisionReason = notesStr;
    } else if (optionsOrActor && typeof optionsOrActor === 'object') {
      if (optionsOrActor.username || optionsOrActor.role) {
        actor = optionsOrActor;
        organizationId = orgId;
        decisionReason = notesStr;
      } else {
        actor = optionsOrActor.actor || {};
        organizationId = optionsOrActor.organizationId || orgId;
        decisionReason = optionsOrActor.decisionReason || notesStr;
        risk = optionsOrActor.risk || 'LOW';
      }
    }

    const rule = await this._findRule(ruleId, organizationId);
    if (!rule) {
      throw new Error(`Detection rule ${ruleId} not found`);
    }

    const reviewerName = actor.username || actor.name || 'OPERATOR';
    const testSummary = {
      total: rule.testFixtures?.length || 0,
      passed: rule.testFixtures?.filter((f) => f.lastResult === 'PASS').length || 0,
      failed: rule.testFixtures?.filter((f) => f.lastResult === 'FAIL').length || 0,
    };

    rule.reviewHistory = rule.reviewHistory || [];
    rule.reviewHistory.push({
      reviewer: reviewerName,
      decision: normDecision,
      decisionReason,
      reviewedVersion: rule.ruleVersion,
      reviewedRevision: rule.revision || 1,
      testSummary,
      risk,
      timestamp: new Date(),
    });

    if (normDecision === 'APPROVE') {
      rule.status = 'APPROVED';
      rule.approvedAt = new Date();
      rule.approvedBy = reviewerName;
    } else {
      rule.status = 'DRAFT';
    }

    await rule.save();

    this.emitRealTimeEvent('detection:reviewed', {
      ruleId: rule.ruleId,
      decision: normDecision,
      reviewer: reviewerName,
      status: rule.status,
    });

    await auditLogger.log({
      actor,
      organizationId: rule.organizationId || organizationId,
      action: 'DETECTION_RULE_REVIEWED',
      resource: { type: 'DETECTION_RULE', id: rule.ruleId },
      outcome: 'SUCCESS',
      details: { decision: normDecision, decisionReason, reviewer: reviewerName },
    });

    return rule;
  }

  /**
   * Verifies required dependencies and activates an approved rule
   */
  async activateRule(ruleId, optionsOrActor = {}, orgId = null) {
    let actor = {};
    let organizationId = null;
    if (typeof optionsOrActor === 'string') {
      actor = { username: optionsOrActor };
      organizationId = orgId;
    } else if (optionsOrActor && typeof optionsOrActor === 'object') {
      if (optionsOrActor.username || optionsOrActor.role) {
        actor = optionsOrActor;
        organizationId = orgId;
      } else {
        actor = optionsOrActor.actor || {};
        organizationId = optionsOrActor.organizationId || orgId;
      }
    }

    const rule = await this._findRule(ruleId, organizationId);
    if (!rule) {
      throw new Error(`Detection rule ${ruleId} not found`);
    }

    if (!['APPROVED', 'DISABLED'].includes(rule.status)) {
      throw new Error(`Rule must be in APPROVED or DISABLED status to be activated (current: ${rule.status})`);
    }

    // Verify test health
    if (rule.testFixtures && rule.testFixtures.some((f) => f.lastResult === 'FAIL')) {
      rule.healthStatus = 'FAILING_TESTS';
      await rule.save();
      throw new Error('Cannot activate rule: One or more test fixtures are FAILING');
    }

    // Verify dependencies: data sources must be declared
    if (rule.dependencies?.dataSources && rule.dependencies.dataSources.length > 0) {
      const invalidDS = rule.dependencies.dataSources.filter(
        (ds) => typeof ds !== 'string' || ds.trim() === ''
      );
      if (invalidDS.length > 0) {
        rule.healthStatus = 'EXPIRED_DEPENDENCY';
        await rule.save();
        throw new Error('Cannot activate rule: Required data source dependency is invalid');
      }
    }

    rule.status = 'ACTIVE';
    rule.enabled = true;
    rule.activatedAt = new Date();

    await rule.save();

    this.emitRealTimeEvent('detection:activated', {
      ruleId: rule.ruleId,
      status: 'ACTIVE',
      enabled: true,
    });

    await auditLogger.log({
      actor,
      organizationId: rule.organizationId || organizationId,
      action: 'DETECTION_RULE_ACTIVATED',
      resource: { type: 'DETECTION_RULE', id: rule.ruleId },
      outcome: 'SUCCESS',
      details: { ruleId: rule.ruleId, version: rule.ruleVersion },
    });

    return rule;
  }

  /**
   * Disables an active rule with operator justification
   */
  async disableRule(ruleId, optionsOrActor = {}, orgId = null, reasonStr = '') {
    let actor = {};
    let organizationId = null;
    let reason = '';
    if (typeof optionsOrActor === 'string') {
      actor = { username: optionsOrActor };
      organizationId = orgId;
      reason = reasonStr;
    } else if (optionsOrActor && typeof optionsOrActor === 'object') {
      if (optionsOrActor.username || optionsOrActor.role) {
        actor = optionsOrActor;
        organizationId = orgId;
        reason = reasonStr;
      } else {
        actor = optionsOrActor.actor || {};
        organizationId = optionsOrActor.organizationId || orgId;
        reason = optionsOrActor.reason || reasonStr;
      }
    }

    const rule = await this._findRule(ruleId, organizationId);
    if (!rule) {
      throw new Error(`Detection rule ${ruleId} not found`);
    }

    rule.status = 'DISABLED';
    rule.enabled = false;
    rule.disabledAt = new Date();
    rule.healthStatus = 'DISABLED';

    await rule.save();

    this.emitRealTimeEvent('detection:disabled', {
      ruleId: rule.ruleId,
      status: 'DISABLED',
      reason,
    });

    await auditLogger.log({
      actor,
      organizationId: rule.organizationId || organizationId,
      action: 'DETECTION_RULE_DISABLED',
      resource: { type: 'DETECTION_RULE', id: rule.ruleId },
      outcome: 'SUCCESS',
      details: { ruleId: rule.ruleId, reason },
    });

    return rule;
  }

  /**
   * Safe import for detection rule JSON payloads (validates structure, rejects code injection)
   */
  async validateAndImportRule(payload, optionsOrActor = {}, orgId = null) {
    if (!payload || typeof payload !== 'object') {
      throw new Error('Import payload must be a valid JSON object');
    }

    let actor = {};
    let organizationId = null;
    if (typeof optionsOrActor === 'string') {
      actor = { username: optionsOrActor };
      organizationId = orgId;
    } else if (optionsOrActor && typeof optionsOrActor === 'object') {
      if (optionsOrActor.username || optionsOrActor.role) {
        actor = optionsOrActor;
        organizationId = orgId;
      } else {
        actor = optionsOrActor.actor || {};
        organizationId = optionsOrActor.organizationId || orgId;
      }
    }

    const { name, conditions, severity, category, mitreAttack, testFixtures, ruleId } = payload;
    if (!name || typeof name !== 'string') {
      throw new Error('Rule name is required');
    }

    this.validateRuleSecurity(conditions || []);

    const effectiveRuleId = ruleId || `RULE-IMP-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    // Imported rules start strictly in DRAFT with enabled: false
    const rule = new DetectionRule({
      ruleId: effectiveRuleId,
      contentId: payload.contentId || `DET-${effectiveRuleId}`,
      name,
      description: payload.description || 'Imported detection rule',
      severity: severity || 'MEDIUM',
      category: category || 'CUSTOM',
      status: 'DRAFT',
      enabled: false,
      ruleVersion: payload.ruleVersion || '1.0.0',
      revision: 1,
      conditions: conditions || [],
      mitreAttack: mitreAttack || [],
      dataSources: payload.dataSources || [],
      testFixtures: testFixtures || [],
      healthStatus: 'NEEDS_TEST',
      author: actor.username || actor.name || 'OPERATOR',
      organizationId,
    });

    await rule.save();

    // Create initial revision
    const initialRev = new DetectionRuleRevision({
      revisionId: `REV-${rule.ruleId}-r1`,
      ruleId: rule.ruleId,
      contentId: rule.contentId,
      revision: 1,
      revisionNumber: 1,
      version: rule.ruleVersion,
      author: actor.username || actor.name || 'OPERATOR',
      changeReason: 'Initial imported revision',
      changeSummary: 'Initial imported revision',
      diff: { initialImport: true },
      ruleSnapshot: rule.toObject(),
      status: 'DRAFT',
      organizationId: rule.organizationId,
    });

    await initialRev.save();

    await auditLogger.log({
      actor,
      organizationId: rule.organizationId || organizationId,
      action: 'DETECTION_RULE_IMPORTED',
      resource: { type: 'DETECTION_RULE', id: rule.ruleId },
      outcome: 'SUCCESS',
      details: { ruleId: rule.ruleId, contentId: rule.contentId },
    });

    return rule;
  }
}

module.exports = new DetectionLifecycleService();
