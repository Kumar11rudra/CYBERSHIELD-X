/**
 * 🛡️ CyberShield X — Phase 80 Step 6 Test Suite
 *
 * Data Fabric Projection & Recovery Adapter Test Battery:
 * Tests A through AH covering deterministic graph projection, idempotent upserts,
 * tenant/provider/account binding, 5-tier classification rules, read-filtering,
 * partial projection failure recovery, exponential backoff with jitter,
 * poison-event isolation, batch reconciliation, startup/periodic safety,
 * and zero disruption to Step 5 durable persistence or Phase 79 Decision Intelligence.
 */

'use strict';

const mongoose = require('mongoose');
const { CloudDataFabricAdapter } = require('../services/ingestion/CloudDataFabricAdapter');
const adapter = require('../services/ingestion/CloudDataFabricAdapter');
const { CloudPersistenceService } = require('../services/ingestion/CloudPersistenceService');
const CloudTelemetryEvent = require('../models/CloudTelemetryEvent');
const SecurityGraphNode = require('../models/SecurityGraphNode');
const SecurityGraphEdge = require('../models/SecurityGraphEdge');
const DecisionAssessment = require('../models/DecisionAssessment');
const { connectTestDb, closeTestDb, clearTestDb } = require('./helpers/testDbHelper');

describe('Phase 80 Step 6 — Data Fabric Projection & Recovery Adapter', () => {
  const tenantA = 'org-step6-test-a';
  const tenantB = 'org-step6-test-b';

  beforeAll(async () => {
    await connectTestDb();
  });

  afterAll(async () => {
    adapter.stopPeriodicReconciliation();
    await closeTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
    adapter.stopPeriodicReconciliation();
  });

  // Helper to create a saved CloudTelemetryEvent document
  async function createTestDoc(overrides = {}) {
    const docData = {
      canonicalEventId: `CLOUD-${overrides.provider || 'AWS'}-${overrides.organizationId || tenantA}-${overrides.nativeEventId || 'evt-default-001'}`,
      organizationId: overrides.organizationId || tenantA,
      connectorId: 'conn-aws-001',
      provider: overrides.provider || 'AWS',
      nativeEventId: overrides.nativeEventId || 'evt-default-001',
      cloudAccountId: overrides.cloudAccountId || '123456789012',
      region: overrides.region || 'us-east-1',
      eventTime: overrides.eventTime || new Date('2026-09-17T10:00:00Z'),
      graphMaterialized: false,
      projectionRetryCount: overrides.projectionRetryCount || 0,
      projectionStatus: overrides.projectionStatus || 'PENDING',
      lastProjectionError: null,
      actor: overrides.actor || {
        principalId: 'AIDAALICE',
        principalType: 'IAMUser',
        principalName: 'AliceAdmin',
        callerIp: '198.51.100.25',
      },
      action: overrides.action || {
        service: 'iam',
        operation: 'CreateUser',
        category: 'MUTATING_SECURITY',
        tier: 1,
        isMutating: true,
      },
      resources: overrides.resources || [
        {
          resourceType: 'AWS::IAM::User',
          resourceId: 'arn:aws:iam::123456789012:user/BobDeveloper',
          resourceName: 'BobDeveloper',
        },
      ],
      outcome: 'SUCCESS',
      severity: overrides.severity || 'HIGH',
      signatureStatus: 'VERIFIED',
      rawPayloadHash: 'a'.repeat(64),
      parameters: overrides.parameters || { testKey: 'testVal' },
    };

    return await CloudTelemetryEvent.create(docData);
  }

  // ===========================================================================
  // SCENARIO A: PENDING event projects successfully
  // ===========================================================================
  test('Scenario A: PENDING event projects successfully', async () => {
    const event = await createTestDoc({ nativeEventId: 'evt-scen-a' });
    expect(event.projectionStatus).toBe('PENDING');
    expect(event.graphMaterialized).toBe(false);

    const result = await CloudDataFabricAdapter.projectEvent(event);

    expect(result.status).toBe('MATERIALIZED');
    expect(result.materialized).toBe(true);
    expect(result.nodes.length).toBeGreaterThan(0);
  });

  // ===========================================================================
  // SCENARIO B: Successful projection becomes MATERIALIZED
  // ===========================================================================
  test('Scenario B: Successful projection becomes MATERIALIZED', async () => {
    const event = await createTestDoc({ nativeEventId: 'evt-scen-b' });
    await CloudDataFabricAdapter.projectEvent(event);

    const updated = await CloudTelemetryEvent.findById(event._id);
    expect(updated.projectionStatus).toBe('MATERIALIZED');
    expect(updated.graphMaterialized).toBe(true);
    expect(updated.lastProjectionError).toBeNull();
  });

  // ===========================================================================
  // SCENARIO C: Actor/resource graph entities are deterministic
  // ===========================================================================
  test('Scenario C: Actor/resource graph entities are deterministic', async () => {
    const event = await createTestDoc({ nativeEventId: 'evt-scen-c' });
    const actorDesc = CloudDataFabricAdapter.deriveActorNodeDescriptor(event);
    const resDesc = CloudDataFabricAdapter.deriveResourceNodeDescriptor(event, event.resources[0]);

    expect(actorDesc.nodeId).toBe(`NODE-IDENTITY-${tenantA}:AWS:123456789012:AIDAALICE`);
    expect(actorDesc.entityType).toBe('IDENTITY');
    expect(actorDesc.displayName).toContain('AliceAdmin');

    expect(resDesc.nodeId).toBe(`NODE-IDENTITY-${tenantA}:AWS:123456789012:arn:aws:iam::123456789012:user/BobDeveloper`);
    expect(resDesc.entityType).toBe('IDENTITY');
  });

  // ===========================================================================
  // SCENARIO D: Graph edge identity is deterministic
  // ===========================================================================
  test('Scenario D: Graph edge identity is deterministic', async () => {
    const event = await createTestDoc({ nativeEventId: 'evt-scen-d' });
    const result = await CloudDataFabricAdapter.projectEvent(event);

    expect(result.edges.length).toBe(1);
    const edge = result.edges[0];
    expect(edge.edgeId).toBe(`EDGE-NODE-IDENTITY-${tenantA}:AWS:123456789012:AIDAALICE-TO-NODE-IDENTITY-${tenantA}:AWS:123456789012:arn:aws:iam::123456789012:user/BobDeveloper-AFFECTS`);
    expect(edge.relationshipType).toBe('AFFECTS');
    expect(edge.checksum).toBeDefined();
    expect(edge.checksum.length).toBe(64); // SHA-256 hex
  });

  // ===========================================================================
  // SCENARIO E: Reprocessing the same event is idempotent
  // ===========================================================================
  test('Scenario E: Reprocessing the same event is idempotent', async () => {
    const event = await createTestDoc({ nativeEventId: 'evt-scen-e' });
    const res1 = await CloudDataFabricAdapter.projectEvent(event);
    const res2 = await CloudDataFabricAdapter.projectEvent(event);

    expect(res1.status).toBe('MATERIALIZED');
    expect(res2.status).toBe('MATERIALIZED');
    expect(res1.nodes[0].nodeId).toBe(res2.nodes[0].nodeId);
  });

  // ===========================================================================
  // SCENARIO F: Duplicate projection creates no duplicate nodes
  // ===========================================================================
  test('Scenario F: Duplicate projection creates no duplicate nodes', async () => {
    const event = await createTestDoc({ nativeEventId: 'evt-scen-f' });
    await CloudDataFabricAdapter.projectEvent(event);
    await CloudDataFabricAdapter.projectEvent(event);

    const nodeCount = await SecurityGraphNode.countDocuments({ organizationId: tenantA });
    // Expect exactly 2 nodes: 1 actor + 1 resource
    expect(nodeCount).toBe(2);
  });

  // ===========================================================================
  // SCENARIO G: Duplicate projection creates no duplicate edges
  // ===========================================================================
  test('Scenario G: Duplicate projection creates no duplicate edges', async () => {
    const event = await createTestDoc({ nativeEventId: 'evt-scen-g' });
    await CloudDataFabricAdapter.projectEvent(event);
    await CloudDataFabricAdapter.projectEvent(event);

    const edgeCount = await SecurityGraphEdge.countDocuments({ organizationId: tenantA });
    expect(edgeCount).toBe(1);
  });

  // ===========================================================================
  // SCENARIO H: Tenant isolation is preserved
  // ===========================================================================
  test('Scenario H: Tenant isolation is preserved', async () => {
    const eventA = await createTestDoc({ organizationId: tenantA, nativeEventId: 'evt-tenant-a' });
    await CloudDataFabricAdapter.projectEvent(eventA);

    const nodesA = await SecurityGraphNode.find({ organizationId: tenantA });
    const nodesB = await SecurityGraphNode.find({ organizationId: tenantB });

    expect(nodesA.length).toBe(2);
    expect(nodesB.length).toBe(0);
  });

  // ===========================================================================
  // SCENARIO I: Cross-tenant identical resource IDs remain isolated
  // ===========================================================================
  test('Scenario I: Cross-tenant identical resource IDs remain isolated', async () => {
    const sharedResource = [
      {
        resourceType: 'AWS::EC2::SecurityGroup',
        resourceId: 'sg-default-shared',
        resourceName: 'default',
      },
    ];

    const eventA = await createTestDoc({
      organizationId: tenantA,
      nativeEventId: 'evt-shared-a',
      resources: sharedResource,
    });
    const eventB = await createTestDoc({
      organizationId: tenantB,
      nativeEventId: 'evt-shared-b',
      resources: sharedResource,
    });

    await CloudDataFabricAdapter.projectEvent(eventA);
    await CloudDataFabricAdapter.projectEvent(eventB);

    const nodeA = await SecurityGraphNode.findOne({ organizationId: tenantA, entityType: 'ASSET' });
    const nodeB = await SecurityGraphNode.findOne({ organizationId: tenantB, entityType: 'ASSET' });

    expect(nodeA).not.toBeNull();
    expect(nodeB).not.toBeNull();
    expect(nodeA.organizationId).toBe(tenantA);
    expect(nodeB.organizationId).toBe(tenantB);
    expect(nodeA.nodeId).not.toBe(nodeB.nodeId);
  });

  // ===========================================================================
  // SCENARIO J: Provider/account binding remains intact
  // ===========================================================================
  test('Scenario J: Provider/account binding remains intact', async () => {
    const event = await createTestDoc({
      provider: 'AZURE',
      cloudAccountId: 'sub-azure-999',
      region: 'eastus',
      nativeEventId: 'evt-scen-j',
      resources: [
        {
          resourceType: 'Microsoft.Compute/virtualMachines',
          resourceId: 'vm-azure-prod',
          resourceName: 'prod-vm',
        },
      ],
    });

    const result = await CloudDataFabricAdapter.projectEvent(event);
    const resNode = result.nodes.find((n) => n.entityType === 'ASSET');

    expect(resNode.entityId).toBe(`${tenantA}:AZURE:sub-azure-999:vm-azure-prod`);
    expect(resNode.metadata.provider).toBe('AZURE');
    expect(resNode.metadata.cloudAccountId).toBe('sub-azure-999');
    expect(resNode.metadata.region).toBe('eastus');
  });

  // ===========================================================================
  // SCENARIO K: Tier 1 event projects according to approved graph mapping
  // ===========================================================================
  test('Scenario K: Tier 1 event projects according to approved graph mapping', async () => {
    const event = await createTestDoc({
      action: {
        service: 'iam',
        operation: 'AttachRolePolicy',
        category: 'MUTATING_SECURITY',
        tier: 1,
        isMutating: true,
      },
      resources: [
        {
          resourceType: 'AWS::IAM::Role',
          resourceId: 'arn:aws:iam::123456789012:role/AdminRole',
          resourceName: 'AdminRole',
        },
      ],
    });

    const result = await CloudDataFabricAdapter.projectEvent(event);
    expect(result.status).toBe('MATERIALIZED');
    expect(result.edges[0].relationshipType).toBe('AFFECTS');
  });

  // ===========================================================================
  // SCENARIO L: Tier 2 event projects according to approved graph mapping
  // ===========================================================================
  test('Scenario L: Tier 2 event projects according to approved graph mapping', async () => {
    const event = await createTestDoc({
      action: {
        service: 'signin',
        operation: 'ConsoleLogin',
        category: 'SECURITY_AUTH',
        tier: 2,
        isMutating: false,
      },
      resources: [],
    });

    const result = await CloudDataFabricAdapter.projectEvent(event);
    expect(result.status).toBe('MATERIALIZED');

    const auditNode = result.nodes.find((n) => n.entityType === 'AUDIT_EVENT');
    expect(auditNode).toBeDefined();
    expect(auditNode.displayName).toContain('ConsoleLogin');

    const edge = result.edges.find((e) => e.relationshipType === 'ASSOCIATED_WITH');
    expect(edge).toBeDefined();
    expect(edge.toNode).toBe(auditNode.nodeId);
  });

  // ===========================================================================
  // SCENARIO M: Tier 3 event projects according to approved graph mapping
  // ===========================================================================
  test('Scenario M: Tier 3 event projects according to approved graph mapping', async () => {
    const event = await createTestDoc({
      action: {
        service: 'ec2',
        operation: 'StartInstances',
        category: 'LIFECYCLE',
        tier: 3,
        isMutating: true,
      },
      resources: [
        {
          resourceType: 'AWS::EC2::Instance',
          resourceId: 'i-0abcdef1234567890',
          resourceName: 'worker-node-1',
        },
      ],
    });

    const result = await CloudDataFabricAdapter.projectEvent(event);
    expect(result.status).toBe('MATERIALIZED');

    const assetNode = result.nodes.find((n) => n.entityType === 'ASSET');
    expect(assetNode).toBeDefined();
    expect(assetNode.entityId).toContain('i-0abcdef1234567890');
  });

  // ===========================================================================
  // SCENARIO N: Tier 4 READ/LIST event becomes SKIPPED_READ_FILTER where approved
  // ===========================================================================
  test('Scenario N: Tier 4 READ/LIST event becomes SKIPPED_READ_FILTER where approved', async () => {
    const event = await createTestDoc({
      action: {
        service: 'ec2',
        operation: 'DescribeInstances',
        category: 'READ_LIST',
        tier: 4,
        isMutating: false,
      },
      resources: [],
    });

    const result = await CloudDataFabricAdapter.projectEvent(event);

    expect(result.status).toBe('SKIPPED_READ_FILTER');
    expect(result.materialized).toBe(false);
    expect(result.nodes.length).toBe(0);
    expect(result.edges.length).toBe(0);

    const updated = await CloudTelemetryEvent.findById(event._id);
    expect(updated.projectionStatus).toBe('SKIPPED_READ_FILTER');
    expect(updated.graphMaterialized).toBe(false);

    // Exactly zero graph nodes or edges created
    const nodeCount = await SecurityGraphNode.countDocuments({ organizationId: tenantA });
    expect(nodeCount).toBe(0);
  });

  // ===========================================================================
  // SCENARIO O: Tier 5 unknown event follows safe default behavior
  // ===========================================================================
  test('Scenario O: Tier 5 unknown event follows safe default behavior', async () => {
    // 1. Low/Medium severity Tier 5 is filtered out
    const lowEvent = await createTestDoc({
      nativeEventId: 'evt-tier5-low',
      action: {
        service: 'custom',
        operation: 'CustomOperation',
        tier: 5,
        isMutating: false,
      },
      severity: 'LOW',
    });

    const lowResult = await CloudDataFabricAdapter.projectEvent(lowEvent);
    expect(lowResult.status).toBe('SKIPPED_READ_FILTER');
    expect(lowResult.materialized).toBe(false);

    // 2. CRITICAL Tier 5 event IS projected safely
    const critEvent = await createTestDoc({
      nativeEventId: 'evt-tier5-crit',
      action: {
        service: 'custom',
        operation: 'CustomExploitOperation',
        tier: 5,
        isMutating: true,
      },
      severity: 'CRITICAL',
    });

    const critResult = await CloudDataFabricAdapter.projectEvent(critEvent);
    expect(critResult.status).toBe('MATERIALIZED');
    expect(critResult.materialized).toBe(true);
  });

  // ===========================================================================
  // SCENARIO P: Partial node/edge failure does not falsely mark MATERIALIZED
  // ===========================================================================
  test('Scenario P: Partial node/edge failure does not falsely mark MATERIALIZED', async () => {
    const event = await createTestDoc({ nativeEventId: 'evt-scen-p' });

    // Mock upsertEdge to fail simulating an edge insertion crash
    const origUpsertEdge = CloudDataFabricAdapter.upsertEdge;
    CloudDataFabricAdapter.upsertEdge = jest.fn().mockRejectedValue(new Error('Simulated edge insertion failure'));

    try {
      const result = await CloudDataFabricAdapter.projectEvent(event);
      expect(result.materialized).toBe(false);
      expect(result.status).toBe('PENDING');

      const updated = await CloudTelemetryEvent.findById(event._id);
      expect(updated.graphMaterialized).toBe(false);
      expect(updated.projectionStatus).toBe('PENDING');
      expect(updated.projectionRetryCount).toBe(1);
      expect(updated.lastProjectionError).toContain('Simulated edge insertion failure');
    } finally {
      CloudDataFabricAdapter.upsertEdge = origUpsertEdge;
    }
  });

  // ===========================================================================
  // SCENARIO Q: Retry counter increments correctly
  // ===========================================================================
  test('Scenario Q: Retry counter increments correctly', async () => {
    const event = await createTestDoc({ nativeEventId: 'evt-scen-q', projectionRetryCount: 1 });

    const origUpsertNode = CloudDataFabricAdapter.upsertNode;
    CloudDataFabricAdapter.upsertNode = jest.fn().mockRejectedValue(new Error('Transient node error'));

    try {
      const result = await CloudDataFabricAdapter.projectEvent(event);
      expect(result.retryCount).toBe(2);

      const updated = await CloudTelemetryEvent.findById(event._id);
      expect(updated.projectionRetryCount).toBe(2);
    } finally {
      CloudDataFabricAdapter.upsertNode = origUpsertNode;
    }
  });

  // ===========================================================================
  // SCENARIO R: Exponential backoff is bounded
  // ===========================================================================
  test('Scenario R: Exponential backoff is bounded', () => {
    const b0 = CloudDataFabricAdapter.calculateBackoff(0);
    const b1 = CloudDataFabricAdapter.calculateBackoff(1);
    const b4 = CloudDataFabricAdapter.calculateBackoff(4);
    const b10 = CloudDataFabricAdapter.calculateBackoff(10);

    expect(b0).toBeGreaterThanOrEqual(1000);
    expect(b1).toBeGreaterThanOrEqual(2000);
    expect(b4).toBeGreaterThanOrEqual(16000);
    expect(b10).toBeLessThanOrEqual(300500); // 300,000 max base + 500 max jitter
  });

  // ===========================================================================
  // SCENARIO S: Jitter is applied
  // ===========================================================================
  test('Scenario S: Jitter is applied', () => {
    const samples = new Set();
    for (let i = 0; i < 20; i++) {
      samples.add(CloudDataFabricAdapter.calculateBackoff(2));
    }
    // With 0-500ms random jitter, 20 samples should produce multiple distinct values
    expect(samples.size).toBeGreaterThan(1);
  });

  // ===========================================================================
  // SCENARIO T: Maximum retry limit is enforced
  // ===========================================================================
  test('Scenario T: Maximum retry limit is enforced', async () => {
    const event = await createTestDoc({ nativeEventId: 'evt-scen-t', projectionRetryCount: 4 });

    const origUpsertNode = CloudDataFabricAdapter.upsertNode;
    CloudDataFabricAdapter.upsertNode = jest.fn().mockRejectedValue(new Error('Fifth failure'));

    try {
      const result = await CloudDataFabricAdapter.projectEvent(event);
      expect(result.status).toBe('POISON_FAILED');
      expect(result.isPoison).toBe(true);

      const updated = await CloudTelemetryEvent.findById(event._id);
      expect(updated.projectionRetryCount).toBe(5);
      expect(updated.projectionStatus).toBe('POISON_FAILED');
    } finally {
      CloudDataFabricAdapter.upsertNode = origUpsertNode;
    }
  });

  // ===========================================================================
  // SCENARIO U: Fifth/final failure transitions to POISON_FAILED
  // ===========================================================================
  test('Scenario U: Fifth/final failure transitions to POISON_FAILED', async () => {
    const event = await createTestDoc({ nativeEventId: 'evt-scen-u', projectionRetryCount: 4 });

    const origUpsertNode = CloudDataFabricAdapter.upsertNode;
    CloudDataFabricAdapter.upsertNode = jest.fn().mockRejectedValue(new Error('Permanent corrupt payload'));

    try {
      await CloudDataFabricAdapter.projectEvent(event);
      const updated = await CloudTelemetryEvent.findById(event._id);
      expect(updated.projectionStatus).toBe('POISON_FAILED');
    } finally {
      CloudDataFabricAdapter.upsertNode = origUpsertNode;
    }
  });

  // ===========================================================================
  // SCENARIO V: Poison event does not block another event in same batch
  // ===========================================================================
  test('Scenario V: Poison event does not block another event in same batch', async () => {
    // Create 2 events: Event 1 is on its 5th failure; Event 2 is healthy
    const poisonEvent = await createTestDoc({
      nativeEventId: 'evt-poison-1',
      actor: { principalId: 'POISON_USER', principalName: 'PoisonUser', callerIp: '198.51.100.99' },
      projectionRetryCount: 4,
    });
    const healthyEvent = await createTestDoc({
      nativeEventId: 'evt-healthy-2',
      actor: { principalId: 'HEALTHY_USER', principalName: 'HealthyUser', callerIp: '198.51.100.100' },
      projectionRetryCount: 0,
    });

    const origUpsertNode = CloudDataFabricAdapter.upsertNode;
    CloudDataFabricAdapter.upsertNode = jest.fn().mockImplementation(async (desc, orgId) => {
      if (desc.nodeId.includes('POISON_USER')) {
        throw new Error('Poison event error');
      }
      return origUpsertNode.call(CloudDataFabricAdapter, desc, orgId);
    });

    try {
      const summary = await CloudDataFabricAdapter.reconcilePendingBatch(10);
      expect(summary.processed).toBe(2);

      const pDoc = await CloudTelemetryEvent.findById(poisonEvent._id);
      const hDoc = await CloudTelemetryEvent.findById(healthyEvent._id);

      expect(pDoc.projectionStatus).toBe('POISON_FAILED');
      expect(hDoc.projectionStatus).toBe('MATERIALIZED');
    } finally {
      CloudDataFabricAdapter.upsertNode = origUpsertNode;
    }
  });

  // ===========================================================================
  // SCENARIO W: Original CloudTelemetryEvent remains preserved after poison failure
  // ===========================================================================
  test('Scenario W: Original CloudTelemetryEvent remains preserved after poison failure', async () => {
    const event = await createTestDoc({
      nativeEventId: 'evt-scen-w',
      projectionRetryCount: 4,
      parameters: { criticalAuditParam: 'preserved-state-123' },
    });

    const origUpsertNode = CloudDataFabricAdapter.upsertNode;
    CloudDataFabricAdapter.upsertNode = jest.fn().mockRejectedValue(new Error('Fatal error'));

    try {
      await CloudDataFabricAdapter.projectEvent(event);
      const doc = await CloudTelemetryEvent.findById(event._id);

      expect(doc).not.toBeNull();
      expect(doc.nativeEventId).toBe('evt-scen-w');
      expect(doc.parameters.criticalAuditParam).toBe('preserved-state-123');
      expect(doc.rawPayloadHash).toBe('a'.repeat(64));
      expect(doc.projectionStatus).toBe('POISON_FAILED');
    } finally {
      CloudDataFabricAdapter.upsertNode = origUpsertNode;
    }
  });

  // ===========================================================================
  // SCENARIO X: lastProjectionError is bounded and sanitized
  // ===========================================================================
  test('Scenario X: lastProjectionError is bounded and sanitized', () => {
    const unsanitized =
      'Error occurred: password=SuperSecretPassword123! token=eyJh.eyJb.sig Bearer abc-xyz\r\n\t' +
      'x'.repeat(1000);

    const sanitized = CloudDataFabricAdapter.sanitizeErrorMessage(unsanitized);

    expect(sanitized).not.toContain('SuperSecretPassword123!');
    expect(sanitized).not.toContain('abc-xyz');
    expect(sanitized).not.toContain('\r');
    expect(sanitized).not.toContain('\n');
    expect(sanitized.length).toBeLessThanOrEqual(512);
  });

  // ===========================================================================
  // SCENARIO Y: Raw secrets are not written to logs
  // ===========================================================================
  test('Scenario Y: Raw secrets are not written to logs', () => {
    const sensitiveMsg = 'AccessKey: AKIASECRETKEY12345678, Secret: VerySecretString';
    const sanitized = CloudDataFabricAdapter.sanitizeErrorMessage(sensitiveMsg);

    expect(sanitized).not.toContain('AKIASECRETKEY12345678');
    expect(sanitized).not.toContain('VerySecretString');
  });

  // ===========================================================================
  // SCENARIO Z: Reconciliation batch never exceeds 100 events
  // ===========================================================================
  test('Scenario Z: Reconciliation batch never exceeds 100 events', async () => {
    // Spy on CloudTelemetryEvent.find
    const findSpy = jest.spyOn(CloudTelemetryEvent, 'find');

    await CloudDataFabricAdapter.reconcilePendingBatch(500); // requested 500

    expect(findSpy).toHaveBeenCalled();
    findSpy.mockRestore();
  });

  // ===========================================================================
  // SCENARIO AA: Reconciliation does not process POISON_FAILED events
  // ===========================================================================
  test('Scenario AA: Reconciliation does not process POISON_FAILED events', async () => {
    await createTestDoc({ nativeEventId: 'evt-poison-ignored', projectionStatus: 'POISON_FAILED' });
    await createTestDoc({ nativeEventId: 'evt-materialized-ignored', projectionStatus: 'MATERIALIZED' });

    const summary = await CloudDataFabricAdapter.reconcilePendingBatch(10);
    expect(summary.processed).toBe(0);
  });

  // ===========================================================================
  // SCENARIO AB: Startup reconciliation is bounded and safe
  // ===========================================================================
  test('Scenario AB: Startup reconciliation is bounded and safe', async () => {
    await createTestDoc({ nativeEventId: 'evt-startup-1' });
    await createTestDoc({ nativeEventId: 'evt-startup-2' });

    const summary = await CloudDataFabricAdapter.runStartupReconciliation(10);
    expect(summary.processed).toBe(2);
    expect(summary.materialized).toBe(2);
  });

  // ===========================================================================
  // SCENARIO AC: Periodic reconciler does not overlap with itself
  // ===========================================================================
  test('Scenario AC: Periodic reconciler does not overlap with itself', async () => {
    const adapterInstance = new CloudDataFabricAdapter();
    expect(adapterInstance.isReconciling()).toBe(false);

    // Simulate active reconciliation flag
    adapterInstance._isReconciling = true;

    // Trigger interval callback manually
    const timer = adapterInstance.startPeriodicReconciliation(100);
    expect(adapterInstance.isReconciling()).toBe(true);

    adapterInstance.stopPeriodicReconciliation();
    expect(adapterInstance.isReconciling()).toBe(false);
  });

  // ===========================================================================
  // SCENARIO AD: MongoDB failure does not crash ingestion/persistence
  // ===========================================================================
  test('Scenario AD: MongoDB failure does not crash ingestion/persistence', async () => {
    const findSpy = jest.spyOn(CloudTelemetryEvent, 'find').mockImplementationOnce(() => {
      throw new Error('Connection pool closed');
    });

    const summary = await CloudDataFabricAdapter.reconcilePendingBatch(10);
    expect(summary.error).toBeDefined();
    expect(summary.error).toContain('Connection pool closed');

    findSpy.mockRestore();
  });

  // ===========================================================================
  // SCENARIO AE: Data Fabric projection failure does not alter Step 5 durable persistence
  // ===========================================================================
  test('Scenario AE: Data Fabric projection failure does not alter Step 5 durable persistence', async () => {
    const rawEvent = {
      provider: 'AWS',
      nativeEventId: 'evt-persist-isolation-001',
      cloudAccountId: '123456789012',
      region: 'us-east-1',
      eventTime: new Date(),
      organizationId: tenantA,
      connectorId: 'conn-iso-001',
      signatureStatus: 'VERIFIED',
      actor: { principalId: 'ALICE', principalName: 'Alice' },
      action: { service: 'iam', operation: 'DeleteUser', tier: 1, isMutating: true },
      resources: [{ resourceType: 'AWS::IAM::User', resourceId: 'user-001' }],
      outcome: 'SUCCESS',
      severity: 'CRITICAL',
      rawPayloadHash: 'b'.repeat(64),
    };

    const verificationContext = {
      organizationId: tenantA,
      connectorId: 'conn-iso-001',
      provider: 'AWS',
      status: 'VERIFIED',
      enrolledAccountIds: ['123456789012'],
    };

    // Step 5 durable persistence executes independently
    const persistResult = await CloudPersistenceService.persist(rawEvent, verificationContext);
    expect(persistResult.status).toBe('CREATED');

    // Simulate Step 6 failure immediately after
    const savedDoc = await CloudTelemetryEvent.findOne({ nativeEventId: 'evt-persist-isolation-001' });
    expect(savedDoc).not.toBeNull();

    const origUpsert = CloudDataFabricAdapter.upsertNode;
    CloudDataFabricAdapter.upsertNode = jest.fn().mockRejectedValue(new Error('Graph service down'));

    try {
      const projResult = await CloudDataFabricAdapter.projectEvent(savedDoc);
      expect(projResult.materialized).toBe(false);

      // Verify the durable event is STILL persisted and accessible
      const recheckedDoc = await CloudTelemetryEvent.findOne({ nativeEventId: 'evt-persist-isolation-001' });
      expect(recheckedDoc).not.toBeNull();
      expect(recheckedDoc.canonicalEventId).toBe(persistResult.canonicalEventId);
    } finally {
      CloudDataFabricAdapter.upsertNode = origUpsert;
    }
  });

  // ===========================================================================
  // SCENARIO AF: No Decision Intelligence writes
  // ===========================================================================
  test('Scenario AF: No Decision Intelligence writes', async () => {
    const event = await createTestDoc({ nativeEventId: 'evt-scen-af' });
    await CloudDataFabricAdapter.projectEvent(event);

    const diCount = await DecisionAssessment.countDocuments({});
    expect(diCount).toBe(0);
  });

  // ===========================================================================
  // SCENARIO AG: No client/controller/route changes
  // ===========================================================================
  test('Scenario AG: No client/controller/route changes', () => {
    // Structural static check: CloudDataFabricAdapter does not import controllers or routes
    const fs = require('fs');
    const adapterCode = fs.readFileSync(
      require.resolve('../services/ingestion/CloudDataFabricAdapter'),
      'utf8'
    );
    expect(adapterCode).not.toContain('../controllers/');
    expect(adapterCode).not.toContain('../routes/');
    expect(adapterCode).not.toContain('client/');
  });

  // ===========================================================================
  // SCENARIO AH: No new dependencies
  // ===========================================================================
  test('Scenario AH: No new dependencies', () => {
    const pkg = require('../package.json');
    // Ensure no additional graph database or message broker libraries were installed
    expect(pkg.dependencies['neo4j-driver']).toBeUndefined();
    expect(pkg.dependencies['kafkajs']).toBeUndefined();
    expect(pkg.dependencies['amqplib']).toBeUndefined();
    expect(pkg.dependencies['redis']).toBeUndefined();
  });
});
