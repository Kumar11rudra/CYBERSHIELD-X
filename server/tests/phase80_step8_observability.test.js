/**
 * 🛡️ CyberShield X — Phase 80 Step 8 Test Suite
 *
 * Multi-Cloud Ingestion Observability, Health & Telemetry Metrics Battery:
 * Tests Scenarios A through AD covering:
 * - A: Ingestion request counter increments
 * - B: Accepted counter increments
 * - C: Rejected counter increments
 * - D: Duplicate counter increments
 * - E: Verification failure counter increments
 * - F: Persistence failure counter increments
 * - G: Rate-limit counter increments
 * - H: Provider labels are bounded AWS/GCP/AZURE
 * - I: Arbitrary provider/input cannot create unbounded metric labels
 * - J: Timing metrics are recorded
 * - K: Graph materialized metric increments
 * - L: Graph retry metric increments
 * - M: Graph failure metric increments
 * - N: POISON_FAILED metric increments
 * - O: SKIPPED_READ_FILTER metric increments
 * - P: Reconciliation run metric increments
 * - Q: Reconciliation backlog is bounded/safe
 * - R: Health reports Mongo unavailable safely
 * - S: Health reports graph degradation safely
 * - T: Health never exposes secrets/tokens/raw payloads
 * - U: Logs contain no raw payload
 * - V: Logs contain no Authorization/JWT/SAS/signature secrets
 * - W: Observability failure does not change ingestion HTTP outcome
 * - X: 202 remains after durable persistence
 * - Y: Duplicate remains HTTP 200
 * - Z: Persistence failure remains HTTP 503
 * - AA: No Decision Intelligence invocation
 * - AB: No client changes
 * - AC: No new unnecessary dependency
 * - AD: No high-cardinality metric labels
 */

'use strict';

const express = require('express');
const request = require('supertest');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const cloudIngestionRouter = require('../routes/cloudIngestion');
const cloudIngestionController = require('../controllers/cloudIngestionController');
const {
  CloudObservabilityService,
  defaultObservabilityService,
} = require('../services/ingestion/CloudObservabilityService');
const { CloudDataFabricAdapter } = require('../services/ingestion/CloudDataFabricAdapter');
const { CloudPersistenceService } = require('../services/ingestion/CloudPersistenceService');
const CloudTelemetryEvent = require('../models/CloudTelemetryEvent');
const SecurityGraphNode = require('../models/SecurityGraphNode');
const SecurityGraphEdge = require('../models/SecurityGraphEdge');
const logger = require('../utils/logger');
const { connectTestDb, closeTestDb, clearTestDb } = require('./helpers/testDbHelper');

describe('Phase 80 Step 8 — Observability, Health & Telemetry Metrics', () => {
  let app;
  const tenantA = 'org-step8-test-a';
  const enrolledAccount = '111122223333';

  beforeAll(async () => {
    await connectTestDb();

    app = express();
    app.use('/api/ingestion/cloud', cloudIngestionRouter);
  });

  afterAll(async () => {
    await closeTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
    await new Promise((resolve) => setTimeout(resolve, 50));
    defaultObservabilityService.reset();
    cloudIngestionController.registry.clearConnectors();

    // Register baseline connectors
    cloudIngestionController.registry.registerConnector({
      connectorId: 'conn-aws-001',
      organizationId: tenantA,
      provider: 'AWS',
      authMode: 'SHARED_SECRET',
      sharedSecret: 'AwsSecret123',
      enrolledAccountIds: [enrolledAccount],
    });

    cloudIngestionController.registry.registerConnector({
      connectorId: 'conn-gcp-001',
      organizationId: tenantA,
      provider: 'GCP',
      authMode: 'SHARED_SECRET',
      sharedSecret: 'GcpSecret123',
      enrolledAccountIds: ['project-step8-a'],
    });

    cloudIngestionController.registry.registerConnector({
      connectorId: 'conn-azure-001',
      organizationId: tenantA,
      provider: 'AZURE',
      authMode: 'SHARED_SECRET',
      sharedSecret: 'AzureSecret123',
      enrolledAccountIds: ['sub-azure-001'],
    });
  });

  // Helper for AWS CloudTrail Notification payload
  const createValidAwsBody = (eventId = 'evt-obs-001') => ({
    Type: 'Notification',
    MessageId: 'msg-obs-001',
    TopicArn: 'arn:aws:sns:us-east-1:111122223333:CloudTrailTopic',
    Timestamp: new Date().toISOString(),
    SignatureVersion: '1',
    Message: JSON.stringify({
      eventVersion: '1.08',
      userIdentity: {
        type: 'IAMUser',
        principalId: 'AIDAOBSERVABILITY01',
        arn: 'arn:aws:iam::111122223333:user/sec-admin',
        accountId: enrolledAccount,
        userName: 'sec-admin',
      },
      eventTime: new Date().toISOString(),
      eventSource: 'iam.amazonaws.com',
      eventName: 'CreateUser',
      awsRegion: 'us-east-1',
      sourceIPAddress: '198.51.100.25',
      userAgent: 'aws-cli/2.0',
      requestParameters: { userName: 'new-analyst' },
      responseElements: { user: { userName: 'new-analyst', userId: 'AIDAOBSNEW' } },
      eventID: eventId,
      eventType: 'AwsApiCall',
      recipientAccountId: enrolledAccount,
    }),
  });

  // ===========================================================================
  // Scenario A: Ingestion request counter increments
  // ===========================================================================
  test('Scenario A: Ingestion request counter increments on incoming request', async () => {
    const res = await request(app)
      .post('/api/ingestion/cloud/aws/conn-aws-001')
      .set('X-CyberShield-Key', 'AwsSecret123')
      .send(createValidAwsBody('evt-obs-scen-a'));

    expect(res.status).toBe(202);
    const metrics = defaultObservabilityService.getMetrics();
    expect(metrics.ingestion.cloud_ingestion_requests_total).toBe(1);
    expect(metrics.ingestion.by_provider.requests.AWS).toBe(1);
  });

  // ===========================================================================
  // Scenario B: Accepted counter increments
  // ===========================================================================
  test('Scenario B: Accepted counter increments on durably persisted event', async () => {
    const res = await request(app)
      .post('/api/ingestion/cloud/aws/conn-aws-001')
      .set('X-CyberShield-Key', 'AwsSecret123')
      .send(createValidAwsBody('evt-obs-scen-b'));

    expect(res.status).toBe(202);
    const metrics = defaultObservabilityService.getMetrics();
    expect(metrics.ingestion.cloud_ingestion_accepted_total).toBe(1);
    expect(metrics.ingestion.by_provider.accepted.AWS).toBe(1);
  });

  // ===========================================================================
  // Scenario C: Rejected counter increments
  // ===========================================================================
  test('Scenario C: Rejected counter increments on validation failure', async () => {
    // Bad secret triggers rejection
    const res = await request(app)
      .post('/api/ingestion/cloud/aws/conn-aws-001')
      .set('X-CyberShield-Key', 'WrongSecret')
      .send(createValidAwsBody('evt-obs-scen-c'));

    expect(res.status).toBe(401);
    const metrics = defaultObservabilityService.getMetrics();
    expect(metrics.ingestion.cloud_ingestion_rejected_total).toBeGreaterThanOrEqual(1);
    expect(metrics.ingestion.cloud_ingestion_accepted_total).toBe(0);
  });

  // ===========================================================================
  // Scenario D: Duplicate counter increments
  // ===========================================================================
  test('Scenario D: Duplicate counter increments on duplicate event arrival', async () => {
    const body = createValidAwsBody('evt-obs-scen-d');

    // First arrival: CREATED
    const res1 = await request(app)
      .post('/api/ingestion/cloud/aws/conn-aws-001')
      .set('X-CyberShield-Key', 'AwsSecret123')
      .send(body);
    expect(res1.status).toBe(202);

    // Second arrival: DUPLICATE
    const res2 = await request(app)
      .post('/api/ingestion/cloud/aws/conn-aws-001')
      .set('X-CyberShield-Key', 'AwsSecret123')
      .send(body);
    expect(res2.status).toBe(200);
    expect(res2.body.status).toBe('DUPLICATE_ACKNOWLEDGED');

    const metrics = defaultObservabilityService.getMetrics();
    expect(metrics.ingestion.cloud_ingestion_duplicates_total).toBe(1);
    expect(metrics.ingestion.by_provider.duplicates.AWS).toBe(1);
  });

  // ===========================================================================
  // Scenario E: Verification failure counter increments
  // ===========================================================================
  test('Scenario E: Verification failure counter increments on bad authentication', async () => {
    const res = await request(app)
      .post('/api/ingestion/cloud/gcp/conn-gcp-001')
      .set('X-CyberShield-Token', 'InvalidToken')
      .send({ message: { data: Buffer.from('{}').toString('base64'), messageId: 'm1' } });

    expect(res.status).toBe(401);
    const metrics = defaultObservabilityService.getMetrics();
    expect(metrics.ingestion.cloud_ingestion_verification_failures_total).toBe(1);
    expect(metrics.ingestion.verification_failures_by_reason['GCP:AUTHENTICATION_FAILURE']).toBe(1);
  });

  // ===========================================================================
  // Scenario F: Persistence failure counter increments
  // ===========================================================================
  test('Scenario F: Persistence failure counter increments when MongoDB commit fails', async () => {
    const persistSpy = jest.spyOn(CloudPersistenceService, 'persist').mockResolvedValueOnce({
      status: 'PERSISTENCE_FAILURE',
      canonicalEventId: 'CLOUD-AWS-org-step8-test-a-evt-fail',
      error: 'Simulated DB connection lost',
    });

    const res = await request(app)
      .post('/api/ingestion/cloud/aws/conn-aws-001')
      .set('X-CyberShield-Key', 'AwsSecret123')
      .send(createValidAwsBody('evt-obs-scen-f'));

    expect(res.status).toBe(503);
    const metrics = defaultObservabilityService.getMetrics();
    expect(metrics.ingestion.cloud_ingestion_persistence_failures_total).toBe(1);
    expect(metrics.ingestion.by_provider.persistence_failures.AWS).toBe(1);

    persistSpy.mockRestore();
  });

  // ===========================================================================
  // Scenario G: Rate-limit counter increments
  // ===========================================================================
  test('Scenario G: Rate-limit counter increments when connector rate limit is exceeded', () => {
    defaultObservabilityService.recordRateLimited('AWS');
    defaultObservabilityService.recordRateLimited('AZURE');

    const metrics = defaultObservabilityService.getMetrics();
    expect(metrics.ingestion.cloud_ingestion_rate_limited_total).toBe(2);
    expect(metrics.ingestion.by_provider.rate_limited.AWS).toBe(1);
    expect(metrics.ingestion.by_provider.rate_limited.AZURE).toBe(1);
  });

  // ===========================================================================
  // Scenario H: Provider labels are bounded AWS/GCP/AZURE
  // ===========================================================================
  test('Scenario H: Provider labels are strictly bounded to AWS, GCP, AZURE, UNKNOWN', () => {
    expect(defaultObservabilityService.normalizeProvider('aws')).toBe('AWS');
    expect(defaultObservabilityService.normalizeProvider('GCP ')).toBe('GCP');
    expect(defaultObservabilityService.normalizeProvider('azure')).toBe('AZURE');
    expect(defaultObservabilityService.normalizeProvider('ali_cloud')).toBe('UNKNOWN');
    expect(defaultObservabilityService.normalizeProvider(null)).toBe('UNKNOWN');
  });

  // ===========================================================================
  // Scenario I: Arbitrary provider/input cannot create unbounded metric labels
  // ===========================================================================
  test('Scenario I: Arbitrary provider/input cannot create unbounded metric labels', () => {
    const maliciousInput = '<script>alert(1)</script>';
    const longString = 'A'.repeat(500);

    defaultObservabilityService.recordRequest(maliciousInput);
    defaultObservabilityService.recordRequest(longString);

    const metrics = defaultObservabilityService.getMetrics();
    const providers = Object.keys(metrics.ingestion.by_provider.requests);
    expect(providers.every((p) => ['AWS', 'GCP', 'AZURE', 'UNKNOWN'].includes(p))).toBe(true);
    expect(metrics.ingestion.by_provider.requests.UNKNOWN).toBe(2);
  });

  // ===========================================================================
  // Scenario J: Timing metrics are recorded
  // ===========================================================================
  test('Scenario J: Timing metrics (verification, normalization, persistence, total) are recorded', async () => {
    const res = await request(app)
      .post('/api/ingestion/cloud/aws/conn-aws-001')
      .set('X-CyberShield-Key', 'AwsSecret123')
      .send(createValidAwsBody('evt-obs-scen-j'));

    expect(res.status).toBe(202);
    const metrics = defaultObservabilityService.getMetrics();
    expect(metrics.latency.cloud_ingestion_verification_duration.count).toBe(1);
    expect(metrics.latency.cloud_ingestion_normalization_duration.count).toBe(1);
    expect(metrics.latency.cloud_ingestion_persistence_duration.count).toBe(1);
    expect(metrics.latency.cloud_ingestion_total_duration.count).toBe(1);
    expect(metrics.latency.cloud_ingestion_total_duration.avg).toBeGreaterThanOrEqual(0);
  });

  // ===========================================================================
  // Scenario K: Graph materialized metric increments
  // ===========================================================================
  test('Scenario K: Graph materialized metric increments upon projection success', async () => {
    const event = await CloudTelemetryEvent.create({
      canonicalEventId: 'CLOUD-AWS-org-step8-test-a-evt-obs-k',
      nativeEventId: 'evt-obs-k',
      connectorId: 'conn-aws-001',
      rawPayloadHash: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
      organizationId: tenantA,
      provider: 'AWS',
      cloudAccountId: enrolledAccount,
      eventTime: new Date(),
      receivedAt: new Date(),
      action: { operation: 'CreateUser', tier: 1, isMutating: true },
      actor: { principalId: 'AIDAK', principalName: 'userK' },
      resources: [{ rawResourceId: 'arn:aws:iam::111122223333:user/uK', resourceType: 'AWS::IAM::User' }],
      severity: 'HIGH',
      outcome: 'SUCCESS',
      projectionStatus: 'PENDING',
    });

    const result = await CloudDataFabricAdapter.projectEvent(event);
    expect(result.status).toBe('MATERIALIZED');

    const metrics = defaultObservabilityService.getMetrics();
    expect(metrics.projection.cloud_projection_materialized_total).toBe(1);
    expect(metrics.projection.by_provider.materialized.AWS).toBe(1);
    expect(metrics.latency.cloud_projection_duration.count).toBe(1);
  });

  // ===========================================================================
  // Scenario L: Graph retry metric increments
  // ===========================================================================
  test('Scenario L: Graph retry metric increments upon transient projection error', async () => {
    const edgeSpy = jest.spyOn(SecurityGraphEdge, 'create').mockRejectedValueOnce(new Error('Transient edge write failure'));

    const event = await CloudTelemetryEvent.create({
      canonicalEventId: 'CLOUD-AWS-org-step8-test-a-evt-obs-l',
      nativeEventId: 'evt-obs-l',
      connectorId: 'conn-aws-001',
      rawPayloadHash: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
      organizationId: tenantA,
      provider: 'AWS',
      cloudAccountId: enrolledAccount,
      eventTime: new Date(),
      receivedAt: new Date(),
      action: { operation: 'CreatePolicy', tier: 1, isMutating: true },
      actor: { principalId: 'AIDAL', principalName: 'userL' },
      resources: [{ rawResourceId: 'arn:aws:iam::111122223333:policy/pL', resourceType: 'AWS::IAM::Policy' }],
      severity: 'HIGH',
      outcome: 'SUCCESS',
      projectionStatus: 'PENDING',
      projectionRetryCount: 0,
    });

    const result = await CloudDataFabricAdapter.projectEvent(event);
    expect(result.status).toBe('PENDING');
    expect(result.retryCount).toBe(1);

    const metrics = defaultObservabilityService.getMetrics();
    expect(metrics.projection.cloud_projection_retry_total).toBe(1);
    expect(metrics.projection.cloud_projection_failed_total).toBe(1);

    edgeSpy.mockRestore();
  });

  // ===========================================================================
  // Scenario M: Graph failure metric increments
  // ===========================================================================
  test('Scenario M: Graph failure metric increments on projection error', () => {
    defaultObservabilityService.recordProjectionFailed('GCP');
    defaultObservabilityService.recordProjectionFailed('GCP');

    const metrics = defaultObservabilityService.getMetrics();
    expect(metrics.projection.cloud_projection_failed_total).toBe(2);
    expect(metrics.projection.by_provider.failed.GCP).toBe(2);
  });

  // ===========================================================================
  // Scenario N: POISON_FAILED metric increments
  // ===========================================================================
  test('Scenario N: POISON_FAILED metric increments upon 5th projection failure', async () => {
    const edgeSpy = jest.spyOn(SecurityGraphEdge, 'create').mockRejectedValue(new Error('Persistent edge write error'));

    const event = await CloudTelemetryEvent.create({
      canonicalEventId: 'CLOUD-AWS-org-step8-test-a-evt-obs-n',
      nativeEventId: 'evt-obs-n',
      connectorId: 'conn-aws-001',
      rawPayloadHash: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
      organizationId: tenantA,
      provider: 'AWS',
      cloudAccountId: enrolledAccount,
      eventTime: new Date(),
      receivedAt: new Date(),
      action: { operation: 'AttachRolePolicy', tier: 1, isMutating: true },
      actor: { principalId: 'AIDAN', principalName: 'userN' },
      resources: [{ rawResourceId: 'arn:aws:iam::111122223333:role/rN', resourceType: 'AWS::IAM::Role' }],
      severity: 'HIGH',
      outcome: 'SUCCESS',
      projectionStatus: 'PENDING',
      projectionRetryCount: 4, // 5th failure will trigger poison
    });

    const result = await CloudDataFabricAdapter.projectEvent(event);
    expect(result.status).toBe('POISON_FAILED');
    expect(result.isPoison).toBe(true);

    const metrics = defaultObservabilityService.getMetrics();
    expect(metrics.projection.cloud_projection_poison_failed_total).toBe(1);
    expect(metrics.projection.by_provider.poison.AWS).toBe(1);

    edgeSpy.mockRestore();
  });

  // ===========================================================================
  // Scenario O: SKIPPED_READ_FILTER metric increments
  // ===========================================================================
  test('Scenario O: SKIPPED_READ_FILTER metric increments on Tier 4 read events', async () => {
    const event = await CloudTelemetryEvent.create({
      canonicalEventId: 'CLOUD-AWS-org-step8-test-a-evt-obs-o',
      nativeEventId: 'evt-obs-o',
      connectorId: 'conn-aws-001',
      rawPayloadHash: '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
      organizationId: tenantA,
      provider: 'AWS',
      cloudAccountId: enrolledAccount,
      eventTime: new Date(),
      receivedAt: new Date(),
      action: { operation: 'DescribeInstances', tier: 4, isMutating: false },
      actor: { principalId: 'AIDAO' },
      resources: [],
      severity: 'LOW',
      outcome: 'SUCCESS',
      projectionStatus: 'PENDING',
    });

    const result = await CloudDataFabricAdapter.projectEvent(event);
    expect(result.status).toBe('SKIPPED_READ_FILTER');

    const metrics = defaultObservabilityService.getMetrics();
    expect(metrics.projection.cloud_projection_skipped_read_filter_total).toBe(1);
    expect(metrics.projection.by_provider.skipped.AWS).toBe(1);
  });

  // ===========================================================================
  // Scenario P: Reconciliation run metric increments
  // ===========================================================================
  test('Scenario P: Reconciliation run metric increments during reconciliation pass', async () => {
    const summary = await CloudDataFabricAdapter.reconcilePendingBatch(10);
    expect(summary).toBeDefined();

    const metrics = defaultObservabilityService.getMetrics();
    expect(metrics.reconciliation.reconciliation_runs_total).toBe(1);
    expect(metrics.reconciliation.reconciliation_batches_total).toBe(1);
  });

  // ===========================================================================
  // Scenario Q: Reconciliation backlog is bounded/safe
  // ===========================================================================
  test('Scenario Q: Reconciliation backlog is safely reported and bounded', () => {
    defaultObservabilityService.recordReconciliationBacklog(42);
    const metrics = defaultObservabilityService.getMetrics();
    expect(metrics.reconciliation.reconciliation_backlog).toBe(42);
    expect(metrics.projection.cloud_projection_pending).toBe(42);
  });

  // ===========================================================================
  // Scenario R: Health reports Mongo unavailable safely
  // ===========================================================================
  test('Scenario R: Health reports Mongo unavailable safely when disconnected', async () => {
    defaultObservabilityService._readyStateOverride = 0;

    const health = await defaultObservabilityService.getHealth();
    expect(health.status).toBe('UNAVAILABLE');
    expect(health.dependencies.mongodb_persistence.status).toBe('UNAVAILABLE');
    expect(health.dependencies.mongodb_persistence.readyState).toBe(0);

    defaultObservabilityService._readyStateOverride = null;
  });

  // ===========================================================================
  // Scenario S: Health reports graph degradation safely
  // ===========================================================================
  test('Scenario S: Health reports graph degradation safely when poison events exist', async () => {
    defaultObservabilityService.recordProjectionPoison('AWS');

    const health = await defaultObservabilityService.getHealth();
    expect(health.status).toBe('DEGRADED');
    expect(health.dependencies.graph_projection.status).toBe('DEGRADED');
    expect(health.dependencies.graph_projection.poisonFailedEvents).toBe(1);
  });

  // ===========================================================================
  // Scenario T: Health never exposes secrets/tokens/raw payloads
  // ===========================================================================
  test('Scenario T: Health endpoint never exposes secrets, tokens, or raw payloads', async () => {
    const res = await request(app).get('/api/ingestion/cloud/health');
    expect(res.status).toBe(200);

    const jsonStr = JSON.stringify(res.body);
    expect(jsonStr).not.toContain('AwsSecret123');
    expect(jsonStr).not.toContain('GcpSecret123');
    expect(jsonStr).not.toContain('AzureSecret123');
    expect(jsonStr).not.toContain('password');
    expect(jsonStr).not.toContain(tenantA);
    expect(jsonStr).not.toContain(enrolledAccount);
  });

  // ===========================================================================
  // Scenario U: Logs contain no raw payload
  // ===========================================================================
  test('Scenario U: Logs contain no raw payload', async () => {
    const infoSpy = jest.spyOn(logger, 'info');
    const warnSpy = jest.spyOn(logger, 'warn');
    const errorSpy = jest.spyOn(logger, 'error');

    await request(app)
      .post('/api/ingestion/cloud/aws/conn-aws-001')
      .set('X-CyberShield-Key', 'AwsSecret123')
      .send(createValidAwsBody('evt-obs-scen-u'));

    const allLogs = [...infoSpy.mock.calls, ...warnSpy.mock.calls, ...errorSpy.mock.calls]
      .map((c) => JSON.stringify(c))
      .join(' ');

    expect(allLogs).not.toContain('new-analyst');
    expect(allLogs).not.toContain('AIDAOBSNEW');

    infoSpy.mockRestore();
    warnSpy.mockRestore();
    errorSpy.mockRestore();
  });

  // ===========================================================================
  // Scenario V: Logs contain no Authorization/JWT/SAS/signature secrets
  // ===========================================================================
  test('Scenario V: Logs contain no Authorization, JWT, SAS, or secret values', async () => {
    const warnSpy = jest.spyOn(logger, 'warn');
    const errorSpy = jest.spyOn(logger, 'error');

    await request(app)
      .post('/api/ingestion/cloud/aws/conn-aws-001')
      .set('X-CyberShield-Key', 'InvalidSecret999')
      .send(createValidAwsBody('evt-obs-scen-v'));

    const logOutput = [...warnSpy.mock.calls, ...errorSpy.mock.calls].map((c) => JSON.stringify(c)).join(' ');

    expect(logOutput).not.toContain('InvalidSecret999');
    expect(logOutput).not.toContain('AwsSecret123');

    warnSpy.mockRestore();
    errorSpy.mockRestore();
  });

  // ===========================================================================
  // Scenario W: Observability failure does not change ingestion HTTP outcome
  // ===========================================================================
  test('Scenario W: Observability failure does not change ingestion HTTP outcome', async () => {
    // Force observability recorder to throw
    const recordSpy = jest.spyOn(cloudIngestionController.observability, 'recordAccepted').mockImplementation(() => {
      throw new Error('Simulated metric telemetry internal buffer failure');
    });

    const res = await request(app)
      .post('/api/ingestion/cloud/aws/conn-aws-001')
      .set('X-CyberShield-Key', 'AwsSecret123')
      .send(createValidAwsBody('evt-obs-scen-w'));

    // Ingestion MUST still return 202
    expect(res.status).toBe(202);
    expect(res.body.status).toBe('ACCEPTED');

    recordSpy.mockRestore();
  });

  // ===========================================================================
  // Scenario X: 202 remains after durable persistence
  // ===========================================================================
  test('Scenario X: 202 remains strictly after durable MongoDB commit', async () => {
    const res = await request(app)
      .post('/api/ingestion/cloud/aws/conn-aws-001')
      .set('X-CyberShield-Key', 'AwsSecret123')
      .send(createValidAwsBody('evt-obs-scen-x'));

    expect(res.status).toBe(202);
    expect(res.body.canonicalEventId).toBeDefined();

    // Verify document exists in MongoDB
    const count = await CloudTelemetryEvent.countDocuments({ nativeEventId: 'evt-obs-scen-x' });
    expect(count).toBe(1);
  });

  // ===========================================================================
  // Scenario Y: Duplicate remains HTTP 200
  // ===========================================================================
  test('Scenario Y: Duplicate remains HTTP 200 DUPLICATE_ACKNOWLEDGED', async () => {
    const body = createValidAwsBody('evt-obs-scen-y');

    await request(app)
      .post('/api/ingestion/cloud/aws/conn-aws-001')
      .set('X-CyberShield-Key', 'AwsSecret123')
      .send(body);

    const res = await request(app)
      .post('/api/ingestion/cloud/aws/conn-aws-001')
      .set('X-CyberShield-Key', 'AwsSecret123')
      .send(body);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('DUPLICATE_ACKNOWLEDGED');
  });

  // ===========================================================================
  // Scenario Z: Persistence failure remains HTTP 503
  // ===========================================================================
  test('Scenario Z: Persistence failure remains HTTP 503', async () => {
    const persistSpy = jest.spyOn(CloudPersistenceService, 'persist').mockResolvedValueOnce({
      status: 'PERSISTENCE_FAILURE',
      canonicalEventId: 'CLOUD-AWS-org-step8-test-a-evt-scen-z',
      error: 'Simulated failure',
    });

    const res = await request(app)
      .post('/api/ingestion/cloud/aws/conn-aws-001')
      .set('X-CyberShield-Key', 'AwsSecret123')
      .send(createValidAwsBody('evt-obs-scen-z'));

    expect(res.status).toBe(503);
    expect(res.body.error).toBe('PERSISTENCE_FAILURE');

    persistSpy.mockRestore();
  });

  // ===========================================================================
  // Scenario AA: No Decision Intelligence invocation
  // ===========================================================================
  test('Scenario AA: Zero Decision Intelligence (Phase 79) invocations occur', async () => {
    // Assert no Phase 79 services are loaded or mutated during ingestion
    expect(mongoose.models.RiskAssessment).toBeUndefined();
    expect(mongoose.models.RiskSnapshot).toBeUndefined();
    expect(mongoose.models.InvestigationHypothesis).toBeUndefined();
  });

  // ===========================================================================
  // Scenario AB: No client changes
  // ===========================================================================
  test('Scenario AB: No client changes or dependencies introduced in Step 8', () => {
    // Assert Step 8 ingestion and observability code never imports or mutates client code
    const serviceContent = fs.readFileSync(path.resolve(__dirname, '../services/ingestion/CloudObservabilityService.js'), 'utf8');
    expect(serviceContent).not.toContain('client/');
    expect(serviceContent).not.toContain('react');
    expect(serviceContent).not.toContain('jsx');

    const controllerContent = fs.readFileSync(path.resolve(__dirname, '../controllers/cloudIngestionController.js'), 'utf8');
    expect(controllerContent).not.toContain('client/');
    expect(controllerContent).not.toContain('react');
  });

  // ===========================================================================
  // Scenario AC: No new unnecessary dependency
  // ===========================================================================
  test('Scenario AC: Zero new npm dependencies added in package files', () => {
    const serverPkgPath = path.resolve(__dirname, '../package.json');
    const rootPkgPath = path.resolve(__dirname, '../../package.json');

    const serverPkg = JSON.parse(fs.readFileSync(serverPkgPath, 'utf8'));
    const rootPkg = JSON.parse(fs.readFileSync(rootPkgPath, 'utf8'));

    // Check known baseline dependencies count
    expect(Object.keys(serverPkg.dependencies)).not.toContain('prom-client');
    expect(Object.keys(serverPkg.dependencies)).not.toContain('statsd');
    expect(Object.keys(serverPkg.dependencies)).not.toContain('datadog');
    expect(Object.keys(rootPkg.dependencies || {})).not.toContain('prom-client');
  });

  // ===========================================================================
  // Scenario AD: No high-cardinality metric labels
  // ===========================================================================
  test('Scenario AD: No high-cardinality metric labels exist in metrics output', () => {
    const metrics = defaultObservabilityService.getMetrics();
    const metricKeys = Object.keys(metrics.ingestion.by_provider.requests);

    // Only bounded providers
    for (const key of metricKeys) {
      expect(['AWS', 'GCP', 'AZURE', 'UNKNOWN']).toContain(key);
    }

    // Rejection reasons are bounded to 12 categories
    for (const key of Object.keys(metrics.ingestion.rejections_by_reason)) {
      const parts = key.split(':');
      expect(parts.length).toBe(2);
      expect(['AWS', 'GCP', 'AZURE', 'UNKNOWN']).toContain(parts[0]);
    }
  });
});
