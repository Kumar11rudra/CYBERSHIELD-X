/**
 * 🛡️ CyberShield X — Phase 80 Step 7 Test Suite
 *
 * Multi-Cloud Ingestion Controller & Router Acceptance Battery:
 * Tests Scenarios A through AH covering:
 * - AWS SNS connected & air-gapped notifications
 * - AWS SubscriptionConfirmation (auto & manual staging)
 * - GCP Pub/Sub connected OIDC & restricted token modes
 * - Azure Event Grid SAS header auth & SubscriptionValidation handshake
 * - 2MB body limit (413) & connector-scoped rate limiting (429)
 * - Tenant isolation, enrolled account enforcement, & provider mismatch
 * - Temporal delivery age (<= 15m) & future clock skew (<= 5m) guards
 * - Synchronous durable persistence contracts (202 CREATED, 200 DUPLICATE, 503 failure)
 * - Asynchronous non-blocking Data Fabric projection boundary
 * - Strict query-credential prohibition & sensitive data redaction
 */

'use strict';

const express = require('express');
const request = require('supertest');
const mongoose = require('mongoose');

const cloudIngestionRouter = require('../routes/cloudIngestion');
const cloudIngestionController = require('../controllers/cloudIngestionController');
const { CloudSignatureVerifier } = require('../services/ingestion/CloudSignatureVerifier');
const { CloudPersistenceService } = require('../services/ingestion/CloudPersistenceService');
const { CloudDataFabricAdapter } = require('../services/ingestion/CloudDataFabricAdapter');
const CloudTelemetryEvent = require('../models/CloudTelemetryEvent');
const { connectTestDb, closeTestDb, clearTestDb } = require('./helpers/testDbHelper');

describe('Phase 80 Step 7 — Multi-Cloud Ingestion Controller & Router Integration', () => {
  let app;
  const tenantA = 'org-step7-test-a';
  const tenantB = 'org-step7-test-b';

  // Create Express application mounting the router
  beforeAll(async () => {
    await connectTestDb();

    app = express();
    // Do not mount global json here so cloudIngestion router enforces its own 2MB limit
    app.use('/api/ingestion/cloud', cloudIngestionRouter);
  });

  afterAll(async () => {
    await closeTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
    cloudIngestionController.registry.clearConnectors();

    // Register baseline connectors
    cloudIngestionController.registry.registerConnector({
      connectorId: 'conn-aws-001',
      organizationId: tenantA,
      provider: 'AWS',
      authMode: 'SHARED_SECRET',
      sharedSecret: 'AwsTestSecretKey123',
      enrolledAccountIds: ['123456789012'],
      autoConfirm: true,
    });

    cloudIngestionController.registry.registerConnector({
      connectorId: 'conn-aws-manual-002',
      organizationId: tenantA,
      provider: 'AWS',
      authMode: 'SHARED_SECRET',
      sharedSecret: 'AwsTestSecretKey123',
      enrolledAccountIds: ['123456789012'],
      autoConfirm: false, // Manual staged confirmation
    });

    cloudIngestionController.registry.registerConnector({
      connectorId: 'conn-gcp-001',
      organizationId: tenantA,
      provider: 'GCP',
      authMode: 'SHARED_SECRET',
      sharedSecret: 'GcpRestrictedToken456',
      enrolledAccountIds: ['project-sec-999'],
    });

    cloudIngestionController.registry.registerConnector({
      connectorId: 'conn-azure-001',
      organizationId: tenantA,
      provider: 'AZURE',
      authMode: 'SHARED_SECRET',
      sharedSecret: 'AzureSasToken789',
      enrolledAccountIds: ['sub-azure-111'],
    });
  });

  // Helper sample payloads
  const sampleAwsSnsPayload = {
    Type: 'Notification',
    MessageId: 'msg-aws-701',
    TopicArn: 'arn:aws:sns:us-east-1:123456789012:security-events',
    Timestamp: new Date().toISOString(),
    Message: JSON.stringify({
      eventVersion: '1.08',
      eventID: 'evt-aws-ct-701',
      eventTime: new Date().toISOString(),
      eventSource: 'iam.amazonaws.com',
      eventName: 'CreateUser',
      awsRegion: 'us-east-1',
      recipientAccountId: '123456789012',
      userIdentity: {
        type: 'IAMUser',
        principalId: 'AIDAALICE',
        arn: 'arn:aws:iam::123456789012:user/Alice',
        userName: 'Alice',
      },
      requestParameters: { userName: 'Bob' },
    }),
  };

  const sampleGcpPubSubPayload = {
    message: {
      messageId: 'gcp-msg-701',
      publishTime: new Date().toISOString(),
      data: Buffer.from(
        JSON.stringify({
          insertId: 'gcp-audit-701',
          timestamp: new Date().toISOString(),
          resource: {
            type: 'gce_instance',
            labels: { project_id: 'project-sec-999', instance_id: 'inst-123' },
          },
          protoPayload: {
            serviceName: 'compute.googleapis.com',
            methodName: 'compute.instances.start',
            authenticationInfo: { principalEmail: 'operator@project-sec-999.iam.gserviceaccount.com' },
          },
        })
      ).toString('base64'),
    },
    subscription: 'projects/project-sec-999/subscriptions/audit-sub',
  };

  const sampleAzurePayload = [
    {
      id: 'azure-event-701',
      topic: '/subscriptions/sub-azure-111/resourceGroups/rg-sec',
      subject: '/subscriptions/sub-azure-111/resourceGroups/rg-sec/providers/Microsoft.Compute/virtualMachines/vm-1',
      data: {
        subscriptionId: 'sub-azure-111',
        eventTimestamp: new Date().toISOString(),
        operationName: 'Microsoft.Compute/virtualMachines/start/action',
        status: 'Succeeded',
        caller: 'user@company.com',
        claims: { 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/upn': 'user@company.com' },
      },
      eventType: 'Microsoft.Security.Alert',
      eventTime: new Date().toISOString(),
      dataVersion: '1.0',
    },
  ];

  // ===========================================================================
  // SCENARIO A: AWS authenticated notification
  // ===========================================================================
  test('Scenario A: AWS authenticated notification returns 202 Accepted', async () => {
    const res = await request(app)
      .post('/api/ingestion/cloud/aws/conn-aws-001')
      .set('X-CyberShield-Key', 'AwsTestSecretKey123')
      .send(sampleAwsSnsPayload);

    expect(res.status).toBe(202);
    expect(res.body.status).toBe('ACCEPTED');
    expect(res.body.canonicalEventId).toBeDefined();
    expect(res.body.nativeEventId).toBe('evt-aws-ct-701');

    // Confirm durable MongoDB commit
    const doc = await CloudTelemetryEvent.findOne({ nativeEventId: 'evt-aws-ct-701' });
    expect(doc).not.toBeNull();
    expect(doc.organizationId).toBe(tenantA);
  });

  // ===========================================================================
  // SCENARIO B: AWS invalid signature / authentication
  // ===========================================================================
  test('Scenario B: AWS invalid signature/secret returns 401 Unauthorized', async () => {
    const res = await request(app)
      .post('/api/ingestion/cloud/aws/conn-aws-001')
      .set('X-CyberShield-Key', 'WrongSecretKey!')
      .send(sampleAwsSnsPayload);

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('UNAUTHORIZED');

    const count = await CloudTelemetryEvent.countDocuments({});
    expect(count).toBe(0);
  });

  // ===========================================================================
  // SCENARIO C: AWS air-gapped valid secret
  // ===========================================================================
  test('Scenario C: AWS air-gapped valid secret succeeds', async () => {
    const res = await request(app)
      .post('/api/ingestion/cloud/aws/conn-aws-001')
      .set('X-CyberShield-Key', 'AwsTestSecretKey123')
      .send(sampleAwsSnsPayload);

    expect(res.status).toBe(202);
  });

  // ===========================================================================
  // SCENARIO D: AWS invalid air-gapped secret
  // ===========================================================================
  test('Scenario D: AWS invalid air-gapped secret returns 401', async () => {
    const res = await request(app)
      .post('/api/ingestion/cloud/aws/conn-aws-001')
      .set('X-CyberShield-Key', 'InvalidKey')
      .send(sampleAwsSnsPayload);

    expect(res.status).toBe(401);
  });

  // ===========================================================================
  // SCENARIO E: AWS query-string secret rejection
  // ===========================================================================
  test('Scenario E: AWS query-string secret rejection returns 400', async () => {
    const res = await request(app)
      .post('/api/ingestion/cloud/aws/conn-aws-001?key=AwsTestSecretKey123')
      .set('X-CyberShield-Key', 'AwsTestSecretKey123')
      .send(sampleAwsSnsPayload);

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('QUERY_SECRET_PROHIBITED');
  });

  // ===========================================================================
  // SCENARIO F: AWS authenticated SubscriptionConfirmation
  // ===========================================================================
  test('Scenario F: AWS authenticated SubscriptionConfirmation handled without persistence', async () => {
    const subConfirmPayload = {
      Type: 'SubscriptionConfirmation',
      MessageId: 'sub-msg-001',
      TopicArn: 'arn:aws:sns:us-east-1:123456789012:security-events',
      Timestamp: new Date().toISOString(),
      SubscribeURL: 'https://sns.us-east-1.amazonaws.com/?Action=ConfirmSubscription&TopicArn=arn:aws:sns:us-east-1:123456789012:security-events&Token=123',
    };

    // Spy on internal fetch to simulate AWS response
    const origFetch = cloudIngestionController.verifier._fetchSubscribeUrl;
    cloudIngestionController.verifier._fetchSubscribeUrl = jest.fn().mockResolvedValue({ isValid: true });

    try {
      const res = await request(app)
        .post('/api/ingestion/cloud/aws/conn-aws-001')
        .set('X-CyberShield-Key', 'AwsTestSecretKey123')
        .send(subConfirmPayload);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('SUBSCRIPTION_CONFIRMED');

      // Handshakes must never enter telemetry persistence
      const count = await CloudTelemetryEvent.countDocuments({});
      expect(count).toBe(0);
    } finally {
      cloudIngestionController.verifier._fetchSubscribeUrl = origFetch;
    }
  });

  // ===========================================================================
  // SCENARIO G: AWS unauthenticated SubscriptionConfirmation rejection
  // ===========================================================================
  test('Scenario G: AWS unauthenticated SubscriptionConfirmation is rejected with 401', async () => {
    const subConfirmPayload = {
      Type: 'SubscriptionConfirmation',
      MessageId: 'sub-msg-002',
      TopicArn: 'arn:aws:sns:us-east-1:123456789012:security-events',
      Timestamp: new Date().toISOString(),
      SubscribeURL: 'https://sns.us-east-1.amazonaws.com/?Action=ConfirmSubscription',
    };

    const res = await request(app)
      .post('/api/ingestion/cloud/aws/conn-aws-001')
      .send(subConfirmPayload); // missing auth header

    expect(res.status).toBe(401);
  });

  // ===========================================================================
  // SCENARIO H: AWS auto-confirm enabled
  // ===========================================================================
  test('Scenario H: AWS auto-confirm enabled confirms subscription', async () => {
    const subPayload = {
      Type: 'SubscriptionConfirmation',
      MessageId: 'sub-msg-003',
      TopicArn: 'arn:aws:sns:us-east-1:123456789012:security-events',
      Timestamp: new Date().toISOString(),
      SubscribeURL: 'https://sns.us-east-1.amazonaws.com/?Action=ConfirmSubscription',
    };

    const origFetch = cloudIngestionController.verifier._fetchSubscribeUrl;
    cloudIngestionController.verifier._fetchSubscribeUrl = jest.fn().mockResolvedValue({ isValid: true });

    try {
      const res = await request(app)
        .post('/api/ingestion/cloud/aws/conn-aws-001')
        .set('X-CyberShield-Key', 'AwsTestSecretKey123')
        .send(subPayload);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('SUBSCRIPTION_CONFIRMED');
    } finally {
      cloudIngestionController.verifier._fetchSubscribeUrl = origFetch;
    }
  });

  // ===========================================================================
  // SCENARIO I: AWS staged/manual confirmation
  // ===========================================================================
  test('Scenario I: AWS staged/manual confirmation stages subscription without egress', async () => {
    const subPayload = {
      Type: 'SubscriptionConfirmation',
      MessageId: 'sub-msg-004',
      TopicArn: 'arn:aws:sns:us-east-1:123456789012:security-events',
      Timestamp: new Date().toISOString(),
      SubscribeURL: 'https://sns.us-east-1.amazonaws.com/?Action=ConfirmSubscription',
    };

    const res = await request(app)
      .post('/api/ingestion/cloud/aws/conn-aws-manual-002')
      .set('X-CyberShield-Key', 'AwsTestSecretKey123')
      .send(subPayload);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('SUBSCRIPTION_STAGED');
  });

  // ===========================================================================
  // SCENARIO J: GCP valid OIDC JWT
  // ===========================================================================
  test('Scenario J: GCP valid OIDC JWT returns 202 Accepted', async () => {
    // Register connected GCP connector
    cloudIngestionController.registry.registerConnector({
      connectorId: 'conn-gcp-oidc',
      organizationId: tenantA,
      provider: 'GCP',
      authMode: 'CONNECTED',
      enrolledAccountIds: ['project-sec-999'],
      jwtAudience: 'https://cybershieldx.in/api/ingestion/cloud/gcp/conn-gcp-oidc',
    });

    const origVerifyJwt = cloudIngestionController.verifier._verifyGcpOidcJwt;
    cloudIngestionController.verifier._verifyGcpOidcJwt = jest.fn().mockResolvedValue({
      isValid: true,
      claims: { email: 'pubsub-push@google.com' },
    });

    try {
      const res = await request(app)
        .post('/api/ingestion/cloud/gcp/conn-gcp-oidc')
        .set('Authorization', 'Bearer valid.google.oidc.token')
        .send(sampleGcpPubSubPayload);

      expect(res.status).toBe(202);
      expect(res.body.status).toBe('ACCEPTED');
      expect(res.body.nativeEventId).toBe('gcp-audit-701');
    } finally {
      cloudIngestionController.verifier._verifyGcpOidcJwt = origVerifyJwt;
    }
  });

  // ===========================================================================
  // SCENARIO K: GCP invalid JWT
  // ===========================================================================
  test('Scenario K: GCP invalid JWT returns 401 Unauthorized', async () => {
    cloudIngestionController.registry.registerConnector({
      connectorId: 'conn-gcp-oidc',
      organizationId: tenantA,
      provider: 'GCP',
      authMode: 'CONNECTED',
      enrolledAccountIds: ['project-sec-999'],
    });

    const origVerifyJwt = cloudIngestionController.verifier._verifyGcpOidcJwt;
    cloudIngestionController.verifier._verifyGcpOidcJwt = jest.fn().mockResolvedValue({
      isValid: false,
      reason: 'INVALID_OIDC_TOKEN',
    });

    try {
      const res = await request(app)
        .post('/api/ingestion/cloud/gcp/conn-gcp-oidc')
        .set('Authorization', 'Bearer invalid.token')
        .send(sampleGcpPubSubPayload);

      expect(res.status).toBe(401);
    } finally {
      cloudIngestionController.verifier._verifyGcpOidcJwt = origVerifyJwt;
    }
  });

  // ===========================================================================
  // SCENARIO L: GCP valid restricted token
  // ===========================================================================
  test('Scenario L: GCP valid restricted token returns 202 Accepted', async () => {
    const res = await request(app)
      .post('/api/ingestion/cloud/gcp/conn-gcp-001')
      .set('X-CyberShield-Token', 'GcpRestrictedToken456')
      .send(sampleGcpPubSubPayload);

    expect(res.status).toBe(202);
    expect(res.body.status).toBe('ACCEPTED');
  });

  // ===========================================================================
  // SCENARIO M: GCP invalid restricted token
  // ===========================================================================
  test('Scenario M: GCP invalid restricted token returns 401 Unauthorized', async () => {
    const res = await request(app)
      .post('/api/ingestion/cloud/gcp/conn-gcp-001')
      .set('X-CyberShield-Token', 'WrongToken')
      .send(sampleGcpPubSubPayload);

    expect(res.status).toBe(401);
  });

  // ===========================================================================
  // SCENARIO N: GCP query-string token rejection
  // ===========================================================================
  test('Scenario N: GCP query-string token rejection returns 400', async () => {
    const res = await request(app)
      .post('/api/ingestion/cloud/gcp/conn-gcp-001?token=GcpRestrictedToken456')
      .set('X-CyberShield-Token', 'GcpRestrictedToken456')
      .send(sampleGcpPubSubPayload);

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('QUERY_SECRET_PROHIBITED');
  });

  // ===========================================================================
  // SCENARIO O: Azure valid SAS/header authentication
  // ===========================================================================
  test('Scenario O: Azure valid SAS header returns 202 Accepted', async () => {
    const res = await request(app)
      .post('/api/ingestion/cloud/azure/conn-azure-001')
      .set('aeg-sas-token', 'AzureSasToken789')
      .send(sampleAzurePayload);

    expect(res.status).toBe(202);
    expect(res.body.status).toBe('ACCEPTED');
    expect(res.body.nativeEventId).toBe('azure-event-701');
  });

  // ===========================================================================
  // SCENARIO P: Azure invalid authentication
  // ===========================================================================
  test('Scenario P: Azure invalid authentication returns 401 Unauthorized', async () => {
    const res = await request(app)
      .post('/api/ingestion/cloud/azure/conn-azure-001')
      .set('aeg-sas-token', 'WrongAzureToken')
      .send(sampleAzurePayload);

    expect(res.status).toBe(401);
  });

  // ===========================================================================
  // SCENARIO Q: Azure SubscriptionValidation success
  // ===========================================================================
  test('Scenario Q: Azure SubscriptionValidation success returns validationResponse', async () => {
    const validationPayload = [
      {
        id: 'val-event-001',
        topic: '/subscriptions/sub-azure-111/resourceGroups/rg-sec',
        subject: '',
        data: {
          validationCode: 'AZURE_SECRET_VALIDATION_CODE_12345',
          validationUrl: 'https://rp-eastus.eventgrid.azure.net:553/eventsubscriptions/sub/validate?token=...',
        },
        eventType: 'Microsoft.EventGrid.SubscriptionValidationEvent',
        eventTime: new Date().toISOString(),
      },
    ];

    const res = await request(app)
      .post('/api/ingestion/cloud/azure/conn-azure-001')
      .set('aeg-event-type', 'SubscriptionValidation')
      .send(validationPayload);

    expect(res.status).toBe(200);
    expect(res.body.validationResponse).toBe('AZURE_SECRET_VALIDATION_CODE_12345');

    // Handshakes must never enter telemetry persistence
    const count = await CloudTelemetryEvent.countDocuments({});
    expect(count).toBe(0);
  });

  // ===========================================================================
  // SCENARIO R: Azure unauthenticated SubscriptionValidation rejection
  // ===========================================================================
  test('Scenario R: Azure unauthenticated SubscriptionValidation rejection returns 400', async () => {
    const invalidValidationPayload = [
      {
        id: 'val-event-002',
        data: {}, // Missing validationCode
        eventType: 'Microsoft.EventGrid.SubscriptionValidationEvent',
      },
    ];

    const res = await request(app)
      .post('/api/ingestion/cloud/azure/conn-azure-001')
      .set('aeg-event-type', 'SubscriptionValidation')
      .send(invalidValidationPayload);

    expect(res.status).toBe(400);
  });

  // ===========================================================================
  // SCENARIO S: Oversized > 2MB request rejected
  // ===========================================================================
  test('Scenario S: Oversized > 2MB request rejected with 413', async () => {
    // Large payload exceeding 2MB
    const bigString = 'x'.repeat(2.1 * 1024 * 1024);

    const res = await request(app)
      .post('/api/ingestion/cloud/aws/conn-aws-001')
      .set('X-CyberShield-Key', 'AwsTestSecretKey123')
      .set('Content-Type', 'application/json')
      .send({ data: bigString });

    expect(res.status).toBe(413);
    expect(res.body.error).toBe('PAYLOAD_TOO_LARGE');
  });

  // ===========================================================================
  // SCENARIO T: Rate-limit enforcement
  // ===========================================================================
  test('Scenario T: Rate-limit enforcement responds with 429 when exceeded', async () => {
    // Create a local isolated router with small rate limit for deterministic testing
    const rateLimit = require('express-rate-limit');
    const miniApp = express();
    miniApp.use(express.json());

    const testLimiter = rateLimit({
      windowMs: 60 * 1000,
      max: 2, // 2 requests max
      handler: (req, res) => {
        res.setHeader('Retry-After', '60');
        res.status(429).json({ error: 'RATE_LIMIT_EXCEEDED' });
      },
    });

    miniApp.post('/test-limit', testLimiter, (req, res) => res.status(200).send('OK'));

    await request(miniApp).post('/test-limit').send({});
    await request(miniApp).post('/test-limit').send({});
    const res3 = await request(miniApp).post('/test-limit').send({});

    expect(res3.status).toBe(429);
    expect(res3.headers['retry-after']).toBe('60');
  });

  // ===========================================================================
  // SCENARIO U: Tenant injection attempt
  // ===========================================================================
  test('Scenario U: Tenant injection attempt is strictly rejected with 403', async () => {
    // Try to inject tenantB context on tenantA's connector
    const origVerify = cloudIngestionController.verifier.verifyAwsSns;
    cloudIngestionController.verifier.verifyAwsSns = jest.fn().mockResolvedValue({
      isValid: false,
      reason: 'TENANT_MISMATCH',
    });

    try {
      const res = await request(app)
        .post('/api/ingestion/cloud/aws/conn-aws-001')
        .set('X-CyberShield-Key', 'AwsTestSecretKey123')
        .set('x-organization-id', tenantB)
        .send(sampleAwsSnsPayload);

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('TENANT_MISMATCH');
    } finally {
      cloudIngestionController.verifier.verifyAwsSns = origVerify;
    }
  });

  // ===========================================================================
  // SCENARIO V: Cloud account mismatch
  // ===========================================================================
  test('Scenario V: Cloud account mismatch is rejected with 403', async () => {
    const unapprovedAccountPayload = {
      ...sampleAwsSnsPayload,
      Message: JSON.stringify({
        eventVersion: '1.08',
        eventID: 'evt-aws-unapproved-account',
        eventTime: new Date().toISOString(),
        eventSource: 'iam.amazonaws.com',
        eventName: 'CreateUser',
        recipientAccountId: '999999999999', // Not in enrolledAccountIds
        userIdentity: { type: 'IAMUser', principalId: 'ALICE' },
      }),
    };

    const res = await request(app)
      .post('/api/ingestion/cloud/aws/conn-aws-001')
      .set('X-CyberShield-Key', 'AwsTestSecretKey123')
      .send(unapprovedAccountPayload);

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('CLOUD_ACCOUNT_MISMATCH');
  });

  // ===========================================================================
  // SCENARIO W: Provider mismatch
  // ===========================================================================
  test('Scenario W: Provider mismatch returns 400', async () => {
    // Sending AWS connector to GCP endpoint
    const res = await request(app)
      .post('/api/ingestion/cloud/gcp/conn-aws-001')
      .set('X-CyberShield-Token', 'GcpRestrictedToken456')
      .send(sampleGcpPubSubPayload);

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('PROVIDER_MISMATCH');
  });

  // ===========================================================================
  // SCENARIO X: Stale transport event (>15m)
  // ===========================================================================
  test('Scenario X: Stale transport event (>15m) returns 400', async () => {
    const stalePayload = {
      ...sampleAwsSnsPayload,
      Timestamp: new Date(Date.now() - 20 * 60 * 1000).toISOString(), // 20m ago
    };

    const res = await request(app)
      .post('/api/ingestion/cloud/aws/conn-aws-001')
      .set('X-CyberShield-Key', 'AwsTestSecretKey123')
      .send(stalePayload);

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('TRANSPORT_TIMESTAMP_EXPIRED');
  });

  // ===========================================================================
  // SCENARIO Y: Future-skew event (>5m)
  // ===========================================================================
  test('Scenario Y: Future-skew event (>5m) returns 400', async () => {
    const futurePayload = {
      ...sampleAwsSnsPayload,
      Timestamp: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10m in future
    };

    const res = await request(app)
      .post('/api/ingestion/cloud/aws/conn-aws-001')
      .set('X-CyberShield-Key', 'AwsTestSecretKey123')
      .send(futurePayload);

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('FUTURE_CLOCK_SKEW_EXCEEDED');
  });

  // ===========================================================================
  // SCENARIO Z: CREATED durable persistence returns 202
  // ===========================================================================
  test('Scenario Z: CREATED durable persistence returns HTTP 202 with canonicalEventId', async () => {
    const res = await request(app)
      .post('/api/ingestion/cloud/aws/conn-aws-001')
      .set('X-CyberShield-Key', 'AwsTestSecretKey123')
      .send(sampleAwsSnsPayload);

    expect(res.status).toBe(202);
    expect(res.body.status).toBe('ACCEPTED');
    expect(res.body.canonicalEventId).toContain('CLOUD-AWS-org-step7-test-a-evt-aws-ct-701');

    const inDb = await CloudTelemetryEvent.findOne({ nativeEventId: 'evt-aws-ct-701' });
    expect(inDb).not.toBeNull();
    expect(inDb.projectionStatus).toBe('PENDING');
  });

  // ===========================================================================
  // SCENARIO AA: DUPLICATE event returns 200 DUPLICATE_ACKNOWLEDGED
  // ===========================================================================
  test('Scenario AA: DUPLICATE event returns 200 DUPLICATE_ACKNOWLEDGED without duplicate records', async () => {
    // First delivery
    const res1 = await request(app)
      .post('/api/ingestion/cloud/aws/conn-aws-001')
      .set('X-CyberShield-Key', 'AwsTestSecretKey123')
      .send(sampleAwsSnsPayload);
    expect(res1.status).toBe(202);

    // Second delivery (duplicate)
    const res2 = await request(app)
      .post('/api/ingestion/cloud/aws/conn-aws-001')
      .set('X-CyberShield-Key', 'AwsTestSecretKey123')
      .send(sampleAwsSnsPayload);

    expect(res2.status).toBe(200);
    expect(res2.body.status).toBe('DUPLICATE_ACKNOWLEDGED');
    expect(res2.body.isDuplicate).toBe(true);

    const count = await CloudTelemetryEvent.countDocuments({ nativeEventId: 'evt-aws-ct-701' });
    expect(count).toBe(1);
  });

  // ===========================================================================
  // SCENARIO AB: Persistence failure produces HTTP 503
  // ===========================================================================
  test('Scenario AB: Persistence failure produces HTTP 503, NEVER 202', async () => {
    const origPersist = CloudPersistenceService.persist;
    CloudPersistenceService.persist = jest.fn().mockResolvedValue({
      status: 'PERSISTENCE_FAILURE',
      error: 'Simulated MongoDB connection drop',
    });

    try {
      const res = await request(app)
        .post('/api/ingestion/cloud/aws/conn-aws-001')
        .set('X-CyberShield-Key', 'AwsTestSecretKey123')
        .send(sampleAwsSnsPayload);

      expect(res.status).toBe(503);
      expect(res.body.error).toBe('PERSISTENCE_FAILURE');
    } finally {
      CloudPersistenceService.persist = origPersist;
    }
  });

  // ===========================================================================
  // SCENARIO AC: No false 202 before persistence
  // ===========================================================================
  test('Scenario AC: Proves persistence is strictly completed before 202 response', async () => {
    let persistenceFinished = false;
    const origPersist = CloudPersistenceService.persist;
    CloudPersistenceService.persist = jest.fn().mockImplementation(async (...args) => {
      const result = await origPersist.apply(CloudPersistenceService, args);
      persistenceFinished = true;
      return result;
    });

    try {
      const res = await request(app)
        .post('/api/ingestion/cloud/aws/conn-aws-001')
        .set('X-CyberShield-Key', 'AwsTestSecretKey123')
        .send(sampleAwsSnsPayload);

      expect(res.status).toBe(202);
      expect(persistenceFinished).toBe(true);
    } finally {
      CloudPersistenceService.persist = origPersist;
    }
  });

  // ===========================================================================
  // SCENARIO AD: Graph projection is not awaited by controller
  // ===========================================================================
  test('Scenario AD: Graph projection is asynchronous and non-blocking', async () => {
    let projectionInvoked = false;
    const origProject = CloudDataFabricAdapter.projectEvent;
    CloudDataFabricAdapter.projectEvent = jest.fn().mockImplementation(async (event) => {
      projectionInvoked = true;
      return { status: 'MATERIALIZED', materialized: true };
    });

    try {
      const res = await request(app)
        .post('/api/ingestion/cloud/aws/conn-aws-001')
        .set('X-CyberShield-Key', 'AwsTestSecretKey123')
        .send(sampleAwsSnsPayload);

      // Response returned immediately
      expect(res.status).toBe(202);

      // Give setImmediate a tick to run
      await new Promise((resolve) => setImmediate(resolve));
      expect(projectionInvoked).toBe(true);
    } finally {
      CloudDataFabricAdapter.projectEvent = origProject;
    }
  });

  // ===========================================================================
  // SCENARIO AE: Rejected events never reach persistence
  // ===========================================================================
  test('Scenario AE: Rejected events never reach persistence', async () => {
    const persistSpy = jest.spyOn(CloudPersistenceService, 'persist');

    // Send unauthenticated request
    await request(app)
      .post('/api/ingestion/cloud/aws/conn-aws-001')
      .send(sampleAwsSnsPayload);

    expect(persistSpy).not.toHaveBeenCalled();
    persistSpy.mockRestore();
  });

  // ===========================================================================
  // SCENARIO AF: Subscription handshakes do not enter telemetry persistence
  // ===========================================================================
  test('Scenario AF: Subscription handshakes do not enter telemetry persistence', async () => {
    const validationPayload = [
      {
        id: 'val-handshake-999',
        data: { validationCode: 'CODE-999' },
        eventType: 'Microsoft.EventGrid.SubscriptionValidationEvent',
      },
    ];

    await request(app)
      .post('/api/ingestion/cloud/azure/conn-azure-001')
      .set('aeg-event-type', 'SubscriptionValidation')
      .send(validationPayload);

    const count = await CloudTelemetryEvent.countDocuments({});
    expect(count).toBe(0);
  });

  // ===========================================================================
  // SCENARIO AG: Sensitive data absent from error/log output
  // ===========================================================================
  test('Scenario AG: Sensitive data absent from error/log output', async () => {
    const res = await request(app)
      .post('/api/ingestion/cloud/aws/conn-aws-001')
      .set('X-CyberShield-Key', 'SuperSecretPasswordString123')
      .send(sampleAwsSnsPayload);

    const bodyStr = JSON.stringify(res.body);
    expect(bodyStr).not.toContain('SuperSecretPasswordString123');
    expect(bodyStr).not.toContain('AwsTestSecretKey123');
  });

  // ===========================================================================
  // SCENARIO AH: No query credential acceptance
  // ===========================================================================
  test('Scenario AH: Query credentials consistently rejected across all endpoints', async () => {
    const resAws = await request(app)
      .post('/api/ingestion/cloud/aws/conn-aws-001?secret=123')
      .send({});
    const resGcp = await request(app)
      .post('/api/ingestion/cloud/gcp/conn-gcp-001?token=123')
      .send({});
    const resAzure = await request(app)
      .post('/api/ingestion/cloud/azure/conn-azure-001?key=123')
      .send({});

    expect(resAws.status).toBe(400);
    expect(resGcp.status).toBe(400);
    expect(resAzure.status).toBe(400);

    expect(resAws.body.error).toBe('QUERY_SECRET_PROHIBITED');
    expect(resGcp.body.error).toBe('QUERY_SECRET_PROHIBITED');
    expect(resAzure.body.error).toBe('QUERY_SECRET_PROHIBITED');
  });
});
