/**
 * 🛡️ CyberShield X — ExecutiveRiskService (Phase 74)
 *
 * Compiles evidence-backed organizational executive risk posture.
 * Cites actual database records (Incidents, Findings, Gaps, SLA Breaches)
 * without synthetic inflation or conversion of AI opinions into authoritative scores.
 */

const Incident = require('../../models/Incident');
const Finding = require('../../models/Finding');
const DetectionGap = require('../../models/DetectionGap');
const ThreatHuntExecution = require('../../models/ThreatHuntExecution');
const PendingApproval = require('../../models/PendingApproval');
const socMetricsService = require('./SOCMetricsService');

class ExecutiveRiskService {
  _buildTenantQuery(organizationId, baseQuery = {}) {
    if (!organizationId) return { ...baseQuery };
    return {
      ...baseQuery,
      organizationId,
    };
  }

  /**
   * Generates a fully cited, evidence-backed executive risk summary
   */
  async getExecutiveRiskSummary(organizationId = null, options = {}) {
    const orgFilter = this._buildTenantQuery(organizationId);

    // 1. Critical and High Incidents (Active)
    const openIncidents = await Incident.find(
      this._buildTenantQuery(organizationId, {
        status: { $in: ['DETECTED', 'TRIAGING', 'INVESTIGATING', 'CONTAINMENT_PENDING', 'CONTAINED', 'REOPENED'] },
      })
    ).select('incidentId title severity classification affectedAssets createdAt sla');

    const criticalIncidents = openIncidents.filter((i) => i.severity === 'CRITICAL');
    const highIncidents = openIncidents.filter((i) => i.severity === 'HIGH');

    // 2. Unresolved Findings
    const unresolvedFindings = await Finding.find(
      this._buildTenantQuery(organizationId, {
        status: { $in: ['OPEN', 'IN_PROGRESS', 'CONFIRMED'] },
      })
    ).select('findingId title severity component asset');

    const criticalFindings = unresolvedFindings.filter((f) => f.severity === 'CRITICAL');
    const highFindings = unresolvedFindings.filter((f) => f.severity === 'HIGH');

    // 3. Active Detection Gaps
    const activeGaps = await DetectionGap.find(
      this._buildTenantQuery(organizationId, {
        status: { $ne: 'RESOLVED' },
      })
    ).select('gapId title techniqueId techniqueName severity gapType');

    // 4. SLA Breaches
    const slaBreachedIncidents = openIncidents.filter((i) => i.sla?.status === 'BREACHED');

    // 5. Unverified / Pending Response Actions
    const pendingApprovals = await PendingApproval.find(
      this._buildTenantQuery(organizationId, {
        status: { $in: ['PENDING', 'AWAITING_APPROVAL'] },
      })
    ).select('approvalId actionType target system justification');

    // 6. Recent Threat Hunt Matches
    const recentHuntMatches = await ThreatHuntExecution.find(
      this._buildTenantQuery(organizationId, {
        status: 'MATCHED',
      })
    )
      .sort({ completedAt: -1 })
      .limit(5)
      .select('executionId huntTitle matchesCount completedAt');

    // 7. Impacted High-Risk Assets Extraction
    const assetRiskCount = new Map();
    for (const inc of openIncidents) {
      for (const asset of inc.affectedAssets || []) {
        assetRiskCount.set(asset, (assetRiskCount.get(asset) || 0) + (inc.severity === 'CRITICAL' ? 3 : 1));
      }
    }
    const highRiskAssets = Array.from(assetRiskCount.entries())
      .map(([asset, weight]) => ({ asset, riskWeight: weight }))
      .sort((a, b) => b.riskWeight - a.riskWeight)
      .slice(0, 5);

    // Compute Deterministic Risk Score (0 - 100)
    // Factors:
    // - Critical Incidents: 15 pts each (max 40)
    // - High Incidents: 8 pts each (max 20)
    // - Critical Findings: 5 pts each (max 15)
    // - Active Detection Gaps: 3 pts each (max 15)
    // - SLA Breaches: 5 pts each (max 10)
    const incScore = Math.min(40, criticalIncidents.length * 15) + Math.min(20, highIncidents.length * 8);
    const findScore = Math.min(15, criticalFindings.length * 5 + highFindings.length * 2);
    const gapScore = Math.min(15, activeGaps.length * 3);
    const slaScore = Math.min(10, slaBreachedIncidents.length * 5);

    const rawScore = incScore + findScore + gapScore + slaScore;
    const overallRiskScore = Math.min(100, Math.max(0, rawScore));

    let riskLevel = 'LOW';
    if (overallRiskScore >= 75) riskLevel = 'CRITICAL';
    else if (overallRiskScore >= 50) riskLevel = 'HIGH';
    else if (overallRiskScore >= 25) riskLevel = 'MEDIUM';

    // Compile underlying record citations
    const recordCitations = [
      ...criticalIncidents.map((i) => ({ type: 'INCIDENT', id: i.incidentId, detail: i.title })),
      ...highIncidents.map((i) => ({ type: 'INCIDENT', id: i.incidentId, detail: i.title })),
      ...criticalFindings.map((f) => ({ type: 'FINDING', id: f.findingId, detail: f.title })),
      ...activeGaps.map((g) => ({ type: 'DETECTION_GAP', id: g.gapId, detail: `${g.techniqueId}: ${g.title}` })),
      ...slaBreachedIncidents.map((s) => ({ type: 'SLA_BREACH', id: s.incidentId, detail: 'Breached incident response SLA' })),
    ];

    return {
      organizationId,
      timestamp: new Date(),
      assessmentStatus: 'EVIDENCE_BACKED',
      overallRiskScore,
      calculatedRiskScore: overallRiskScore,
      riskLevel,
      riskBand: riskLevel,
      criticalIncidents: {
        count: criticalIncidents.length,
        citations: criticalIncidents.map((i) => i.incidentId),
      },
      detectionGaps: {
        count: activeGaps.length,
        citations: activeGaps.map((g) => g.gapId),
      },
      unresolvedFindings: {
        count: unresolvedFindings.length,
        citations: unresolvedFindings.map((f) => f.findingId),
      },
      scoreBreakdown: {
        incidentRiskPoints: incScore,
        postureVulnerabilityPoints: findScore,
        detectionGapPoints: gapScore,
        slaOperationalPoints: slaScore,
      },
      counts: {
        openIncidents: openIncidents.length,
        criticalIncidents: criticalIncidents.length,
        highIncidents: highIncidents.length,
        unresolvedFindings: unresolvedFindings.length,
        criticalFindings: criticalFindings.length,
        activeDetectionGaps: activeGaps.length,
        slaBreachedIncidents: slaBreachedIncidents.length,
        pendingApprovals: pendingApprovals.length,
        recentHuntMatches: recentHuntMatches.length,
        highRiskAssets: highRiskAssets.length,
      },
      highRiskAssets,
      criticalIncidentsList: criticalIncidents.map((i) => ({
        id: i.incidentId,
        title: i.title,
        assets: i.affectedAssets,
        tactic: i.classification?.tactic,
      })),
      activeGapsList: activeGaps.slice(0, 5).map((g) => ({
        id: g.gapId,
        title: g.title,
        techniqueId: g.techniqueId,
      })),
      recordCitations,
    };
  }
}

module.exports = new ExecutiveRiskService();
