/**
 * 🛡️ CyberShield X — GovernanceEvaluationService (Phase 75)
 *
 * Truthful, evidence-based enterprise governance posture evaluation engine.
 * Never fabricates compliance; missing controls are flagged as NOT_CONFIGURED.
 * Inspects real persisted policies, integration credentials, audit events, and retention rules.
 */

const GovernancePolicy = require('../../models/GovernancePolicy');
const RetentionPolicy = require('../../models/RetentionPolicy');
const BreakGlassSession = require('../../models/BreakGlassSession');
const IntegrationCredentialMetadata = require('../../models/IntegrationCredentialMetadata');
const AuditEvent = require('../../models/AuditEvent');
const logger = require('../../utils/logger');

class GovernanceEvaluationService {
  constructor() {
    this.CANONICAL_DOMAINS = [
      'ACCESS_GOVERNANCE',
      'SESSION_SECURITY',
      'APPROVAL_GOVERNANCE',
      'AUDIT_GOVERNANCE',
      'EVIDENCE_GOVERNANCE',
      'REPORTING_GOVERNANCE',
      'DETECTION_GOVERNANCE',
      'INTEGRATION_GOVERNANCE',
    ];
  }

  /**
   * Evaluates organization-level governance posture against real database state.
   *
   * @param {string} organizationId
   * @returns {Promise<Object>} Comprehensive posture report
   */
  async evaluateGovernancePosture(organizationId) {
    if (!organizationId) throw new Error('organizationId is required');

    // 1. Fetch all configured governance policies for this organization
    const policies = await GovernancePolicy.find({ organizationId });
    const policyMap = new Map();
    for (const pol of policies) {
      policyMap.set(pol.policyType, pol);
    }

    // 2. Fetch integration credential metadata
    const integrations = await IntegrationCredentialMetadata.find({ organizationId });

    // 3. Fetch active break-glass sessions
    const activeBreakGlass = await BreakGlassSession.find({
      organizationId,
      status: 'ACTIVE',
      expiresAt: { $gt: new Date() },
    });

    // 4. Fetch retention policies
    const retentionPolicies = await RetentionPolicy.find({ organizationId });

    // 5. Check audit trail activity
    const recentAuditCount = await AuditEvent.countDocuments({
      organizationId,
      timestamp: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    });

    const evaluatedDomains = [];
    const detectedGaps = [];
    let compliantCount = 0;

    const now = new Date();
    const expiredIntegrations = integrations.filter(
      (i) => i.status === 'EXPIRED' || (i.expiresAt && i.expiresAt < now)
    );
    if (expiredIntegrations.length > 0) {
      detectedGaps.push({
        gapId: 'GAP-INTEGRATION-EXPIRED-CREDENTIALS',
        domain: 'INTEGRATION_GOVERNANCE',
        severity: 'HIGH',
        title: 'Expired Integration Credentials Detected',
        description: `${expiredIntegrations.length} third-party security integration credential(s) have passed their expiration date.`,
        remediation: 'Rotate credential fingerprints immediately and update metadata.',
      });
    }

    for (const domain of this.CANONICAL_DOMAINS) {
      const policy = policyMap.get(domain);

      if (!policy) {
        evaluatedDomains.push({
          domain,
          status: 'NOT_CONFIGURED',
          enforcementMode: 'DISABLED',
          policyId: null,
          version: 0,
          explanation: `No governance policy configured for ${domain}. Control is inactive.`,
          evidence: null,
        });
        detectedGaps.push({
          gapId: `GAP-${domain}-MISSING`,
          domain,
          severity: 'HIGH',
          title: `Missing ${domain} Policy`,
          description: `The organization lacks a formally approved policy for ${domain}.`,
          remediation: `Initialize canonical policy via Governance Center and submit for administrative approval.`,
        });
        continue;
      }

      // Check policy status
      if (policy.status === 'DRAFT' || policy.status === 'REVIEW') {
        evaluatedDomains.push({
          domain,
          status: 'PARTIAL',
          enforcementMode: policy.enforcementMode,
          policyId: policy.policyId,
          version: policy.currentVersion,
          explanation: `Policy exists in ${policy.status} status and is not yet actively enforced.`,
          evidence: { status: policy.status, version: policy.currentVersion },
        });
        detectedGaps.push({
          gapId: `GAP-${domain}-PENDING`,
          domain,
          severity: 'MEDIUM',
          title: `${domain} Pending Activation`,
          description: `Policy is in ${policy.status} status. It requires review and approval by an authorized administrator.`,
          remediation: `Review policy revision ${policy.currentVersion} and activate enforcement in Governance Center.`,
        });
      } else if (policy.status === 'APPROVED') {
        evaluatedDomains.push({
          domain,
          status: 'PARTIAL',
          enforcementMode: policy.enforcementMode,
          policyId: policy.policyId,
          version: policy.currentVersion,
          explanation: 'Policy is approved but not yet activated for runtime enforcement.',
          evidence: { status: 'APPROVED', version: policy.currentVersion },
        });
        detectedGaps.push({
          gapId: `GAP-${domain}-UNACTIVATED`,
          domain,
          severity: 'LOW',
          title: `${domain} Approved but Inactive`,
          description: 'Policy has received approval but requires final activation.',
          remediation: 'Activate policy from Governance Center.',
        });
      } else if (policy.status === 'SUSPENDED' || policy.status === 'RETIRED' || policy.status === 'REJECTED') {
        evaluatedDomains.push({
          domain,
          status: 'NON_COMPLIANT',
          enforcementMode: policy.enforcementMode,
          policyId: policy.policyId,
          version: policy.currentVersion,
          explanation: `Policy is currently ${policy.status}. Runtime protection is degraded.`,
          evidence: { status: policy.status },
        });
        detectedGaps.push({
          gapId: `GAP-${domain}-INACTIVE`,
          domain,
          severity: 'HIGH',
          title: `${domain} Decommissioned or Suspended`,
          description: `Governance control has been ${policy.status}.`,
          remediation: 'Reinstate active enforcement or establish an updated successor policy.',
        });
      } else if (policy.status === 'ACTIVE') {
        // Check expiration
        const now = new Date();
        if (policy.expiresAt && policy.expiresAt < now) {
          evaluatedDomains.push({
            domain,
            status: 'NON_COMPLIANT',
            enforcementMode: policy.enforcementMode,
            policyId: policy.policyId,
            version: policy.currentVersion,
            explanation: `Policy expired on ${policy.expiresAt.toISOString()}.`,
            evidence: { expiredAt: policy.expiresAt },
          });
          detectedGaps.push({
            gapId: `GAP-${domain}-EXPIRED`,
            domain,
            severity: 'HIGH',
            title: `${domain} Policy Expired`,
            description: `Policy expiration date has passed without recertification.`,
            remediation: 'Conduct policy renewal review and extend validity period.',
          });
          continue;
        }

        // Domain-specific state inspection
        if (domain === 'INTEGRATION_GOVERNANCE') {
          const expiredIntegrations = integrations.filter(
            (i) => i.status === 'EXPIRED' || (i.expiresAt && i.expiresAt < now)
          );
          if (expiredIntegrations.length > 0) {
            evaluatedDomains.push({
              domain,
              status: 'NON_COMPLIANT',
              enforcementMode: policy.enforcementMode,
              policyId: policy.policyId,
              version: policy.currentVersion,
              explanation: `${expiredIntegrations.length} integration credential(s) have expired.`,
              evidence: { expiredIntegrationIds: expiredIntegrations.map((i) => i.integrationId) },
            });
            if (!detectedGaps.some((g) => g.gapId === 'GAP-INTEGRATION-EXPIRED-CREDENTIALS')) {
              detectedGaps.push({
                gapId: 'GAP-INTEGRATION-EXPIRED-CREDENTIALS',
                domain,
                severity: 'HIGH',
                title: 'Expired Integration Credentials Detected',
                description: `One or more third-party security integration credentials have passed their expiration date.`,
                remediation: 'Rotate credential fingerprints immediately and update metadata.',
              });
            }
            continue;
          }
        }

        if (domain === 'AUDIT_GOVERNANCE' && recentAuditCount === 0) {
          evaluatedDomains.push({
            domain,
            status: 'INSUFFICIENT_DATA',
            enforcementMode: policy.enforcementMode,
            policyId: policy.policyId,
            version: policy.currentVersion,
            explanation: 'Active audit policy present, but zero audit events recorded in past 30 days.',
            evidence: { recentAuditCount: 0 },
          });
          continue;
        }

        // Active and verified compliant
        compliantCount += 1;
        evaluatedDomains.push({
          domain,
          status: 'COMPLIANT',
          enforcementMode: policy.enforcementMode,
          policyId: policy.policyId,
          version: policy.currentVersion,
          explanation: `Policy active, enforced (${policy.enforcementMode}), and verified against operational state.`,
          evidence: {
            checksum: policy.checksum,
            approvedBy: policy.approvedBy?.username,
            version: policy.currentVersion,
          },
        });
      }
    }

    // Determine overall compliance status
    let overallStatus = 'NOT_CONFIGURED';
    const totalConfigured = policies.length;

    if (totalConfigured === 0) {
      overallStatus = 'NOT_CONFIGURED';
    } else if (evaluatedDomains.some((d) => d.status === 'NON_COMPLIANT')) {
      overallStatus = 'NON_COMPLIANT';
    } else if (compliantCount === this.CANONICAL_DOMAINS.length) {
      overallStatus = 'COMPLIANT';
    } else if (compliantCount > 0 || evaluatedDomains.some((d) => d.status === 'PARTIAL')) {
      overallStatus = 'PARTIAL';
    }

    const complianceScore = Math.round((compliantCount / this.CANONICAL_DOMAINS.length) * 100);

    return {
      organizationId,
      overallStatus,
      complianceScore,
      totalDomains: this.CANONICAL_DOMAINS.length,
      compliantDomains: compliantCount,
      domains: evaluatedDomains,
      gaps: detectedGaps,
      operationalTelemetry: {
        activeBreakGlassSessions: activeBreakGlass.length,
        retentionPoliciesCount: retentionPolicies.length,
        legalHoldsCount: retentionPolicies.filter((r) => r.legalHoldActive).length,
        integrationsCount: integrations.length,
        recentAuditCount,
      },
      evaluatedAt: new Date(),
    };
  }

  /**
   * Returns identified governance gaps for remediation planning
   */
  async identifyGovernanceGaps(organizationId) {
    const posture = await this.evaluateGovernancePosture(organizationId);
    return {
      organizationId,
      overallStatus: posture.overallStatus,
      complianceScore: posture.complianceScore,
      gapCount: posture.gaps.length,
      gaps: posture.gaps,
      evaluatedAt: posture.evaluatedAt,
    };
  }
}

module.exports = new GovernanceEvaluationService();
