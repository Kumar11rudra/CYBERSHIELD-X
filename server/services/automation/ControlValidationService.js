const crypto = require('crypto');
const ControlValidation = require('../../models/ControlValidation');
const GovernancePolicy = require('../../models/GovernancePolicy');
const DetectionRuleRevision = require('../../models/DetectionRuleRevision');
const SLODefinition = require('../../models/SLODefinition');
const IntegrationCredentialMetadata = require('../../models/IntegrationCredentialMetadata');

class ControlValidationService {
  /**
   * Helper to compute SHA-256 checksum
   */
  static computeChecksum(data) {
    return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
  }

  /**
   * Evaluate Governance Controls
   */
  static async evaluateGovernanceControls(organizationId = null) {
    const query = organizationId ? { organizationId } : {};
    const policies = await GovernancePolicy.find(query).lean();

    if (!policies || policies.length === 0) {
      const validationId = `VAL-GOV-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
      const checksum = this.computeChecksum({ status: 'NOT_CONFIGURED', count: 0 });
      return await ControlValidation.create({
        validationId,
        organizationId,
        controlType: 'GOVERNANCE',
        source: 'GovernancePolicy',
        target: 'ActiveGovernancePolicies',
        expectedState: { minimumActivePolicies: 1 },
        observedState: { activePolicies: 0, totalPolicies: 0 },
        status: 'NOT_CONFIGURED',
        evidenceReferences: ['NO_GOVERNANCE_POLICIES_CONFIGURED'],
        checksum
      });
    }

    const activePolicies = policies.filter(p => p.status === 'ACTIVE');
    const status = activePolicies.length > 0 ? 'PASS' : 'FAIL';
    const validationId = `VAL-GOV-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const observedState = { activePolicies: activePolicies.length, totalPolicies: policies.length };
    const checksum = this.computeChecksum({ status, observedState });

    return await ControlValidation.create({
      validationId,
      organizationId,
      controlType: 'GOVERNANCE',
      source: 'GovernancePolicy',
      target: 'ActiveGovernancePolicies',
      expectedState: { minimumActivePolicies: 1 },
      observedState,
      status,
      evidenceReferences: [`GOV_POLICIES_ACTIVE_${activePolicies.length}_TOTAL_${policies.length}`],
      checksum
    });
  }

  /**
   * Evaluate Detection Controls
   */
  static async evaluateDetectionControls(organizationId = null) {
    const query = organizationId ? { organizationId } : {};
    const rules = await DetectionRuleRevision.find(query).lean();

    if (!rules || rules.length === 0) {
      const validationId = `VAL-DET-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
      const checksum = this.computeChecksum({ status: 'NOT_CONFIGURED', count: 0 });
      return await ControlValidation.create({
        validationId,
        organizationId,
        controlType: 'DETECTION',
        source: 'DetectionRuleRevision',
        target: 'ActiveDetectionRules',
        expectedState: { minimumDetectionRules: 1 },
        observedState: { totalRuleRevisions: 0 },
        status: 'NOT_CONFIGURED',
        evidenceReferences: ['NO_DETECTION_RULES_CONFIGURED'],
        checksum
      });
    }

    const validationId = `VAL-DET-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const observedState = { totalRuleRevisions: rules.length };
    const checksum = this.computeChecksum({ status: 'PASS', observedState });

    return await ControlValidation.create({
      validationId,
      organizationId,
      controlType: 'DETECTION',
      source: 'DetectionRuleRevision',
      target: 'ActiveDetectionRules',
      expectedState: { minimumDetectionRules: 1 },
      observedState,
      status: 'PASS',
      evidenceReferences: [`DETECTION_RULE_REVISIONS_${rules.length}`],
      checksum
    });
  }

  /**
   * Evaluate Reliability Controls
   */
  static async evaluateReliabilityControls(organizationId = null) {
    const query = organizationId ? { organizationId } : {};
    const slos = await SLODefinition.find(query).lean();

    if (!slos || slos.length === 0) {
      const validationId = `VAL-REL-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
      const checksum = this.computeChecksum({ status: 'NOT_CONFIGURED' });
      return await ControlValidation.create({
        validationId,
        organizationId,
        controlType: 'RELIABILITY',
        source: 'SLODefinition',
        target: 'PlatformSLOObjectives',
        expectedState: { minimumSLOsSeeded: 1 },
        observedState: { totalSLOs: 0 },
        status: 'NOT_CONFIGURED',
        evidenceReferences: ['NO_SLO_DEFINITIONS_CONFIGURED'],
        checksum
      });
    }

    const validationId = `VAL-REL-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const observedState = { totalSLOs: slos.length };
    const checksum = this.computeChecksum({ status: 'PASS', observedState });

    return await ControlValidation.create({
      validationId,
      organizationId,
      controlType: 'RELIABILITY',
      source: 'SLODefinition',
      target: 'PlatformSLOObjectives',
      expectedState: { minimumSLOsSeeded: 1 },
      observedState,
      status: 'PASS',
      evidenceReferences: [`SLO_OBJECTIVES_ACTIVE_${slos.length}`],
      checksum
    });
  }

  /**
   * Evaluate Integration Controls
   */
  static async evaluateIntegrationControls(organizationId = null) {
    const query = organizationId ? { organizationId } : {};
    const integrations = await IntegrationCredentialMetadata.find(query).lean();

    if (!integrations || integrations.length === 0) {
      const validationId = `VAL-INT-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
      const checksum = this.computeChecksum({ status: 'NOT_CONFIGURED' });
      return await ControlValidation.create({
        validationId,
        organizationId,
        controlType: 'INTEGRATION',
        source: 'IntegrationMetadata',
        target: 'ActiveIntegrations',
        expectedState: { activeIntegrations: 0, maxExpired: 0 },
        observedState: { totalIntegrations: 0, expiredIntegrations: 0 },
        status: 'NOT_CONFIGURED',
        evidenceReferences: ['NO_INTEGRATIONS_CONFIGURED'],
        checksum
      });
    }

    const now = new Date();
    const expired = integrations.filter(i => i.expiresAt && new Date(i.expiresAt) < now);
    const status = expired.length === 0 ? 'PASS' : 'FAIL';
    const validationId = `VAL-INT-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const observedState = { totalIntegrations: integrations.length, expiredIntegrations: expired.length };
    const checksum = this.computeChecksum({ status, observedState });

    return await ControlValidation.create({
      validationId,
      organizationId,
      controlType: 'INTEGRATION',
      source: 'IntegrationMetadata',
      target: 'ActiveIntegrations',
      expectedState: { maxExpired: 0 },
      observedState,
      status,
      evidenceReferences: [`INTEGRATIONS_TOTAL_${integrations.length}_EXPIRED_${expired.length}`],
      checksum
    });
  }

  /**
   * Comprehensive validation run across all domains
   */
  static async validateAllControls(organizationId = null) {
    const gov = await this.evaluateGovernanceControls(organizationId);
    const det = await this.evaluateDetectionControls(organizationId);
    const rel = await this.evaluateReliabilityControls(organizationId);
    const int = await this.evaluateIntegrationControls(organizationId);

    return {
      evaluatedAt: new Date(),
      validations: [gov, det, rel, int],
      summary: {
        total: 4,
        pass: [gov, det, rel, int].filter(v => v.status === 'PASS').length,
        fail: [gov, det, rel, int].filter(v => v.status === 'FAIL').length,
        notConfigured: [gov, det, rel, int].filter(v => v.status === 'NOT_CONFIGURED').length
      }
    };
  }

  /**
   * Get current posture summary
   */
  static async getPostureSummary(organizationId = null) {
    const query = organizationId ? { organizationId } : {};
    const validations = await ControlValidation.find(query).sort({ evaluatedAt: -1 }).limit(50).lean();

    const passCount = validations.filter(v => v.status === 'PASS').length;
    const failCount = validations.filter(v => v.status === 'FAIL').length;
    const unknownCount = validations.filter(v => v.status === 'UNKNOWN' || v.status === 'NOT_CONFIGURED').length;

    return {
      totalEvaluated: validations.length,
      pass: passCount,
      fail: failCount,
      unknown: unknownCount,
      latestValidations: validations.slice(0, 10)
    };
  }
}

module.exports = ControlValidationService;
