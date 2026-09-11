/**
 * 🛡️ CyberShield X — DetectionRuleEngine (Phase 70)
 *
 * Deterministic detection rule evaluation engine with explainable evidence output.
 * Evaluates conditions against real events, findings, and tool outputs.
 * Enforces expiring suppressions (zero permanent silent suppression).
 * Provides a testing harness for isolated rule validation.
 */

const DetectionRule = require('../../models/DetectionRule');
const DetectionSuppression = require('../../models/DetectionSuppression');
const auditLogger = require('../../utils/auditLogger');
const logger = require('../../utils/logger');

class DetectionRuleEngine {
  /**
   * Evaluates a single condition against the given event context
   * @param {Object} condition - { field, operator, value }
   * @param {Object} context - Event or finding payload
   * @returns {{ matched: boolean, actualValue: any }}
   */
  evaluateCondition(condition, context) {
    const { field, operator, value } = condition;
    let actualValue = undefined;

    if (!context || typeof context !== 'object') {
      return { matched: false, actualValue: undefined };
    }

    // Support dot notation: e.g. "details.port" or "rawEvidence.vulnerabilities"
    if (field.includes('.')) {
      const parts = field.split('.');
      let current = context;
      for (const part of parts) {
        if (current && typeof current === 'object' && part in current) {
          current = current[part];
        } else {
          current = undefined;
          break;
        }
      }
      actualValue = current;
    } else {
      actualValue = context[field];
    }

    if (actualValue === undefined || actualValue === null) {
      // Invert check for not_equals
      if (operator === 'not_equals') return { matched: true, actualValue: null };
      return { matched: false, actualValue: undefined };
    }

    let matched = false;
    const strActual = String(actualValue).toLowerCase();
    const strTarget = String(value).toLowerCase();

    switch (operator) {
      case 'equals':
        matched = strActual === strTarget;
        break;
      case 'not_equals':
        matched = strActual !== strTarget;
        break;
      case 'contains':
        if (Array.isArray(actualValue)) {
          matched = actualValue.some((item) => String(item).toLowerCase().includes(strTarget));
        } else {
          matched = strActual.includes(strTarget);
        }
        break;
      case 'regex':
        try {
          const reg = new RegExp(String(value), 'i');
          matched = reg.test(strActual);
        } catch {
          matched = false;
        }
        break;
      case 'greater_than':
        matched = Number(actualValue) > Number(value);
        break;
      case 'less_than':
        matched = Number(actualValue) < Number(value);
        break;
      case 'in':
        if (Array.isArray(value)) {
          matched = value.some((v) => String(v).toLowerCase() === strActual);
        } else {
          matched = String(value)
            .split(',')
            .map((s) => s.trim().toLowerCase())
            .includes(strActual);
        }
        break;
      default:
        matched = false;
    }

    return { matched, actualValue };
  }

  /**
   * Checks if an event is currently suppressed under an active non-expired suppression
   * @param {string} ruleId
   * @param {Object} event
   * @returns {Promise<{ isSuppressed: boolean, suppression: Object|null }>}
   */
  async checkSuppression(ruleId, event) {
    try {
      const now = new Date();
      // Only active suppressions whose expiration date is strictly in the future
      const activeSuppressions = await DetectionSuppression.find({
        ruleId,
        active: true,
        expiresAt: { $gt: now },
      });

      for (const supp of activeSuppressions) {
        const patternObj = (supp.pattern && Object.keys(supp.pattern).length > 0) ? supp.pattern : (supp.scope || {});
        if (!patternObj || typeof patternObj !== 'object') continue;

        let patternMatches = true;
        for (const [key, expectedVal] of Object.entries(patternObj)) {
          const actual = event[key];
          if (String(actual).toLowerCase() !== String(expectedVal).toLowerCase()) {
            patternMatches = false;
            break;
          }
        }

        if (patternMatches) {
          return { isSuppressed: true, suppression: supp };
        }
      }
    } catch (err) {
      logger.warn(`Suppression check failed: ${err.message}`);
    }

    return { isSuppressed: false, suppression: null };
  }

  /**
   * Helper returning boolean for suppression state
   */
  async isSuppressed(ruleId, event) {
    const res = await this.checkSuppression(ruleId, event);
    return res.isSuppressed;
  }

  /**
   * Evaluates a single rule against an event
   * @param {Object} rule - DetectionRule document or plain object
   * @param {Object} event - Event or Finding data
   * @returns {Promise<Object>} Evaluation result
   */
  async evaluateRule(rule, event) {
    if (!rule || !event) {
      return { matched: false, reason: 'INVALID_INPUT' };
    }

    // Check enabled status
    if (rule.enabled === false || rule.status === 'DISABLED') {
      return { matched: false, reason: 'RULE_DISABLED' };
    }

    // Check active suppression
    const suppressionResult = await this.checkSuppression(rule.ruleId, event);
    if (suppressionResult.isSuppressed) {
      return {
        matched: false,
        reason: 'SUPPRESSED',
        suppressionReason: suppressionResult.suppression?.reason,
        expiresAt: suppressionResult.suppression?.expiresAt,
      };
    }

    const conditions = rule.conditions || [];
    if (conditions.length === 0) {
      return { matched: false, reason: 'NO_CONDITIONS' };
    }

    const matchingFields = [];
    let allConditionsMet = true;

    for (const cond of conditions) {
      const { matched, actualValue } = this.evaluateCondition(cond, event);
      if (matched) {
        matchingFields.push({ field: cond.field, operator: cond.operator, expected: cond.value, actual: actualValue });
      } else {
        allConditionsMet = false;
        break;
      }
    }

    if (allConditionsMet) {
      return {
        matched: true,
        matches: true,
        outcome: 'MATCH',
        matchedConditions: matchingFields,
        ruleId: rule.ruleId,
        ruleName: rule.name,
        severity: rule.severity,
        category: rule.category,
        responsePolicy: rule.responsePolicy,
        matchingFields,
        evidenceRef: event.executionId || event.findingId || event.id || 'EVID_DIRECT',
        timestamp: new Date(),
      };
    }

    return {
      matched: false,
      matches: false,
      outcome: 'NO_MATCH',
      matchedConditions: [],
      reason: 'CONDITIONS_NOT_MET',
    };
  }

  /**
   * Evaluates an incoming event or finding against all active detection rules
   * @param {Object} event
   * @param {Object} [options]
   * @returns {Promise<Array<Object>>} List of matched detections
   */
  async evaluateEvent(event, options = {}) {
    let rules = [];
    try {
      const query = { enabled: true, status: 'ACTIVE' };
      if (options.organizationId) {
        query.$or = [{ organizationId: options.organizationId }, { organizationId: null }];
      }
      rules = await DetectionRule.find(query);
    } catch (err) {
      logger.warn(`Failed to fetch active rules: ${err.message}`);
      return [];
    }

    const detections = [];

    for (const rule of rules) {
      const evalRes = await this.evaluateRule(rule, event);
      if (evalRes.matched) {
        detections.push(evalRes);

        // Increment rule match statistics
        try {
          await DetectionRule.updateOne(
            { ruleId: rule.ruleId },
            {
              $inc: { matchCount: 1 },
              $set: { lastTriggeredAt: new Date() },
            }
          );
        } catch {
          // ignore stat update failure
        }
      }
    }

    return detections;
  }

  /**
   * Deterministic test harness for isolated rule testing
   * @param {Object} rule
   * @param {Object} fixtureEvent
   * @param {boolean} [expectedMatch=true]
   * @returns {{ verdict: 'PASS'|'FAIL'|'NO_MATCH_EXPECTED', result: Object }}
   */
  async testRule(rule, fixtureEvent, expectedMatch = true) {
    const conditions = rule.conditions || [];
    const matchingFields = [];
    let allConditionsMet = true;

    for (const cond of conditions) {
      const { matched, actualValue } = this.evaluateCondition(cond, fixtureEvent);
      if (matched) {
        matchingFields.push({ field: cond.field, operator: cond.operator, actual: actualValue });
      } else {
        allConditionsMet = false;
        break;
      }
    }

    const matched = allConditionsMet;
    let verdict = 'PASS';

    if (expectedMatch) {
      verdict = matched ? 'PASS' : 'FAIL';
    } else {
      verdict = !matched ? 'NO_MATCH_EXPECTED' : 'FAIL';
    }

    return {
      verdict,
      matched,
      outcome: matched ? 'MATCH' : 'NO_MATCH',
      matchingFields,
      ruleId: rule.ruleId,
      severity: rule.severity,
    };
  }

  /**
   * Approves a candidate DRAFT detection rule (e.g. proposed by AI)
   * @param {string} ruleId
   * @param {Object} approver - { userId, username, role }
   * @returns {Promise<Object>}
   */
  async approveRule(ruleId, approver) {
    const rule = await DetectionRule.findOne({ ruleId });
    if (!rule) {
      throw new Error(`Detection rule ${ruleId} not found`);
    }

    rule.status = 'ACTIVE';
    rule.enabled = true;
    rule.version += 1;
    await rule.save();

    await auditLogger.log({
      actor: approver,
      action: 'RULE_APPROVAL',
      resource: { type: 'DETECTION_RULE', id: ruleId },
      outcome: 'SUCCESS',
      details: { previousStatus: 'DRAFT', newStatus: 'ACTIVE', version: rule.version },
    });

    return rule;
  }

  /**
   * Creates an auditable expiring suppression
   * @param {Object} params
   * @returns {Promise<Object>}
   */
  async createSuppression({ ruleId, pattern, reason, actor, expiresAt, organizationId = null }) {
    if (!reason || reason.trim().length === 0) {
      throw new Error('Suppression justification reason is mandatory');
    }
    if (!expiresAt || new Date(expiresAt) <= new Date()) {
      throw new Error('Suppression requires a valid future expiration date');
    }

    const suppressionId = `SUPP-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    const suppression = await DetectionSuppression.create({
      suppressionId,
      ruleId,
      pattern,
      reason,
      actor,
      expiresAt: new Date(expiresAt),
      active: true,
      organizationId,
    });

    await auditLogger.log({
      actor,
      action: 'SUPPRESSION_CREATED',
      resource: { type: 'DETECTION_SUPPRESSION', id: suppressionId },
      outcome: 'SUCCESS',
      details: { ruleId, reason, expiresAt },
    });

    return suppression;
  }
}

module.exports = new DetectionRuleEngine();
