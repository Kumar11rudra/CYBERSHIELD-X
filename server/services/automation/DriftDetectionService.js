const SecurityDrift = require('../../models/SecurityDrift');
const GovernancePolicy = require('../../models/GovernancePolicy');
const GovernancePolicyRevision = require('../../models/GovernancePolicyRevision');
const IntegrationCredentialMetadata = require('../../models/IntegrationCredentialMetadata');
const SLODefinition = require('../../models/SLODefinition');

class DriftDetectionService {
  /**
   * Run complete drift detection across all supported domains
   */
  static async detectAllDrift(organizationId = null) {
    const govDrifts = await this.detectGovernanceDrift(organizationId);
    const intDrifts = await this.detectIntegrationDrift(organizationId);
    const relDrifts = await this.detectReliabilityDrift(organizationId);

    const allDrifts = [...govDrifts, ...intDrifts, ...relDrifts];
    return {
      detectedAt: new Date(),
      totalDriftsDetected: allDrifts.length,
      drifts: allDrifts
    };
  }

  /**
   * Governance Policy Drift Detection
   * Compares active policy snapshot against latest approved revision content hash
   */
  static async detectGovernanceDrift(organizationId = null) {
    const query = organizationId ? { organizationId } : {};
    const policies = await GovernancePolicy.find(query).lean();
    const detectedDrifts = [];

    for (const policy of policies) {
      if (policy.status === 'ACTIVE') {
        const latestRev = await GovernancePolicyRevision.findOne({ policyId: policy.policyId })
          .sort({ version: -1 })
          .lean();

        if (latestRev && policy.approvedRevisionHash && latestRev.contentHash !== policy.approvedRevisionHash) {
          const driftId = `DRIFT-GOV-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
          
          const drift = await SecurityDrift.create({
            driftId,
            organizationId: policy.organizationId || organizationId,
            driftType: 'GOVERNANCE_POLICY_DRIFT',
            sourceRecord: `GovernancePolicy:${policy.policyId}`,
            baselineReference: `GovernancePolicyRevision:v${latestRev.version}:${latestRev.contentHash}`,
            observedState: {
              status: policy.status,
              approvedRevisionHash: policy.approvedRevisionHash,
              currentChecksum: policy.checksum
            },
            expectedState: {
              approvedRevisionHash: latestRev.contentHash,
              version: latestRev.version
            },
            severity: 'HIGH',
            status: 'OPEN',
            detectedAt: new Date(),
            evidenceReferences: [
              `GOV_REVISION_HASH_MISMATCH_${policy.policyId}`,
              `OBSERVED_${policy.approvedRevisionHash || 'NULL'}_EXPECTED_${latestRev.contentHash}`
            ]
          });
          detectedDrifts.push(drift);
        }
      }
    }

    return detectedDrifts;
  }

  /**
   * Integration Metadata Drift Detection (Expired credentials)
   */
  static async detectIntegrationDrift(organizationId = null) {
    const query = organizationId ? { organizationId } : {};
    const integrations = await IntegrationCredentialMetadata.find(query).lean();
    const detectedDrifts = [];
    const now = new Date();

    for (const integration of integrations) {
      if (integration.expiresAt && new Date(integration.expiresAt) < now && integration.status !== 'EXPIRED') {
        const driftId = `DRIFT-INT-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

        const drift = await SecurityDrift.create({
          driftId,
          organizationId: integration.organizationId || organizationId,
          driftType: 'INTEGRATION_METADATA_DRIFT',
          sourceRecord: `IntegrationMetadata:${integration.integrationId}`,
          baselineReference: `Policy:ValidCredentialsBeforeExpiry`,
          observedState: {
            status: integration.status,
            expiresAt: integration.expiresAt
          },
          expectedState: {
            status: 'VALID',
            expiresAt: '> current_timestamp'
          },
          severity: 'MEDIUM',
          status: 'OPEN',
          detectedAt: new Date(),
          evidenceReferences: [
            `INTEGRATION_EXPIRED_${integration.integrationId}`,
            `EXPIRED_AT_${integration.expiresAt}`
          ]
        });
        detectedDrifts.push(drift);
      }
    }

    return detectedDrifts;
  }

  /**
   * Reliability Threshold Drift Detection
   */
  static async detectReliabilityDrift(organizationId = null) {
    const query = organizationId ? { organizationId } : {};
    const slos = await SLODefinition.find(query).lean();
    const detectedDrifts = [];

    for (const slo of slos) {
      if (slo.targetPercentage < 90.0) {
        const driftId = `DRIFT-REL-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

        const drift = await SecurityDrift.create({
          driftId,
          organizationId: slo.organizationId || organizationId,
          driftType: 'RELIABILITY_THRESHOLD_DRIFT',
          sourceRecord: `SLODefinition:${slo.sloId}`,
          baselineReference: `Baseline:Minimum90PercentTarget`,
          observedState: {
            targetPercentage: slo.targetPercentage
          },
          expectedState: {
            minTargetPercentage: 90.0
          },
          severity: 'LOW',
          status: 'OPEN',
          detectedAt: new Date(),
          evidenceReferences: [
            `SLO_TARGET_BELOW_BASELINE_${slo.sloId}`,
            `OBSERVED_TARGET_${slo.targetPercentage}%`
          ]
        });
        detectedDrifts.push(drift);
      }
    }

    return detectedDrifts;
  }

  /**
   * List active security drifts
   */
  static async getActiveDrifts(organizationId = null, filter = {}) {
    const query = organizationId ? { organizationId, ...filter } : { ...filter };
    return await SecurityDrift.find(query).sort({ detectedAt: -1 }).lean();
  }

  /**
   * Acknowledge drift
   */
  static async acknowledgeDrift(driftId, organizationId = null) {
    const query = { driftId };
    if (organizationId) query.organizationId = organizationId;

    const drift = await SecurityDrift.findOne(query);
    if (!drift) {
      throw new Error(`Security drift record ${driftId} not found`);
    }

    drift.status = 'ACKNOWLEDGED';
    await drift.save();
    return drift;
  }

  /**
   * Accept risk on drift
   */
  static async acceptRiskOnDrift(driftId, justification, organizationId = null) {
    const query = { driftId };
    if (organizationId) query.organizationId = organizationId;

    const drift = await SecurityDrift.findOne(query);
    if (!drift) {
      throw new Error(`Security drift record ${driftId} not found`);
    }

    drift.status = 'ACCEPTED_RISK';
    drift.resolutionReference = `ACCEPTED_RISK: ${justification}`;
    await drift.save();
    return drift;
  }
}

module.exports = DriftDetectionService;
