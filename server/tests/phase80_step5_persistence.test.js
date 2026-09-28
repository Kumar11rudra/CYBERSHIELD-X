/**
 * 🛡️ CyberShield X — Phase 80 Step 5 Test Suite
 *
 * Synchronous Persistence & Idempotency Service Test Battery:
 * Tests A through R covering durable creation, exact duplicate preservation,
 * concurrent race condition handling, non-duplicate MongoDB failure handling,
 * tenant isolation, provider/account binding, and Data Fabric isolation.
 */

'use strict';

const mongoose = require('mongoose');
const { CloudPersistenceService, PERSISTENCE_STATUS } = require('../services/ingestion/CloudPersistenceService');
const CloudTelemetryEvent = require('../models/CloudTelemetryEvent');
const SecurityGraphNode = require('../models/SecurityGraphNode');
const SecurityGraphEdge = require('../models/SecurityGraphEdge');
const DecisionAssessment = require('../models/DecisionAssessment');
const logger = require('../utils/logger');
const { connectTestDb, closeTestDb } = require('./helpers/testDbHelper');

describe('Phase 80 Step 5 — Synchronous Persistence & Idempotency Service', () => {
  const tenantA = 'org-step5-test-a';
  const tenantB = 'org-step5-test-b';

  const defaultVerificationContext = {
    organizationId: tenantA,
    connectorId: 'conn-aws-prod-001',
    provider: 'AWS',
    status: 'VERIFIED',
    enrolledAccountIds: ['123456789012', '987654321098'],
  };

  const sampleNormalizedEvent = {
    provider: 'AWS',
    nativeEventId: 'evt-step5-001',
    cloudAccountId: '123456789012',
    region: 'us-east-1',
    eventTime: new Date('2026-09-17T09:00:00Z'),
    organizationId: tenantA,
    connectorId: 'conn-aws-prod-001',
    signatureStatus: 'VERIFIED',
    actor: {
      principalId: 'AIDAEXAMPLEUSER',
      principalType: 'IAMUser',
      principalName: 'Alice',
      username: 'Alice',
      callerIp: '198.51.100.42',
    },
    action: {
      name: 'CreateUser',
      operation: 'CreateUser',
      service: 'iam',
      category: 'MUTATING_SECURITY',
      tier: 1,
      isMutating: true,
    },
    resources: [
      {
        resourceType: 'AWS::IAM::User',
        resourceId: 'arn:aws:iam::123456789012:user/Bob',
        resourceName: 'Bob',
      },
    ],
    outcome: 'SUCCESS',
    severity: 'MEDIUM',
    rawPayloadHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    parameters: { userName: 'Bob' },
  };

  const cleanup = async () => {
    await CloudTelemetryEvent.deleteMany({
      organizationId: { $in: [tenantA, tenantB] },
    });
  };

  beforeAll(async () => {
    await connectTestDb();
    // Ensure compound unique indexes are built in MongoDB
    await CloudTelemetryEvent.init();
    await cleanup();
  });

  afterEach(async () => {
    await cleanup();
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    await cleanup();
    await closeTestDb();
  });

  // ---------------------------------------------------------------------------
  // TEST A: Successful event creation
  // ---------------------------------------------------------------------------
  test('TEST A: Successful event creation persists record with CREATED status', async () => {
    const res = await CloudPersistenceService.persist(sampleNormalizedEvent, defaultVerificationContext);

    expect(res.status).toBe(PERSISTENCE_STATUS.CREATED);
    expect(res.isDuplicate).toBe(false);
    expect(res.canonicalEventId).toBe(`CLOUD-AWS-${tenantA}-evt-step5-001`);
    expect(res.nativeEventId).toBe('evt-step5-001');

    // Verify durable persistence in MongoDB
    const doc = await CloudTelemetryEvent.findOne({
      organizationId: tenantA,
      provider: 'AWS',
      nativeEventId: 'evt-step5-001',
    });
    expect(doc).not.toBeNull();
    expect(doc.canonicalEventId).toBe(`CLOUD-AWS-${tenantA}-evt-step5-001`);
    expect(doc.cloudAccountId).toBe('123456789012');
    expect(doc.action.operation).toBe('CreateUser');
    expect(doc.action.tier).toBe(1);
    expect(doc.graphMaterialized).toBe(false);
    expect(doc.projectionStatus).toBe('PENDING');
  });

  // ---------------------------------------------------------------------------
  // TEST B: Durable commit semantics
  // ---------------------------------------------------------------------------
  test('TEST B: Durable commit semantics - resolves only after MongoDB persistence completes', async () => {
    let writeCompleted = false;

    const originalCreate = CloudTelemetryEvent.create;
    jest.spyOn(CloudTelemetryEvent, 'create').mockImplementation(async (data) => {
      const result = await originalCreate.call(CloudTelemetryEvent, data);
      writeCompleted = true;
      return result;
    });

    const res = await CloudPersistenceService.persist(sampleNormalizedEvent, defaultVerificationContext);
    expect(res.status).toBe(PERSISTENCE_STATUS.CREATED);
    expect(writeCompleted).toBe(true);
  });

  // ---------------------------------------------------------------------------
  // TEST C: Exact duplicate
  // ---------------------------------------------------------------------------
  test('TEST C: Exact duplicate returns DUPLICATE status and leaves single record in database', async () => {
    const firstRes = await CloudPersistenceService.persist(sampleNormalizedEvent, defaultVerificationContext);
    expect(firstRes.status).toBe(PERSISTENCE_STATUS.CREATED);

    const secondRes = await CloudPersistenceService.persist(sampleNormalizedEvent, defaultVerificationContext);
    expect(secondRes.status).toBe(PERSISTENCE_STATUS.DUPLICATE);
    expect(secondRes.isDuplicate).toBe(true);
    expect(secondRes.canonicalEventId).toBe(firstRes.canonicalEventId);

    const count = await CloudTelemetryEvent.countDocuments({
      organizationId: tenantA,
      provider: 'AWS',
      nativeEventId: 'evt-step5-001',
    });
    expect(count).toBe(1);
  });

  // ---------------------------------------------------------------------------
  // TEST D: Concurrent duplicate race (E11000 handling)
  // ---------------------------------------------------------------------------
  test('TEST D: Concurrent duplicate race - E11000 duplicate-key resolves gracefully to DUPLICATE', async () => {
    // 1. First insert creates document
    await CloudPersistenceService.persist(sampleNormalizedEvent, defaultVerificationContext);

    // 2. Mock findOne pre-check to simulate race condition (returning null as if document did not exist yet)
    const originalFindOne = CloudTelemetryEvent.findOne;
    let findOneCallCount = 0;
    jest.spyOn(CloudTelemetryEvent, 'findOne').mockImplementation((query) => {
      findOneCallCount++;
      if (findOneCallCount === 1) {
        // Pre-check misses
        return {
          lean: async () => null,
        };
      }
      // Subsequent call (in race error handler) succeeds
      return originalFindOne.call(CloudTelemetryEvent, query);
    });

    // 3. Attempt insertion - will hit MongoDB unique index collision (E11000)
    const res = await CloudPersistenceService.persist(sampleNormalizedEvent, defaultVerificationContext);

    expect(res.status).toBe(PERSISTENCE_STATUS.DUPLICATE);
    expect(res.isDuplicate).toBe(true);
    expect(res.canonicalEventId).toBe(`CLOUD-AWS-${tenantA}-evt-step5-001`);
  });

  // ---------------------------------------------------------------------------
  // TEST E: Non-duplicate MongoDB failure
  // ---------------------------------------------------------------------------
  test('TEST E: Non-duplicate MongoDB failure returns PERSISTENCE_FAILURE without swallowing error', async () => {
    jest.spyOn(CloudTelemetryEvent, 'create').mockRejectedValueOnce(
      new Error('MongoNetworkTimeoutException: connection closed by server')
    );

    const res = await CloudPersistenceService.persist(sampleNormalizedEvent, defaultVerificationContext);

    expect(res.status).toBe(PERSISTENCE_STATUS.PERSISTENCE_FAILURE);
    expect(res.error).toContain('MongoNetworkTimeoutException');
    expect(res.code).toBe('DB_ERROR');
  });

  // ---------------------------------------------------------------------------
  // TEST F: Tenant mismatch
  // ---------------------------------------------------------------------------
  test('TEST F: Tenant mismatch rejects event and creates zero documents', async () => {
    const maliciousEvent = {
      ...sampleNormalizedEvent,
      organizationId: 'malicious-org-attacker',
    };

    const res = await CloudPersistenceService.persist(maliciousEvent, defaultVerificationContext);

    expect(res.status).toBe(PERSISTENCE_STATUS.REJECTED);
    expect(res.reason).toBe('TENANT_MISMATCH');

    const count = await CloudTelemetryEvent.countDocuments({ nativeEventId: sampleNormalizedEvent.nativeEventId });
    expect(count).toBe(0);
  });

  // ---------------------------------------------------------------------------
  // TEST G: Missing authenticated tenant
  // ---------------------------------------------------------------------------
  test('TEST G: Missing authenticated tenant rejects event', async () => {
    const unauthenticatedContext = {
      ...defaultVerificationContext,
      organizationId: null,
    };

    const res = await CloudPersistenceService.persist(sampleNormalizedEvent, unauthenticatedContext);

    expect(res.status).toBe(PERSISTENCE_STATUS.REJECTED);
    expect(res.reason).toBe('UNAUTHENTICATED_TENANT');
  });

  // ---------------------------------------------------------------------------
  // TEST H: Provider mismatch
  // ---------------------------------------------------------------------------
  test('TEST H: Provider mismatch between verification context and event rejects persistence', async () => {
    const mismatchedContext = {
      ...defaultVerificationContext,
      provider: 'GCP',
    };

    const res = await CloudPersistenceService.persist(sampleNormalizedEvent, mismatchedContext);

    expect(res.status).toBe(PERSISTENCE_STATUS.REJECTED);
    expect(res.reason).toBe('PROVIDER_MISMATCH');
  });

  // ---------------------------------------------------------------------------
  // TEST I: Unauthorized cloud account
  // ---------------------------------------------------------------------------
  test('TEST I: Cloud account not in enrolled list rejects persistence', async () => {
    const unenrolledAccountEvent = {
      ...sampleNormalizedEvent,
      cloudAccountId: '999999999999', // Not in [123456789012, 987654321098]
    };

    const res = await CloudPersistenceService.persist(unenrolledAccountEvent, defaultVerificationContext);

    expect(res.status).toBe(PERSISTENCE_STATUS.REJECTED);
    expect(res.reason).toBe('CLOUD_ACCOUNT_MISMATCH');
  });

  // ---------------------------------------------------------------------------
  // TEST J: Canonical ID integrity
  // ---------------------------------------------------------------------------
  test('TEST J: Canonical ID integrity correctly derives CLOUD-{PROVIDER}-{ORG}-{NATIVE_ID}', () => {
    const derivedId = CloudPersistenceService.generateCanonicalEventId('AWS', tenantA, 'evt-12345');
    expect(derivedId).toBe(`CLOUD-AWS-${tenantA}-evt-12345`);
  });

  // ---------------------------------------------------------------------------
  // TEST K: Conflicting canonical ID
  // ---------------------------------------------------------------------------
  test('TEST K: Conflicting canonical ID in event is rejected to prevent identity corruption', async () => {
    const conflictingEvent = {
      ...sampleNormalizedEvent,
      canonicalEventId: 'CLOUD-AWS-WRONGORG-spoofed-id',
    };

    const res = await CloudPersistenceService.persist(conflictingEvent, defaultVerificationContext);

    expect(res.status).toBe(PERSISTENCE_STATUS.REJECTED);
    expect(res.reason).toBe('CANONICAL_ID_MISMATCH');
  });

  // ---------------------------------------------------------------------------
  // TEST L: Existing duplicate preservation
  // ---------------------------------------------------------------------------
  test('TEST L: Existing duplicate preservation - retransmission does not mutate stored record', async () => {
    // Initial insert with original values
    await CloudPersistenceService.persist(sampleNormalizedEvent, defaultVerificationContext);

    // Retransmitted payload with altered severity, parameters, and time
    const mutatedRetransmission = {
      ...sampleNormalizedEvent,
      severity: 'CRITICAL',
      eventTime: new Date('2026-09-17T12:00:00Z'),
      parameters: { mutatedKey: 'tampered-data' },
    };

    const duplicateRes = await CloudPersistenceService.persist(mutatedRetransmission, defaultVerificationContext);
    expect(duplicateRes.status).toBe(PERSISTENCE_STATUS.DUPLICATE);

    // Verify stored document remained 100% original
    const storedDoc = await CloudTelemetryEvent.findOne({
      organizationId: tenantA,
      provider: 'AWS',
      nativeEventId: 'evt-step5-001',
    });

    expect(storedDoc.severity).toBe('MEDIUM');
    expect(storedDoc.eventTime.toISOString()).toBe('2026-09-17T09:00:00.000Z');
    expect(storedDoc.parameters.userName).toBe('Bob');
    expect(storedDoc.parameters.mutatedKey).toBeUndefined();
  });

  // ---------------------------------------------------------------------------
  // TEST M: Compound uniqueness
  // ---------------------------------------------------------------------------
  test('TEST M: Compound uniqueness index protects across { organizationId, provider, nativeEventId }', async () => {
    await CloudPersistenceService.persist(sampleNormalizedEvent, defaultVerificationContext);

    // Different provider, same org + nativeEventId -> permitted
    const gcpEvent = {
      ...sampleNormalizedEvent,
      provider: 'GCP',
      cloudAccountId: 'project-sec-999',
    };
    const gcpContext = {
      organizationId: tenantA,
      connectorId: 'conn-gcp-001',
      provider: 'GCP',
      enrolledAccountIds: ['project-sec-999'],
    };

    const gcpRes = await CloudPersistenceService.persist(gcpEvent, gcpContext);
    expect(gcpRes.status).toBe(PERSISTENCE_STATUS.CREATED);

    const totalDocs = await CloudTelemetryEvent.countDocuments({ organizationId: tenantA });
    expect(totalDocs).toBe(2);
  });

  // ---------------------------------------------------------------------------
  // TEST N: Cross-tenant same nativeEventId
  // ---------------------------------------------------------------------------
  test('TEST N: Cross-tenant same nativeEventId does NOT collide and maintains isolation', async () => {
    // Persist for Tenant A
    const resA = await CloudPersistenceService.persist(sampleNormalizedEvent, defaultVerificationContext);
    expect(resA.status).toBe(PERSISTENCE_STATUS.CREATED);

    // Persist for Tenant B with identical nativeEventId
    const tenantBContext = {
      organizationId: tenantB,
      connectorId: 'conn-aws-tenantB',
      provider: 'AWS',
      enrolledAccountIds: ['123456789012'],
    };
    const tenantBEvent = {
      ...sampleNormalizedEvent,
      organizationId: tenantB,
    };

    const resB = await CloudPersistenceService.persist(tenantBEvent, tenantBContext);
    expect(resB.status).toBe(PERSISTENCE_STATUS.CREATED);

    // Verify two separate records exist, one per tenant
    const docA = await CloudTelemetryEvent.findOne({ organizationId: tenantA, nativeEventId: 'evt-step5-001' });
    const docB = await CloudTelemetryEvent.findOne({ organizationId: tenantB, nativeEventId: 'evt-step5-001' });

    expect(docA).not.toBeNull();
    expect(docB).not.toBeNull();
    expect(docA._id.toString()).not.toBe(docB._id.toString());
    expect(docA.canonicalEventId).toBe(`CLOUD-AWS-${tenantA}-evt-step5-001`);
    expect(docB.canonicalEventId).toBe(`CLOUD-AWS-${tenantB}-evt-step5-001`);
  });

  // ---------------------------------------------------------------------------
  // TEST O: No Data Fabric activity
  // ---------------------------------------------------------------------------
  test('TEST O: Step 5 executes ZERO Data Fabric graph writes', async () => {
    const nodeSaveSpy = jest.spyOn(SecurityGraphNode.prototype, 'save');
    const nodeCreateSpy = jest.spyOn(SecurityGraphNode, 'create');
    const edgeSaveSpy = jest.spyOn(SecurityGraphEdge.prototype, 'save');
    const edgeCreateSpy = jest.spyOn(SecurityGraphEdge, 'create');

    const res = await CloudPersistenceService.persist(sampleNormalizedEvent, defaultVerificationContext);
    expect(res.status).toBe(PERSISTENCE_STATUS.CREATED);

    expect(nodeSaveSpy).not.toHaveBeenCalled();
    expect(nodeCreateSpy).not.toHaveBeenCalled();
    expect(edgeSaveSpy).not.toHaveBeenCalled();
    expect(edgeCreateSpy).not.toHaveBeenCalled();
  });

  // ---------------------------------------------------------------------------
  // TEST P: No Decision Intelligence activity
  // ---------------------------------------------------------------------------
  test('TEST P: Step 5 executes ZERO Decision Intelligence writes', async () => {
    const diSaveSpy = jest.spyOn(DecisionAssessment.prototype, 'save');
    const diCreateSpy = jest.spyOn(DecisionAssessment, 'create');

    const res = await CloudPersistenceService.persist(sampleNormalizedEvent, defaultVerificationContext);
    expect(res.status).toBe(PERSISTENCE_STATUS.CREATED);

    expect(diSaveSpy).not.toHaveBeenCalled();
    expect(diCreateSpy).not.toHaveBeenCalled();
  });

  // ---------------------------------------------------------------------------
  // TEST Q: Sensitive logging verification
  // ---------------------------------------------------------------------------
  test('TEST Q: Sensitive data and raw payloads are not written to logs', async () => {
    const loggerSpy = jest.spyOn(logger, 'error');
    const warnSpy = jest.spyOn(logger, 'warn');

    // Trigger persistence failure
    jest.spyOn(CloudTelemetryEvent, 'create').mockRejectedValueOnce(
      new Error('DB Write Failure')
    );

    const sensitiveEvent = {
      ...sampleNormalizedEvent,
      parameters: {
        password: 'LeakedPassword123!',
        token: 'SecretTokenValue999',
      },
    };

    await CloudPersistenceService.persist(sensitiveEvent, defaultVerificationContext);

    const allLogCalls = [...loggerSpy.mock.calls, ...warnSpy.mock.calls];
    const logString = JSON.stringify(allLogCalls);

    expect(logString).not.toContain('LeakedPassword123!');
    expect(logString).not.toContain('SecretTokenValue999');
  });

  // ---------------------------------------------------------------------------
  // TEST R: Error classification
  // ---------------------------------------------------------------------------
  test('TEST R: Error classification distinguishes DUPLICATE from PERSISTENCE_FAILURE', async () => {
    // 1. Duplicate error maps to DUPLICATE
    await CloudPersistenceService.persist(sampleNormalizedEvent, defaultVerificationContext);
    const dupRes = await CloudPersistenceService.persist(sampleNormalizedEvent, defaultVerificationContext);
    expect(dupRes.status).toBe(PERSISTENCE_STATUS.DUPLICATE);

    // 2. Generic DB error maps to PERSISTENCE_FAILURE
    jest.spyOn(CloudTelemetryEvent, 'create').mockRejectedValueOnce(new Error('MongooseServerSelectionError'));
    const uniqueEvent = { ...sampleNormalizedEvent, nativeEventId: 'evt-unique-err' };
    const errRes = await CloudPersistenceService.persist(uniqueEvent, defaultVerificationContext);
    expect(errRes.status).toBe(PERSISTENCE_STATUS.PERSISTENCE_FAILURE);
  });
});
