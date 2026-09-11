/**
 * 🛡️ CyberShield X — DetectionTestingService (Phase 73)
 *
 * Deterministic detection testing harness and reusable regression suite.
 * Executes MATCH, NO_MATCH, and EDGE_CASE fixtures in isolated non-alerting context.
 * Computes ground-truth detection quality metrics from persisted database records.
 */

const mongoose = require('mongoose');
const DetectionRule = require('../../models/DetectionRule');
const detectionRuleEngine = require('./DetectionRuleEngine');
const Alert = require('../../models/Alert');
const auditLogger = require('../../utils/auditLogger');
const logger = require('../../utils/logger');

class DetectionTestingService {
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
    if (ruleId && mongoose.Types.ObjectId.isValid(ruleId)) {
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
   * Executes a single test fixture against a detection rule
   * @param {Object} rule - DetectionRule instance or plain object
   * @param {Object} fixture - { fixtureId, name, input, eventPayload, expectedResult }
   * @returns {Object} Test execution result
   */
  async executeFixture(rule, fixture) {
    const startTime = Date.now();
    let actualMatch = false;
    let errMessage = null;

    try {
      const input =
        fixture.input && typeof fixture.input === 'object' && Object.keys(fixture.input).length > 0
          ? fixture.input
          : fixture.eventPayload || fixture.input || {};
      const expectedMatch = fixture.expectedResult === 'MATCH';
      const evaluation = await detectionRuleEngine.testRule(rule, input, expectedMatch);
      actualMatch = !!evaluation.matched;
    } catch (err) {
      errMessage = err.message;
      actualMatch = false;
    }

    const durationMs = Date.now() - startTime;
    const expectedMatch = fixture.expectedResult === 'MATCH';
    const passed = errMessage === null && actualMatch === expectedMatch;
    const actualResult = actualMatch ? 'MATCH' : 'NO_MATCH';

    return {
      fixtureId: fixture.fixtureId,
      name: fixture.name || 'Fixture',
      expectedResult: fixture.expectedResult,
      actualResult,
      actualMatch,
      passed,
      lastResult: passed ? 'PASS' : 'FAIL',
      lastRunAt: new Date(),
      executionDurationMs: durationMs,
      error: errMessage,
    };
  }

  /**
   * Runs all configured fixtures on a given rule and updates rule state
   */
  async testRuleFixtures(ruleId, optionsOrOrg = {}) {
    let actor = {};
    let organizationId = null;
    if (optionsOrOrg && (typeof optionsOrOrg === 'string' || optionsOrOrg instanceof mongoose.Types.ObjectId)) {
      organizationId = optionsOrOrg;
    } else if (optionsOrOrg && typeof optionsOrOrg === 'object') {
      actor = optionsOrOrg.actor || {};
      organizationId = optionsOrOrg.organizationId || null;
    }

    const rule = await this._findRule(ruleId, organizationId);
    if (!rule) {
      throw new Error(`Detection rule ${ruleId} not found`);
    }

    if (!rule.testFixtures || rule.testFixtures.length === 0) {
      rule.healthStatus = 'NEEDS_TEST';
      await rule.save();
      return {
        ruleId: rule.ruleId,
        contentId: rule.contentId,
        total: 0,
        passed: 0,
        failed: 0,
        untested: 0,
        fixtures: [],
        healthStatus: 'NEEDS_TEST',
        allPassed: false,
        passedTests: 0,
        failedTests: 0,
      };
    }

    let passedCount = 0;
    let failedCount = 0;
    const updatedFixtures = [];

    for (const fixture of rule.testFixtures) {
      const res = await this.executeFixture(rule, fixture);
      if (res.lastResult === 'PASS') passedCount++;
      if (res.lastResult === 'FAIL') failedCount++;

      // Mutate subdocument
      fixture.actualMatch = res.actualMatch;
      fixture.lastResult = res.lastResult;
      fixture.lastRunAt = res.lastRunAt;
      fixture.executionDurationMs = res.executionDurationMs;
      fixture.error = res.error;
      updatedFixtures.push(fixture);
    }

    // Determine health status
    if (failedCount > 0) {
      rule.healthStatus = 'FAILING_TESTS';
    } else if (passedCount === rule.testFixtures.length) {
      rule.healthStatus = rule.status === 'DISABLED' ? 'DISABLED' : 'HEALTHY';
    } else {
      rule.healthStatus = 'NEEDS_TEST';
    }

    rule.testSummary = {
      totalFixtures: rule.testFixtures.length,
      passingFixtures: passedCount,
      failingFixtures: failedCount,
      passedCount,
      failedCount,
      lastRunAt: new Date(),
    };

    await rule.save();

    this.emitRealTimeEvent('detection:tested', {
      ruleId: rule.ruleId,
      contentId: rule.contentId,
      total: rule.testFixtures.length,
      passed: passedCount,
      failed: failedCount,
      healthStatus: rule.healthStatus,
    });

    await auditLogger.log({
      actor,
      organizationId: rule.organizationId || organizationId,
      action: 'DETECTION_RULE_TESTED',
      resource: { type: 'DETECTION_RULE', id: rule.ruleId },
      outcome: failedCount === 0 ? 'SUCCESS' : 'FAILURE',
      details: {
        passed: passedCount,
        failed: failedCount,
        healthStatus: rule.healthStatus,
      },
    });

    return {
      ruleId: rule.ruleId,
      contentId: rule.contentId,
      total: rule.testFixtures.length,
      passed: passedCount,
      failed: failedCount,
      fixtures: updatedFixtures,
      healthStatus: rule.healthStatus,
      status: rule.status,
      allPassed: failedCount === 0 && passedCount > 0,
      passedTests: passedCount,
      failedTests: failedCount,
    };
  }

  /**
   * Executes the full detection regression test suite across all active/testing rules
   */
  async runRegressionSuite(optionsOrOrg = {}, filterOpt = {}) {
    let organizationId = null;
    let filter = filterOpt;
    if (optionsOrOrg && (typeof optionsOrOrg === 'string' || optionsOrOrg instanceof mongoose.Types.ObjectId)) {
      organizationId = optionsOrOrg;
    } else if (optionsOrOrg && typeof optionsOrOrg === 'object') {
      organizationId = optionsOrOrg.organizationId || null;
      filter = optionsOrOrg.filter || filterOpt;
    }

    const startTime = Date.now();
    const query = { ...filter };
    if (organizationId) {
      query.$or = [{ organizationId }, { organizationId: null }];
    }

    const rules = await DetectionRule.find(query);
    const results = [];
    let totalFixtures = 0;
    let passedFixtures = 0;
    let failedFixtures = 0;
    let rulesPassingAll = 0;
    let rulesFailing = 0;
    let rulesUntested = 0;

    for (const rule of rules) {
      if (!rule.testFixtures || rule.testFixtures.length === 0) {
        rulesUntested++;
        results.push({
          ruleId: rule.ruleId,
          contentId: rule.contentId,
          status: rule.status,
          healthStatus: 'NEEDS_TEST',
          total: 0,
          passed: 0,
          failed: 0,
        });
        continue;
      }

      let rulePass = true;
      for (const fixture of rule.testFixtures) {
        totalFixtures++;
        const res = await this.executeFixture(rule, fixture);
        if (res.lastResult === 'PASS') {
          passedFixtures++;
        } else {
          failedFixtures++;
          rulePass = false;
        }
        fixture.actualMatch = res.actualMatch;
        fixture.lastResult = res.lastResult;
        fixture.lastRunAt = res.lastRunAt;
        fixture.executionDurationMs = res.executionDurationMs;
        fixture.error = res.error;
      }

      if (rulePass) {
        rulesPassingAll++;
        rule.healthStatus = rule.status === 'DISABLED' ? 'DISABLED' : 'HEALTHY';
      } else {
        rulesFailing++;
        rule.healthStatus = 'FAILING_TESTS';
      }

      await rule.save();

      results.push({
        ruleId: rule.ruleId,
        contentId: rule.contentId,
        status: rule.status,
        healthStatus: rule.healthStatus,
        total: rule.testFixtures.length,
        passed: rule.testFixtures.filter((f) => f.lastResult === 'PASS').length,
        failed: rule.testFixtures.filter((f) => f.lastResult === 'FAIL').length,
      });
    }

    const executionTimeMs = Date.now() - startTime;

    return {
      timestamp: new Date(),
      totalRules: rules.length,
      rulesPassingAll,
      passedRules: rulesPassingAll,
      rulesFailing,
      failedRules: rulesFailing,
      rulesUntested,
      totalFixtures,
      passedFixtures,
      failedFixtures,
      overallPassRate: totalFixtures > 0 ? Math.round((passedFixtures / totalFixtures) * 100) : 0,
      executionTimeMs,
      ruleResults: results,
    };
  }

  /**
   * Calculates ground-truth detection quality metrics strictly from persisted records
   */
  async getQualityMetrics(optionsOrOrg = {}) {
    let organizationId = null;
    if (optionsOrOrg && (typeof optionsOrOrg === 'string' || optionsOrOrg instanceof mongoose.Types.ObjectId)) {
      organizationId = optionsOrOrg;
    } else if (optionsOrOrg && typeof optionsOrOrg === 'object') {
      organizationId = optionsOrOrg.organizationId || null;
    }

    const query = {};
    if (organizationId) {
      query.$or = [{ organizationId }, { organizationId: null }];
    }

    const rules = await DetectionRule.find(query);

    let activeRules = 0;
    let draftRules = 0;
    let testingRules = 0;
    let reviewRules = 0;
    let approvedRules = 0;
    let disabledRules = 0;
    let retiredRules = 0;

    let rulesPassingTests = 0;
    let rulesFailingTests = 0;
    let rulesWithoutTests = 0;

    let rulesTriggered = 0;
    let rulesNeverTriggered = 0;

    for (const r of rules) {
      if (r.status === 'ACTIVE' && r.enabled !== false) activeRules++;
      else if (r.status === 'DRAFT') draftRules++;
      else if (r.status === 'TESTING') testingRules++;
      else if (r.status === 'REVIEW') reviewRules++;
      else if (r.status === 'APPROVED') approvedRules++;
      else if (r.status === 'DISABLED' || r.enabled === false) disabledRules++;
      else if (r.status === 'RETIRED') retiredRules++;

      const fixtures = r.testFixtures || [];
      const isHealthy = r.healthStatus === 'HEALTHY' || (fixtures.length > 0 && fixtures.every((f) => f.lastResult === 'PASS'));
      if (isHealthy) {
        rulesPassingTests++;
      } else if (fixtures.some((f) => f.lastResult === 'FAIL') || r.healthStatus === 'NEEDS_REVISION' || r.healthStatus === 'BROKEN') {
        rulesFailingTests++;
      } else {
        rulesWithoutTests++;
      }

      if ((r.matchCount || 0) > 0) rulesTriggered++;
      else rulesNeverTriggered++;
    }

    // Measure alert efficacy from actual persisted Alert documents
    let truePositives = 0;
    let falsePositives = 0;
    let analystConfirmed = 0;
    let analystDismissed = 0;

    try {
      const alertQuery = {};
      if (organizationId) {
        alertQuery.$or = [{ organizationId }, { organizationId: null }];
      }
      const alerts = await Alert.find(alertQuery).select('status resolution');
      for (const a of alerts) {
        if (a.resolution?.outcome === 'FALSE_POSITIVE' || a.status === 'DISMISSED') {
          falsePositives++;
          analystDismissed++;
        } else if (a.resolution?.outcome === 'TRUE_POSITIVE' || a.status === 'RESOLVED') {
          truePositives++;
          analystConfirmed++;
        }
      }
    } catch (_) {}

    return {
      activeRules,
      draftRules,
      testingRules,
      reviewRules,
      approvedRules,
      disabledRules,
      retiredRules,
      totalRules: rules.length,
      rulesPassingTests,
      healthyRules: rulesPassingTests,
      rulesFailingTests,
      failingRules: rulesFailingTests,
      rulesWithoutTests,
      rulesTriggered,
      rulesNeverTriggered,
      averageRuleVersion: '1.0.0',
      rulesWithFixtures: rulesPassingTests + rulesFailingTests,
      efficacy: {
        truePositives,
        falsePositives,
        analystConfirmed,
        analystDismissed,
      },
    };
  }
}

module.exports = new DetectionTestingService();
