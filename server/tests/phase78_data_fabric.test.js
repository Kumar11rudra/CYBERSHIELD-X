const mongoose = require('mongoose');
const SecurityGraphService = require('../services/datafabric/SecurityGraphService');
const CorrelationService = require('../services/datafabric/CorrelationService');
const EntityNormalizationService = require('../services/datafabric/EntityNormalizationService');
const InvestigationQueryService = require('../services/datafabric/InvestigationQueryService');

const SecurityGraphNode = require('../models/SecurityGraphNode');
const SecurityGraphEdge = require('../models/SecurityGraphEdge');
const InvestigationGraphSnapshot = require('../models/InvestigationGraphSnapshot');
const CorrelationRule = require('../models/CorrelationRule');
const CorrelationResult = require('../models/CorrelationResult');
const Incident = require('../models/Incident');

describe('Phase 78 Security Data Fabric & Unified Investigation Graph Unit Suite', () => {
  const tenantA = 'org_alpha_78_unit';
  const tenantB = 'org_beta_78_unit';

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cybershield_x_test');
    }
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await SecurityGraphNode.deleteMany({});
    await SecurityGraphEdge.deleteMany({});
    await InvestigationGraphSnapshot.deleteMany({});
    await CorrelationRule.deleteMany({});
    await CorrelationResult.deleteMany({});
    await Incident.deleteMany({});
  });

  test('1. Entity Normalization: Maps raw record to canonical descriptor', () => {
    const rawInc = { incidentId: 'INC-78001', title: 'Suspicious Auth Anomaly', severity: 'HIGH', status: 'INVESTIGATING' };
    const normalized = EntityNormalizationService.normalizeRecord('INCIDENT', rawInc);

    expect(normalized.nodeId).toBe('NODE-INCIDENT-INC-78001');
    expect(normalized.entityType).toBe('INCIDENT');
    expect(normalized.entityId).toBe('INC-78001');
    expect(normalized.displayName).toBe('Suspicious Auth Anomaly');
  });

  test('2. Node Materialization & Deduplication: Updates existing node on duplicate request', async () => {
    const record = { incidentId: 'INC-78002', title: 'C2 Traffic Observed', severity: 'HIGH' };
    const n1 = await SecurityGraphService.materializeNode('INCIDENT', record, tenantA);
    const n2 = await SecurityGraphService.materializeNode('INCIDENT', record, tenantA);

    expect(n1.nodeId).toBe(n2.nodeId);
    const count = await SecurityGraphNode.countDocuments({ organizationId: tenantA });
    expect(count).toBe(1);
  });

  test('3. Edge Materialization & SHA-256 Checksum: Computes cryptographic checksum', async () => {
    const edge = await SecurityGraphService.materializeEdge({
      fromNodeId: 'NODE-INCIDENT-101',
      toNodeId: 'NODE-ASSET-SERVER-01',
      relationshipType: 'AFFECTS',
      provenanceType: 'PERSISTED_FOREIGN_KEY',
      provenanceReferences: ['INCIDENT_101'],
      organizationId: tenantA
    });

    expect(edge.checksum).toBeDefined();
    expect(edge.checksum.length).toBe(64); // SHA-256 hex string
  });

  test('4. Tenant Isolation: Organization B cannot traverse Organization A nodes', async () => {
    await SecurityGraphService.materializeNode('INCIDENT', { incidentId: 'INC-A', title: 'Tenant A Inc' }, tenantA);

    const queryRes = await InvestigationQueryService.queryNeighborhood({
      entityType: 'INCIDENT',
      entityId: 'INC-A',
      organizationId: tenantB
    });

    expect(queryRes.rootNode).toBeNull();
    expect(queryRes.nodes.length).toBe(0);
  });

  test('5. Bounded Neighborhood Expansion: Expands up to maxDepth and maxNodes', async () => {
    const nodeA = await SecurityGraphService.materializeNode('INCIDENT', { incidentId: 'INC-N1', title: 'Root Inc' }, tenantA);
    const nodeB = await SecurityGraphService.materializeNode('ASSET', { assetId: 'AST-N1', hostname: 'host-1' }, tenantA);

    await SecurityGraphService.materializeEdge({
      fromNodeId: nodeA.nodeId,
      toNodeId: nodeB.nodeId,
      relationshipType: 'AFFECTS',
      organizationId: tenantA
    });

    const neighborhood = await InvestigationQueryService.queryNeighborhood({
      entityType: 'INCIDENT',
      entityId: 'INC-N1',
      organizationId: tenantA,
      maxDepth: 2,
      maxNodes: 50
    });

    expect(neighborhood.totalNodes).toBe(2);
    expect(neighborhood.totalEdges).toBe(1);
  });

  test('6. Shortest Path Discovery: Discovers path between two linked nodes', async () => {
    const nodeA = await SecurityGraphService.materializeNode('INCIDENT', { incidentId: 'INC-PATH-1', title: 'Path Start' }, tenantA);
    const nodeB = await SecurityGraphService.materializeNode('ASSET', { assetId: 'AST-PATH-1', hostname: 'target-host' }, tenantA);

    await SecurityGraphService.materializeEdge({
      fromNodeId: nodeA.nodeId,
      toNodeId: nodeB.nodeId,
      relationshipType: 'AFFECTS',
      organizationId: tenantA
    });

    const pathRes = await InvestigationQueryService.findShortestPath('INCIDENT', 'INC-PATH-1', 'ASSET', 'AST-PATH-1', tenantA);

    expect(pathRes.pathFound).toBe(true);
    expect(pathRes.length).toBe(1);
  });

  test('7. Immutable Graph Snapshot: Creation & SHA-256 Integrity Verification', async () => {
    await SecurityGraphService.materializeNode('INCIDENT', { incidentId: 'INC-SNAP-1', title: 'Snapshot Root' }, tenantA);

    const snapshot = await InvestigationQueryService.createSnapshot({
      rootEntityType: 'INCIDENT',
      rootEntityId: 'INC-SNAP-1',
      queryDefinition: { maxDepth: 2 },
      user: { username: 'test_analyst', role: 'ANALYST' },
      organizationId: tenantA
    });

    expect(snapshot.contentHash).toBeDefined();

    const verifyRes = await InvestigationQueryService.verifySnapshotIntegrity(snapshot.snapshotId, tenantA);
    expect(verifyRes.isValid).toBe(true);
  });

  test('8. Graph Integrity Diagnostics: Detects orphan nodes', async () => {
    await SecurityGraphService.materializeNode('INCIDENT', { incidentId: 'INC-ORPHAN-1', title: 'Orphan Node' }, tenantA);

    const report = await InvestigationQueryService.checkGraphIntegrity(tenantA);
    expect(report.totalNodes).toBe(1);
    expect(report.orphanNodeCount).toBe(1);
  });
});
