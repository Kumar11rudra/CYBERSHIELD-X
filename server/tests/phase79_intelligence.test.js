const mongoose = require('mongoose');
const RiskSynthesisService = require('../services/intelligence/RiskSynthesisService');
const AnalystPriorityService = require('../services/intelligence/AnalystPriorityService');
const InvestigationRecommendationService = require('../services/intelligence/InvestigationRecommendationService');
const CampaignClusteringService = require('../services/intelligence/CampaignClusteringService');
const DecisionExplanationService = require('../services/intelligence/DecisionExplanationService');

const RiskAssessment = require('../models/RiskAssessment');
const RiskSnapshot = require('../models/RiskSnapshot');
const AnalystRecommendation = require('../models/AnalystRecommendation');
const InvestigationHypothesis = require('../models/InvestigationHypothesis');
const DecisionAssessment = require('../models/DecisionAssessment');
const SecurityGraphNode = require('../models/SecurityGraphNode');
const SecurityGraphEdge = require('../models/SecurityGraphEdge');
const Incident = require('../models/Incident');

describe('Phase 79 Enterprise SOC Decision Intelligence Unit Suite', () => {
  const tenantA = 'org_alpha_79_unit';
  const tenantB = 'org_beta_79_unit';

  let riskService;
  let priorityService;
  let recommendationService;
  let clusteringService;
  let explanationService;

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cybershield_x_test');
    }
    riskService = new RiskSynthesisService();
    priorityService = new AnalystPriorityService();
    recommendationService = new InvestigationRecommendationService();
    clusteringService = new CampaignClusteringService();
    explanationService = new DecisionExplanationService();
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await RiskAssessment.deleteMany({});
    await RiskSnapshot.deleteMany({});
    await AnalystRecommendation.deleteMany({});
    await InvestigationHypothesis.deleteMany({});
    await DecisionAssessment.deleteMany({});
    await SecurityGraphNode.deleteMany({});
    await SecurityGraphEdge.deleteMany({});
    await Incident.deleteMany({});
  });

  test('1. Empty State Truthfulness: Insufficient evidence returns UNKNOWN and null score', async () => {
    const assessment = await riskService.calculateSubjectRisk(tenantA, 'ASSET', 'ASSET-EMPTY-001');

    expect(assessment.riskScore).toBeNull();
    expect(assessment.riskBand).toBe('UNKNOWN');
    expect(assessment.determination).toBe('INSUFFICIENT_EVIDENCE');
    expect(assessment.factors).toHaveLength(0);
  });

  test('2. Multi-Source Risk Synthesis: Evaluates active incidents with deterministic weighting', async () => {
    await Incident.create({
      incidentId: 'INC-79001',
      organizationId: tenantA,
      title: 'Database Ransomware Intrusion',
      severity: 'CRITICAL',
      status: 'INVESTIGATING',
      affectedAssets: ['SRV-CORE-01']
    });

    const assessment = await riskService.calculateSubjectRisk(tenantA, 'ASSET', 'SRV-CORE-01');

    expect(assessment.riskScore).toBeGreaterThan(0);
    expect(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).toContain(assessment.riskBand);
    expect(assessment.determination).toBe('DERIVED');
    expect(assessment.factors.length).toBeGreaterThan(0);
    expect(assessment.evidenceReferences).toContain('INCIDENT:INC-79001');
  });

  test('3. Immutable Risk Snapshot & Hash: Computes verified SHA-256 content hash', async () => {
    await Incident.create({
      incidentId: 'INC-79002',
      organizationId: tenantA,
      title: 'Exfiltration to Foreign IP',
      severity: 'HIGH',
      status: 'INVESTIGATING'
    });

    const snapshot = await riskService.createRiskSnapshot(tenantA, 'EXECUTIVE', 'ORGANIZATION_WIDE');

    expect(snapshot.snapshotId).toMatch(/^RISK-SNAP-/);
    expect(snapshot.contentHash).toBeDefined();
    expect(snapshot.contentHash).toHaveLength(64);
  });

  test('4. Risk Snapshot Comparison: Detects score deltas and evidence shifts', () => {
    const snapA = {
      calculatedRisk: 40,
      riskBand: 'MEDIUM',
      evidenceReferences: ['INCIDENT:101', 'ALERT:201']
    };
    const snapB = {
      calculatedRisk: 75,
      riskBand: 'HIGH',
      evidenceReferences: ['INCIDENT:101', 'ALERT:201', 'ALERT:202']
    };

    const delta = riskService.compareRiskSnapshots(snapA, snapB);

    expect(delta.deltaScore).toBe(35);
    expect(delta.previousBand).toBe('MEDIUM');
    expect(delta.currentBand).toBe('HIGH');
    expect(delta.evidenceAdded).toContain('ALERT:202');
    expect(delta.isSignificantShift).toBe(true);
  });

  test('5. Analyst Prioritization: Ranks items deterministically based on severity & state', async () => {
    await Incident.create({
      incidentId: 'INC-CRIT-01',
      organizationId: tenantA,
      title: 'Active Root Compromise',
      severity: 'CRITICAL',
      status: 'INVESTIGATING'
    });

    await Incident.create({
      incidentId: 'INC-LOW-01',
      organizationId: tenantA,
      title: 'Minor Policy Deviation',
      severity: 'LOW',
      status: 'INVESTIGATING'
    });

    const queueResult = await priorityService.getPrioritizedQueue(tenantA);

    expect(queueResult.returnedCount).toBe(2);
    expect(queueResult.queue[0].subjectId).toBe('INC-CRIT-01');
    expect(queueResult.queue[0].priorityScore).toBeGreaterThan(queueResult.queue[1].priorityScore);
    expect(queueResult.queue[0].priorityRank).toBe(1);
  });

  test('6. Priority Explanation: Explains rationale and contributing factors', async () => {
    await Incident.create({
      incidentId: 'INC-EXPLAIN-01',
      organizationId: tenantA,
      title: 'Lateral Movement Beacon',
      severity: 'HIGH',
      status: 'INVESTIGATING'
    });

    const explanation = await priorityService.explainPriority(tenantA, 'INCIDENT', 'INC-EXPLAIN-01');

    expect(explanation.subjectId).toBe('INC-EXPLAIN-01');
    expect(explanation.priorityRank).toBe(1);
    expect(explanation.factors.length).toBeGreaterThan(0);
    expect(explanation.determination).toBe('DERIVED');
  });

  test('7. Next-Best-Action Recommendations: Emits safe actions with authorization levels', async () => {
    const recs = await recommendationService.generateRecommendations(tenantA, 'INCIDENT', 'INC-79003');

    expect(recs.length).toBeGreaterThanOrEqual(4);
    const authLevels = recs.map(r => r.authorization);
    expect(authLevels).toContain('EXECUTABLE');
    expect(authLevels).toContain('APPROVAL_REQUIRED');
    expect(authLevels).toContain('NOT_SUPPORTED');
  });

  test('8. Recommendation Feedback: Accepts recommendation without rewriting record identity', async () => {
    const rec = await AnalystRecommendation.create({
      recommendationId: 'REC-FEEDBACK-01',
      organizationId: tenantA,
      subjectType: 'INCIDENT',
      subjectId: 'INC-79004',
      recommendationType: 'INVESTIGATION_STEP',
      title: 'Inspect Firewall Egress',
      rationale: 'Verify external IPs',
      authorization: 'EXECUTABLE',
      status: 'PROPOSED'
    });

    const accepted = await recommendationService.acceptRecommendation(tenantA, rec.recommendationId, 'ANALYST_JANE');

    expect(accepted.status).toBe('ACCEPTED');
    expect(accepted.resolvedBy).toBe('ANALYST_JANE');
    expect(accepted.resolvedAt).toBeDefined();
  });

  test('9. Campaign Activity Clustering: Groups graph components with Attribution Guard', async () => {
    await SecurityGraphNode.create([
      { nodeId: 'N1', organizationId: tenantA, entityType: 'ASSET', entityId: 'SRV-01', displayName: 'Server 1', source: 'ASSET_INVENTORY' },
      { nodeId: 'N2', organizationId: tenantA, entityType: 'IOC', entityId: '198.51.100.10', displayName: 'C2 IP', source: 'IOC_FEED' },
      { nodeId: 'N3', organizationId: tenantA, entityType: 'ALERT', entityId: 'ALT-101', displayName: 'Exfil Alert', source: 'SIEM' }
    ]);

    await SecurityGraphEdge.create([
      { edgeId: 'E1', organizationId: tenantA, fromNode: 'N1', toNode: 'N2', relationshipType: 'ASSOCIATED_WITH', provenanceType: 'DIRECT_RECORD_REFERENCE', checksum: 'c1' },
      { edgeId: 'E2', organizationId: tenantA, fromNode: 'N2', toNode: 'N3', relationshipType: 'TRIGGERED', provenanceType: 'DIRECT_RECORD_REFERENCE', checksum: 'c2' }
    ]);

    const result = await clusteringService.discoverClusters(tenantA);

    expect(result.totalClusters).toBe(1);
    expect(result.clusters[0].nodeCount).toBe(3);
    expect(result.clusters[0].attackerAttribution).toBe('UNKNOWN');
    expect(result.clusters[0].attributionDisclaimer).toContain('Attribution Guard');
  });

  test('10. Investigation Hypotheses Lifecycle: Supports, refutes, and tracks evidence', async () => {
    const hyp = await InvestigationHypothesis.create({
      hypothesisId: 'HYP-UNIT-01',
      organizationId: tenantA,
      title: 'Supply Chain Compromise',
      statement: 'Adversary leveraged compromised package in build pipeline.',
      status: 'OPEN',
      createdBy: 'LEAD_INVESTIGATOR'
    });

    expect(hyp.status).toBe('OPEN');
    expect(hyp.supportingEvidence).toHaveLength(0);

    hyp.supportingEvidence.push({
      evidenceId: 'EV-BUILD-HASH',
      description: 'Hash mismatch on vendor package',
      source: 'BUILD_LOGS'
    });
    hyp.status = 'SUPPORTED';
    await hyp.save();

    const updated = await InvestigationHypothesis.findOne({ hypothesisId: 'HYP-UNIT-01' });
    expect(updated.status).toBe('SUPPORTED');
    expect(updated.supportingEvidence).toHaveLength(1);
  });
});
