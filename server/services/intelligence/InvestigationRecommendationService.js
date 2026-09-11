const AnalystRecommendation = require('../../models/AnalystRecommendation');

class InvestigationRecommendationService {
  constructor(dependencies = {}) {
    this.dependencies = dependencies;
  }

  _getModel(name) {
    if (this.dependencies[name]) return this.dependencies[name];
    try {
      return require(`../../models/${name}`);
    } catch {
      return null;
    }
  }

  async generateRecommendations(organizationId, subjectType, subjectId) {
    const scope = organizationId ? { organizationId } : {};
    const recommendations = [];

    // 1. Observational: Graph Neighborhood Inspection via Phase 78 Data Fabric
    recommendations.push({
      recommendationId: `REC-${Date.now()}-1`,
      organizationId,
      subjectType,
      subjectId,
      recommendationType: 'INVESTIGATION_STEP',
      priority: 'HIGH',
      title: `Expand Security Graph Neighborhood for ${subjectType} ${subjectId}`,
      rationale: `Explore direct 2-hop graph neighborhood in the Security Data Fabric to uncover correlated assets, identities, and threat indicators.`,
      evidenceReferences: [`${subjectType}:${subjectId}`],
      prerequisites: ['DATA_FABRIC_READ_ACCESS'],
      authorization: 'EXECUTABLE',
      actionCategory: 'OBSERVATIONAL',
      status: 'PROPOSED'
    });

    // 2. Observational: Review Detection Coverage & ATT&CK Mapping
    recommendations.push({
      recommendationId: `REC-${Date.now()}-2`,
      organizationId,
      subjectType,
      subjectId,
      recommendationType: 'DETECTION_TUNING',
      priority: 'MEDIUM',
      title: `Audit ATT&CK Detection Coverage for Target Subgraph`,
      rationale: `Cross-reference observed technique identifiers against the canonical Detection Engineering matrix to verify active rule health.`,
      evidenceReferences: [`${subjectType}:${subjectId}`],
      prerequisites: ['DETECTION_CATALOG_READ'],
      authorization: 'EXECUTABLE',
      actionCategory: 'OBSERVATIONAL',
      status: 'PROPOSED'
    });

    // 3. Mutating / Approval Required: Automated Playbook Containment
    recommendations.push({
      recommendationId: `REC-${Date.now()}-3`,
      organizationId,
      subjectType,
      subjectId,
      recommendationType: 'CONTAINMENT',
      priority: 'HIGH',
      title: `Dispatch Approval-Aware Containment Playbook`,
      rationale: `Isolate affected host or revoke active session tokens via certified Phase 77 automation orchestration.`,
      evidenceReferences: [`${subjectType}:${subjectId}`],
      prerequisites: ['PLAYBOOK_ACTIVE_REVISION', 'OPERATOR_APPROVAL'],
      authorization: 'APPROVAL_REQUIRED',
      actionCategory: 'MUTATING',
      automationPlaybookId: 'PLAYBOOK-CONTAIN-001',
      status: 'PROPOSED'
    });

    // 4. Observational: Run Existing Approved Threat Hunt
    recommendations.push({
      recommendationId: `REC-${Date.now()}-4`,
      organizationId,
      subjectType,
      subjectId,
      recommendationType: 'THREAT_HUNT',
      priority: 'MEDIUM',
      title: `Execute Approved Threat Hunt Sweep`,
      rationale: `Run canonical threat hunt template AST against the 30-day telemetry window to check for related persistence or lateral movement.`,
      evidenceReferences: [`${subjectType}:${subjectId}`],
      prerequisites: ['THREAT_HUNT_TEMPLATE_APPROVED'],
      authorization: 'APPROVAL_REQUIRED',
      actionCategory: 'OBSERVATIONAL',
      status: 'PROPOSED'
    });

    // 5. Explicitly Unsupported Capability: e.g. Arbitrary External Binary Injection
    recommendations.push({
      recommendationId: `REC-${Date.now()}-5`,
      organizationId,
      subjectType,
      subjectId,
      recommendationType: 'REMEDIATION_ACTION',
      priority: 'LOW',
      title: `Direct Host Kernel Patch Injection`,
      rationale: `Requested out-of-band kernel modification is unsupported by certified platform boundaries.`,
      evidenceReferences: [`${subjectType}:${subjectId}`],
      prerequisites: ['UNSUPPORTED_HOST_PRIVILEGE'],
      authorization: 'NOT_SUPPORTED',
      actionCategory: 'MUTATING',
      status: 'PROPOSED'
    });

    // Optionally persist generated recommendations
    try {
      await AnalystRecommendation.insertMany(recommendations);
    } catch {
      // persistence fallback
    }

    return recommendations;
  }

  async acceptRecommendation(organizationId, recommendationId, analystId, notes = null) {
    const query = { recommendationId };
    if (organizationId) query.organizationId = organizationId;

    const update = {
      status: 'ACCEPTED',
      resolvedAt: new Date(),
      resolvedBy: analystId || 'ANALYST',
      feedbackNotes: notes
    };

    const rec = await AnalystRecommendation.findOneAndUpdate(query, update, { new: true }).lean();
    if (!rec) {
      throw new Error(`Recommendation ${recommendationId} not found in tenant scope`);
    }
    return rec;
  }

  async rejectRecommendation(organizationId, recommendationId, analystId, notes = null) {
    const query = { recommendationId };
    if (organizationId) query.organizationId = organizationId;

    const update = {
      status: 'REJECTED',
      resolvedAt: new Date(),
      resolvedBy: analystId || 'ANALYST',
      feedbackNotes: notes
    };

    const rec = await AnalystRecommendation.findOneAndUpdate(query, update, { new: true }).lean();
    if (!rec) {
      throw new Error(`Recommendation ${recommendationId} not found in tenant scope`);
    }
    return rec;
  }

  async getRecommendations(organizationId, query = {}) {
    const filter = { ...query };
    if (organizationId) filter.organizationId = organizationId;

    try {
      return await AnalystRecommendation.find(filter).sort({ createdAt: -1 }).limit(50).lean();
    } catch {
      return [];
    }
  }
}

module.exports = InvestigationRecommendationService;
