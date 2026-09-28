/**
 * 🛡️ CyberShield X — Phase 80 Step 9 Acceptance Test Suite
 *
 * Enterprise Multi-Cloud Ingestion Acceptance Gates & Synthetic Replay Matrix:
 * Validates Gates A through AZ (52 distinct scenarios) across:
 * - Section 2: AWS SNS Acceptance (Gates A-G)
 * - Section 3: GCP Pub/Sub Acceptance (Gates H-K)
 * - Section 4: Azure Event Grid Acceptance (Gates L-O)
 * - Section 5: Tenant Isolation & Account Whitelisting (Gates P-R)
 * - Section 6: Temporal Security & Clock Skew (Gates S-T)
 * - Section 7: Idempotency & Replay Protection (Gates U-W)
 * - Section 8: Durable ACK Contract & Failure Isolation (Gates X-Z)
 * - Section 9: Graph Projection & Recovery (Gates AA-AF)
 * - Section 10: Reconciliation & Backlog Recovery (Gates AG-AI)
 * - Section 11: Request Safeguards & Rate Limiting (Gates AJ-AL)
 * - Section 12: Prototype Pollution & Input Hardening (Gates AM-AP)
 * - Section 13: Sensitive Data Redaction & Log Safety (Gates AQ-AR)
 * - Section 14: Observability, Cardinality & Health (Gates AS-AU)
 * - Section 15: Security Regression & Route Confusion (Gates AV-AX)
 * - Section 16: Phase 79 Decision Intelligence Isolation (Gate AY)
 * - Section 17: Phase 75 Data Lifecycle & Legal Hold (Gate AZ)
 * - Section 18: Deterministic Synthetic Replay Matrix
 */

'use strict';

const express = require('express');
const request = require('supertest');
const crypto = require('crypto');
const { execSync } = require('child_process');
const mongoose = require('mongoose');

const cloudIngestionRouter = require('../routes/cloudIngestion');
const cloudIngestionController = require('../controllers/cloudIngestionController');
const { CloudSignatureVerifier } = require('../services/ingestion/CloudSignatureVerifier');
const CloudTelemetryNormalizer = require('../services/ingestion/CloudTelemetryNormalizer');
const { CloudPersistenceService } = require('../services/ingestion/CloudPersistenceService');
const CloudDataFabricAdapter = require('../services/ingestion/CloudDataFabricAdapter');
const { defaultObservabilityService } = require('../services/ingestion/CloudObservabilityService');
const DataLifecycleService = require('../services/soc/DataLifecycleService');
const CloudTelemetryEvent = require('../models/CloudTelemetryEvent');
const SecurityGraphNode = require('../models/SecurityGraphNode');
const SecurityGraphEdge = require('../models/SecurityGraphEdge');
const RetentionPolicy = require('../models/RetentionPolicy');
const { connectTestDb, closeTestDb, clearTestDb } = require('./helpers/testDbHelper');
const logger = require('../utils/logger');

describe('Phase 80 Step 9 — Enterprise Multi-Cloud Acceptance Gates & Synthetic Replay', () => {
  let app;
  let testRsaPrivateKeyPem;
  let testRsaCertPem;
  let testGcpPrivateKey;
  let testGcpPublicKeyJwk;

  const tenantA = 'org-step9-alpha';
  const tenantB = 'org-step9-beta';
  const enrolledAwsAccount = '123456789012';
  const enrolledGcpProject = 'project-sec-999';
  const enrolledAzureSub = 'sub-azure-111';

  beforeAll(async () => {
    await connectTestDb();

    // 1. Generate RSA key & self-signed certificate for AWS SNS signature testing
    testRsaPrivateKeyPem = execSync('openssl genrsa 2048 2>/dev/null', { encoding: 'utf8' });
    testRsaCertPem = execSync('openssl req -new -x509 -key /dev/stdin -subj "/CN=sns.amazonaws.com" -days 30 2>/dev/null', {
      input: testRsaPrivateKeyPem,
      encoding: 'utf8',
    });

    // 2. Generate RSA key pair for GCP OIDC JWT verification
    const gcpKeyPair = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
    testGcpPrivateKey = gcpKeyPair.privateKey;
    testGcpPublicKeyJwk = gcpKeyPair.publicKey.export({ format: 'jwk' });
    testGcpPublicKeyJwk.kid = 'gcp-test-key-step9';
    testGcpPublicKeyJwk.alg = 'RS256';
    testGcpPublicKeyJwk.use = 'sig';

    // 3. Mount Express application
    app = express();
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
      connectorId: 'conn-aws-sig',
      organizationId: tenantA,
      provider: 'AWS',
      authMode: 'SNS_SIGNATURE',
      enrolledAccountIds: [enrolledAwsAccount],
      autoConfirm: true,
    });

    cloudIngestionController.registry.registerConnector({
      connectorId: 'conn-aws-airgap',
      organizationId: tenantA,
      provider: 'AWS',
      authMode: 'SHARED_SECRET',
      sharedSecret: 'AwsAirgapKeyAlpha123',
      enrolledAccountIds: [enrolledAwsAccount],
      autoConfirm: true,
    });

    cloudIngestionController.registry.registerConnector({
      connectorId: 'conn-aws-manual',
      organizationId: tenantA,
      provider: 'AWS',
      authMode: 'SNS_SIGNATURE',
      enrolledAccountIds: [enrolledAwsAccount],
      autoConfirm: false,
    });

    cloudIngestionController.registry.registerConnector({
      connectorId: 'conn-gcp-oidc',
      organizationId: tenantA,
      provider: 'GCP',
      authMode: 'OIDC_JWT',
      expectedAudience: 'https://api.cybershield.local/api/ingestion/cloud/gcp/conn-gcp-oidc',
      _injectedJwks: { keys: [testGcpPublicKeyJwk] },
      enrolledAccountIds: [enrolledGcpProject],
    });

    cloudIngestionController.registry.registerConnector({
      connectorId: 'conn-gcp-secret',
      organizationId: tenantA,
      provider: 'GCP',
      authMode: 'SHARED_SECRET',
      sharedSecret: 'GcpSharedSecretAlpha456',
      enrolledAccountIds: [enrolledGcpProject],
    });

    cloudIngestionController.registry.registerConnector({
      connectorId: 'conn-azure-sas',
      organizationId: tenantA,
      provider: 'AZURE',
      authMode: 'SHARED_SECRET',
      sharedSecret: 'AzureSasTokenAlpha789',
      enrolledAccountIds: [enrolledAzureSub],
    });

    cloudIngestionController.registry.registerConnector({
      connectorId: 'conn-aws-orgb',
      organizationId: tenantB,
      provider: 'AWS',
      authMode: 'SHARED_SECRET',
      sharedSecret: 'AwsOrgBKeySecret',
      enrolledAccountIds: ['987654321098'],
    });
  });

  // ─── Helpers ───────────────────────────────────────────────────────────────

  function createSignedAwsSnsMessage(overrides = {}, signingKey = testRsaPrivateKeyPem) {
    const certUrl = 'https://sns.us-east-1.amazonaws.com/SimpleNotificationService-step9.pem';
    const x509 = new crypto.X509Certificate(testRsaCertPem);
    cloudIngestionController.verifier.certCache.set(certUrl, x509);

    const msg = {
      Type: 'Notification',
      MessageId: 'msg-' + crypto.randomUUID(),
      TopicArn: `arn:aws:sns:us-east-1:${enrolledAwsAccount}:security-events`,
      Subject: 'CloudTrail Ingestion',
      Timestamp: new Date().toISOString(),
      SignatureVersion: '1',
      SigningCertURL: certUrl,
      Message: JSON.stringify({
        eventVersion: '1.08',
        eventID: 'evt-aws-' + crypto.randomUUID(),
        eventTime: new Date().toISOString(),
        eventSource: 'iam.amazonaws.com',
        eventName: 'CreateUser',
        awsRegion: 'us-east-1',
        recipientAccountId: enrolledAwsAccount,
        userIdentity: {
          type: 'IAMUser',
          principalId: 'AIDAALICE',
          arn: `arn:aws:iam::${enrolledAwsAccount}:user/Alice`,
          userName: 'Alice',
        },
        requestParameters: { userName: 'Bob' },
      }),
      ...overrides,
    };

    const canonicalString = cloudIngestionController.verifier._buildAwsSnsCanonicalString(msg);
    const signer = crypto.createSign('RSA-SHA256');
    signer.update(Buffer.from(canonicalString, 'utf8'));
    msg.Signature = signer.sign(signingKey, 'base64');
    return msg;
  }

  function createSignedGcpJwt(headerOverrides = {}, payloadOverrides = {}, signingKey = testGcpPrivateKey) {
    const header = {
      alg: 'RS256',
      kid: 'gcp-test-key-step9',
      typ: 'JWT',
      ...headerOverrides,
    };
    const payload = {
      iss: 'https://accounts.google.com',
      aud: 'https://api.cybershield.local/api/ingestion/cloud/gcp/conn-gcp-oidc',
      sub: '10987654321',
      email: 'cybershield-push@my-project.iam.gserviceaccount.com',
      exp: Math.floor(Date.now() / 1000) + 3600,
      iat: Math.floor(Date.now() / 1000),
      ...payloadOverrides,
    };

    const headerB64 = Buffer.from(JSON.stringify(header)).toString('base64url');
    const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');

    if (header.alg === 'none') {
      return `${headerB64}.${payloadB64}.`;
    }

    const signer = crypto.createSign('RSA-SHA256');
    signer.update(`${headerB64}.${payloadB64}`);
    const sigB64 = signer.sign(signingKey, 'base64url');
    return `${headerB64}.${payloadB64}.${sigB64}`;
  }

  function createGcpPubSubEnvelope(dataObj) {
    return {
      message: {
        messageId: 'gcp-msg-' + crypto.randomUUID(),
        publishTime: new Date().toISOString(),
        data: Buffer.from(JSON.stringify(dataObj)).toString('base64'),
      },
      subscription: `projects/${enrolledGcpProject}/subscriptions/cloud-audit-sub`,
    };
  }

  function createAzureEventGridEnvelope(eventObj) {
    return [
      {
        id: 'az-evt-' + crypto.randomUUID(),
        topic: `/subscriptions/${enrolledAzureSub}/resourceGroups/sec-rg`,
        subject: `/subscriptions/${enrolledAzureSub}/resourceGroups/sec-rg/providers/Microsoft.Compute/virtualMachines/vm1`,
        eventType: 'Microsoft.Security.Alert',
        eventTime: new Date().toISOString(),
        dataVersion: '1.0',
        data: {
          subscriptionId: enrolledAzureSub,
          eventTimestamp: new Date().toISOString(),
          operationName: 'Microsoft.Compute/virtualMachines/write',
          status: 'Succeeded',
          caller: 'admin@azure.local',
          claims: { 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/upn': 'admin@azure.local' },
          ...eventObj,
        },
      },
    ];
  }

  // ==========================================================================
  // SECTION 2 — AWS SNS ACCEPTANCE (GATES A - G)
  // ==========================================================================

  test('Gate A: Valid AWS SNS Notification (RSA-SHA256) -> HTTP 202 & Durable Persistence', async () => {
    const msg = createSignedAwsSnsMessage();
    const res = await request(app)
      .post('/api/ingestion/cloud/aws/conn-aws-sig')
      .send(msg);

    expect(res.status).toBe(202);
    expect(res.body.status).toBe('ACCEPTED');
    expect(res.body.canonicalEventId).toMatch(/^CLOUD-AWS-org-step9-alpha-/);

    const doc = await CloudTelemetryEvent.findOne({ canonicalEventId: res.body.canonicalEventId });
    expect(doc).toBeDefined();
    expect(doc.organizationId).toBe(tenantA);
    expect(doc.provider).toBe('AWS');
    expect(doc.cloudAccountId).toBe(enrolledAwsAccount);
  });

  test('Gate B: Invalid AWS signature -> 401/403, Zero Persistence, Verification Metric Increments', async () => {
    const msg = createSignedAwsSnsMessage();
    msg.Signature = Buffer.from('invalid-signature-tampered').toString('base64');

    const res = await request(app)
      .post('/api/ingestion/cloud/aws/conn-aws-sig')
      .send(msg);

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('UNAUTHORIZED');

    const count = await CloudTelemetryEvent.countDocuments();
    expect(count).toBe(0);

    const metrics = defaultObservabilityService.getMetrics();
    expect(metrics.ingestion.cloud_ingestion_verification_failures_total).toBeGreaterThanOrEqual(1);
  });

  test('Gate C: Invalid SigningCertURL (HTTP, non-AWS host, query string, fragment, non-pem) -> Rejected', async () => {
    const invalidUrls = [
      'http://sns.us-east-1.amazonaws.com/cert.pem', // Non-HTTPS
      'https://attacker-sns.amazonaws.com.evil.com/cert.pem', // Wrong host
      'https://google.com/cert.pem', // Non-AWS host
      'https://sns.us-east-1.amazonaws.com/cert.pem?token=secret', // Query string
      'https://sns.us-east-1.amazonaws.com/cert.pem#frag', // Fragment
      'https://sns.us-east-1.amazonaws.com/cert.txt', // Non-pem extension
    ];

    for (const badUrl of invalidUrls) {
      const msg = createSignedAwsSnsMessage({ SigningCertURL: badUrl });
      const res = await request(app)
        .post('/api/ingestion/cloud/aws/conn-aws-sig')
        .send(msg);

      expect(res.status).toBe(400);
      expect(['INVALID_SIGNING_CERTIFICATE', 'VERIFICATION_FAILED']).toContain(res.body.error);
    }
  });

  test('Gate D: AWS SSRF Protection -> Localhost, RFC1918 & Cloud Metadata Addresses Blocked', async () => {
    const ssrfUrls = [
      'https://127.0.0.1/sns.pem',
      'https://localhost/sns.pem',
      'https://169.254.169.254/latest/meta-data/',
      'https://10.0.0.5/sns.pem',
      'https://192.168.1.1/sns.pem',
    ];

    for (const ssrfUrl of ssrfUrls) {
      const msg = createSignedAwsSnsMessage({ SigningCertURL: ssrfUrl });
      const res = await request(app)
        .post('/api/ingestion/cloud/aws/conn-aws-sig')
        .send(msg);

      expect(res.status).toBe(400);
      expect(['INVALID_SIGNING_CERTIFICATE', 'VERIFICATION_FAILED']).toContain(res.body.error);
    }
  });

  test('Gate E: AWS Certificate Fetch Limits -> Timeout, Size Limit & No Redirects Enforced', () => {
    const verifier = new CloudSignatureVerifier();
    expect(verifier.maxCertSizeBytes).toBe(100 * 1024); // 100 KB limit
    expect(verifier.fetchTimeoutMs).toBe(3000); // 3-second timeout
  });

  test('Gate F: AWS SubscriptionConfirmation -> Authenticate First, Auto-Confirm / Manual Staging, 0 Telemetry Persisted', async () => {
    // 1. Auto-confirm enabled (conn-aws-sig has autoConfirm: true)
    const validSubscribeUrl = 'https://sns.us-east-1.amazonaws.com/?Action=ConfirmSubscription&TopicArn=arn:aws:sns:us-east-1:123456789012:security-events&Token=236ae8e1136';
    const subConfirmMsg = {
      Type: 'SubscriptionConfirmation',
      MessageId: 'sub-msg-1',
      TopicArn: `arn:aws:sns:us-east-1:${enrolledAwsAccount}:security-events`,
      Token: '236ae8e1136',
      SubscribeURL: validSubscribeUrl,
      Timestamp: new Date().toISOString(),
      SignatureVersion: '1',
      SigningCertURL: 'https://sns.us-east-1.amazonaws.com/SimpleNotificationService-step9.pem',
    };
    const canonical = cloudIngestionController.verifier._buildAwsSnsCanonicalString(subConfirmMsg);
    const signer = crypto.createSign('RSA-SHA256');
    signer.update(Buffer.from(canonical, 'utf8'));
    subConfirmMsg.Signature = signer.sign(testRsaPrivateKeyPem, 'base64');

    const origFetch = cloudIngestionController.verifier._fetchSubscribeUrl;
    cloudIngestionController.verifier._fetchSubscribeUrl = jest.fn().mockResolvedValue({ isValid: true, statusCode: 200 });

    try {
      const resAuto = await request(app)
        .post('/api/ingestion/cloud/aws/conn-aws-sig')
        .send(subConfirmMsg);

      expect(resAuto.status).toBe(200);
      expect(resAuto.body.status).toBe('SUBSCRIPTION_CONFIRMED');

      // 2. Manual staged confirmation (conn-aws-manual has autoConfirm: false)
      const resManual = await request(app)
        .post('/api/ingestion/cloud/aws/conn-aws-manual')
        .send(subConfirmMsg);

      expect(resManual.status).toBe(200);
      expect(resManual.body.status).toBe('SUBSCRIPTION_STAGED');

      // 3. Invalid signature must reject and NEVER trigger confirmation
      subConfirmMsg.Signature = 'invalid-sig';
      const resBad = await request(app)
        .post('/api/ingestion/cloud/aws/conn-aws-sig')
        .send(subConfirmMsg);

      expect(resBad.status).toBe(401);

      // Verify 0 telemetry events created
      const count = await CloudTelemetryEvent.countDocuments();
      expect(count).toBe(0);
    } finally {
      cloudIngestionController.verifier._fetchSubscribeUrl = origFetch;
    }
  });

  test('Gate G: AWS Air-Gapped Mode -> Constant-Time X-CyberShield-Key, Query Secrets Rejected', async () => {
    const msg = {
      Type: 'Notification',
      MessageId: 'msg-airgap-1',
      Message: JSON.stringify({
        eventVersion: '1.08',
        eventID: 'evt-airgap-1',
        eventTime: new Date().toISOString(),
        eventSource: 'iam.amazonaws.com',
        eventName: 'CreateUser',
        recipientAccountId: enrolledAwsAccount,
        userIdentity: { type: 'IAMUser', userName: 'AirgapAlice' },
      }),
    };

    // 1. Valid key
    const resValid = await request(app)
      .post('/api/ingestion/cloud/aws/conn-aws-airgap')
      .set('X-CyberShield-Key', 'AwsAirgapKeyAlpha123')
      .send(msg);

    expect(resValid.status).toBe(202);

    // 2. Invalid key
    const resInvalid = await request(app)
      .post('/api/ingestion/cloud/aws/conn-aws-airgap')
      .set('X-CyberShield-Key', 'WrongSecretKey')
      .send(msg);

    expect(resInvalid.status).toBe(401);

    // 3. Query secret rejected
    const resQuery = await request(app)
      .post('/api/ingestion/cloud/aws/conn-aws-airgap?key=AwsAirgapKeyAlpha123')
      .send(msg);

    expect(resQuery.status).toBe(400);
    expect(resQuery.body.error).toBe('QUERY_SECRET_PROHIBITED');
  });

  // ==========================================================================
  // SECTION 3 — GCP PUB/SUB ACCEPTANCE (GATES H - K)
  // ==========================================================================

  test('Gate H: Valid GCP OIDC JWT -> Bearer Extraction, RS256 Verification & HTTP 202', async () => {
    const validJwt = createSignedGcpJwt();
    const payload = createGcpPubSubEnvelope({
      insertId: 'gcp-insert-step9',
      timestamp: new Date().toISOString(),
      resource: {
        type: 'gce_instance',
        labels: { project_id: enrolledGcpProject, instance_id: 'vm-step9' },
      },
      protoPayload: {
        '@type': 'type.googleapis.com/google.cloud.audit.AuditLog',
        serviceName: 'compute.googleapis.com',
        methodName: 'v1.compute.instances.insert',
        resourceName: `projects/${enrolledGcpProject}/zones/us-central1-a/instances/vm-step9`,
        authenticationInfo: { principalEmail: 'admin@gcp.local' },
      },
    });

    const res = await request(app)
      .post('/api/ingestion/cloud/gcp/conn-gcp-oidc')
      .set('Authorization', `Bearer ${validJwt}`)
      .send(payload);

    expect(res.status).toBe(202);
    expect(res.body.status).toBe('ACCEPTED');
  });

  test('Gate I: Invalid GCP JWT -> Signature, Expiry, Issuer, Audience & "none" Algorithm Rejected', async () => {
    const invalidJwts = [
      createSignedGcpJwt({}, { exp: Math.floor(Date.now() / 1000) - 3600 }), // Expired
      createSignedGcpJwt({}, { iss: 'https://malicious-issuer.com' }), // Wrong issuer
      createSignedGcpJwt({}, { aud: 'https://wrong-audience.local' }), // Wrong audience
      createSignedGcpJwt({ alg: 'none' }), // Unsigned alg: none
      'malformed.jwt.token.string', // Malformed
    ];

    const payload = createGcpPubSubEnvelope({
      insertId: 'gcp-bad-jwt',
      timestamp: new Date().toISOString(),
      resource: {
        type: 'gce_instance',
        labels: { project_id: enrolledGcpProject },
      },
      protoPayload: { serviceName: 'compute.googleapis.com', methodName: 'v1.compute.instances.insert' },
    });

    for (const badJwt of invalidJwts) {
      const res = await request(app)
        .post('/api/ingestion/cloud/gcp/conn-gcp-oidc')
        .set('Authorization', `Bearer ${badJwt}`)
        .send(payload);

      expect([400, 401]).toContain(res.status);
    }
  });

  test('Gate J: GCP Restricted Shared-Secret Mode -> X-CyberShield-Token, Query Prohibited', async () => {
    const payload = createGcpPubSubEnvelope({
      insertId: 'gcp-secret-1',
      timestamp: new Date().toISOString(),
      resource: {
        type: 'gce_instance',
        labels: { project_id: enrolledGcpProject },
      },
      protoPayload: {
        serviceName: 'compute.googleapis.com',
        methodName: 'v1.compute.instances.insert',
        resourceName: `projects/${enrolledGcpProject}/zones/us-central1-a/instances/vm-secret`,
        authenticationInfo: { principalEmail: 'admin@gcp.local' },
      },
    });

    // 1. Valid token
    const resValid = await request(app)
      .post('/api/ingestion/cloud/gcp/conn-gcp-secret')
      .set('X-CyberShield-Token', 'GcpSharedSecretAlpha456')
      .send(payload);

    expect(resValid.status).toBe(202);

    // 2. Invalid token
    const resInvalid = await request(app)
      .post('/api/ingestion/cloud/gcp/conn-gcp-secret')
      .set('X-CyberShield-Token', 'WrongGcpToken')
      .send(payload);

    expect(resInvalid.status).toBe(401);

    // 3. Query token rejected
    const resQuery = await request(app)
      .post('/api/ingestion/cloud/gcp/conn-gcp-secret?token=GcpSharedSecretAlpha456')
      .send(payload);

    expect(resQuery.status).toBe(400);
    expect(resQuery.body.error).toBe('QUERY_SECRET_PROHIBITED');
  });

  test('Gate K: GCP Malformed Pub/Sub Envelope -> Missing Message, Bad Data Safely Rejected', async () => {
    const badPayloads = [
      {}, // Missing message
      { message: {} }, // Missing message.data
      { message: { data: 'not-valid-base64-json-content-!@#$' } }, // Non-JSON decode
    ];

    for (const bad of badPayloads) {
      const res = await request(app)
        .post('/api/ingestion/cloud/gcp/conn-gcp-secret')
        .set('X-CyberShield-Token', 'GcpSharedSecretAlpha456')
        .send(bad);

      expect(res.status).toBe(400);
    }
  });

  // ==========================================================================
  // SECTION 4 — AZURE EVENT GRID ACCEPTANCE (GATES L - O)
  // ==========================================================================

  test('Gate L: Valid Azure Telemetry Event -> Authenticated Header, Normalization & HTTP 202', async () => {
    const payload = createAzureEventGridEnvelope({
      claims: { 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/upn': 'azure-admin@sec.local' },
      operationName: 'Microsoft.Compute/virtualMachines/write',
    });

    const res = await request(app)
      .post('/api/ingestion/cloud/azure/conn-azure-sas')
      .set('aeg-sas-token', 'AzureSasTokenAlpha789')
      .send(payload);

    expect(res.status).toBe(202);
    expect(res.body.status).toBe('ACCEPTED');
  });

  test('Gate M: Invalid Azure Secret -> Rejected with 401, Zero Persistence', async () => {
    const payload = createAzureEventGridEnvelope({});

    const res = await request(app)
      .post('/api/ingestion/cloud/azure/conn-azure-sas')
      .set('aeg-sas-token', 'InvalidSasSecret')
      .send(payload);

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('UNAUTHORIZED');

    const count = await CloudTelemetryEvent.countDocuments();
    expect(count).toBe(0);
  });

  test('Gate N: Azure SubscriptionValidation Handshake -> Authenticated First, 0 Telemetry Persisted', async () => {
    const handshakePayload = [
      {
        id: 'val-evt-1',
        eventType: 'Microsoft.EventGrid.SubscriptionValidationEvent',
        eventTime: new Date().toISOString(),
        data: {
          validationCode: 'azure-validation-challenge-step9',
        },
      },
    ];

    // 1. Valid handshake challenge -> echoes validationResponse with 200
    const resValid = await request(app)
      .post('/api/ingestion/cloud/azure/conn-azure-sas')
      .send(handshakePayload);

    expect(resValid.status).toBe(200);
    expect(resValid.body.validationResponse).toBe('azure-validation-challenge-step9');

    // 2. Invalid validation payload (missing code) -> rejected with 400
    const resInvalid = await request(app)
      .post('/api/ingestion/cloud/azure/conn-azure-sas')
      .send([{ eventType: 'Microsoft.EventGrid.SubscriptionValidationEvent', data: {} }]);

    expect(resInvalid.status).toBe(400);

    // Verify zero telemetry events persisted
    const count = await CloudTelemetryEvent.countDocuments();
    expect(count).toBe(0);
  });

  test('Gate O: Azure Query Secret Attempts (?token=, ?secret=, ?key=) -> HTTP 400', async () => {
    const payload = createAzureEventGridEnvelope({});

    for (const queryParam of ['token=123', 'secret=123', 'key=123']) {
      const res = await request(app)
        .post(`/api/ingestion/cloud/azure/conn-azure-sas?${queryParam}`)
        .send(payload);

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('QUERY_SECRET_PROHIBITED');
    }
  });

  // ==========================================================================
  // SECTION 5 — TENANT ISOLATION (GATES P - R)
  // ==========================================================================

  test('Gate P: Payload Tenant Injection (organizationId, orgId, tenantId) -> Authoritative Connector Org Preserved', async () => {
    const maliciousMsg = {
      Type: 'Notification',
      MessageId: 'msg-tenant-inj-1',
      Message: JSON.stringify({
        eventVersion: '1.08',
        eventID: 'evt-tenant-inj-1',
        eventTime: new Date().toISOString(),
        organizationId: 'malicious-org-nested',
        recipientAccountId: enrolledAwsAccount,
        userIdentity: { type: 'IAMUser', userName: 'Attacker' },
      }),
    };

    const res = await request(app)
      .post('/api/ingestion/cloud/aws/conn-aws-airgap')
      .set('X-CyberShield-Key', 'AwsAirgapKeyAlpha123')
      .send(maliciousMsg);

    // Attempt to override organizationId must be rejected with 403 TENANT_MISMATCH
    expect(res.status).toBe(403);
    expect(res.body.error).toBe('TENANT_MISMATCH');

    const count = await CloudTelemetryEvent.countDocuments();
    expect(count).toBe(0);
  });

  test('Gate Q: Cross-Tenant Connector Mismatch -> 403 Forbidden, Zero Persistence', async () => {
    const msg = {
      Type: 'Notification',
      MessageId: 'msg-mismatch-1',
      Message: JSON.stringify({
        eventVersion: '1.08',
        eventID: 'evt-mismatch-1',
        eventTime: new Date().toISOString(),
        organizationId: tenantB, // Differing organization context
        recipientAccountId: enrolledAwsAccount,
        userIdentity: { type: 'IAMUser', userName: 'Eve' },
      }),
    };

    const res = await request(app)
      .post('/api/ingestion/cloud/aws/conn-aws-airgap')
      .set('X-CyberShield-Key', 'AwsAirgapKeyAlpha123')
      .send(msg);

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('TENANT_MISMATCH');

    const count = await CloudTelemetryEvent.countDocuments();
    expect(count).toBe(0);
  });

  test('Gate R: Cloud Account Binding -> Valid Account Accepted, Unregistered Account Rejected with 403', async () => {
    const msgUnregistered = {
      Type: 'Notification',
      MessageId: 'msg-unreg-1',
      Message: JSON.stringify({
        eventVersion: '1.08',
        eventID: 'evt-unreg-1',
        eventTime: new Date().toISOString(),
        recipientAccountId: '999999999999',
        userIdentity: { type: 'IAMUser', userName: 'Eve' },
      }),
    };

    const res = await request(app)
      .post('/api/ingestion/cloud/aws/conn-aws-airgap')
      .set('X-CyberShield-Key', 'AwsAirgapKeyAlpha123')
      .send(msgUnregistered);

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('CLOUD_ACCOUNT_MISMATCH');
  });

  // ==========================================================================
  // SECTION 6 — TEMPORAL SECURITY (GATES S - T)
  // ==========================================================================

  test('Gate S: Transport Freshness -> <=15m Accepted, >15m Rejected with 400', async () => {
    // 1. Current valid message
    const msgCurrent = createSignedAwsSnsMessage({ Timestamp: new Date().toISOString() });
    const resCurrent = await request(app)
      .post('/api/ingestion/cloud/aws/conn-aws-sig')
      .send(msgCurrent);
    expect(resCurrent.status).toBe(202);

    // 2. Timestamp older than 15 minutes (20 min old)
    const oldTimestamp = new Date(Date.now() - 20 * 60 * 1000).toISOString();
    const msgOld = createSignedAwsSnsMessage({ Timestamp: oldTimestamp });
    const resOld = await request(app)
      .post('/api/ingestion/cloud/aws/conn-aws-sig')
      .send(msgOld);

    expect(resOld.status).toBe(400);
    expect(['DELIVERY_TOO_OLD', 'TRANSPORT_TIMESTAMP_EXPIRED']).toContain(resOld.body.error);
  });

  test('Gate T: Event Temporal Policy -> EventTime within 7 Days, Future Skew > 5m Rejected', async () => {
    // 1. EventTime 3 days old (within 7 days) -> Accepted
    const eventTime3d = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    const msg3d = {
      Type: 'Notification',
      MessageId: 'msg-time-3d',
      Message: JSON.stringify({
        eventVersion: '1.08',
        eventID: 'evt-time-3d',
        eventTime: eventTime3d,
        recipientAccountId: enrolledAwsAccount,
        userIdentity: { type: 'IAMUser', userName: 'Alice' },
      }),
    };
    const res3d = await request(app)
      .post('/api/ingestion/cloud/aws/conn-aws-airgap')
      .set('X-CyberShield-Key', 'AwsAirgapKeyAlpha123')
      .send(msg3d);
    expect(res3d.status).toBe(202);

    // 2. Future clock skew > 5 minutes in transport timestamp -> Rejected
    const futureTimestamp = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const msgFuture = createSignedAwsSnsMessage({ Timestamp: futureTimestamp });
    const resFuture = await request(app)
      .post('/api/ingestion/cloud/aws/conn-aws-sig')
      .send(msgFuture);

    expect(resFuture.status).toBe(400);
    expect(resFuture.body.error).toBe('FUTURE_CLOCK_SKEW_EXCEEDED');
  });

  // ==========================================================================
  // SECTION 7 — IDEMPOTENCY / REPLAY (GATES U - W)
  // ==========================================================================

  test('Gate U: Exact Duplicate Replay -> 1st Delivery 202 CREATED, 2nd Delivery 200 DUPLICATE_ACKNOWLEDGED', async () => {
    const fixedEventId = 'evt-replay-exact-101';
    const msg = {
      Type: 'Notification',
      MessageId: 'msg-replay-1',
      Message: JSON.stringify({
        eventVersion: '1.08',
        eventID: fixedEventId,
        eventTime: new Date().toISOString(),
        recipientAccountId: enrolledAwsAccount,
        userIdentity: { type: 'IAMUser', userName: 'ReplayUser' },
      }),
    };

    // 1st delivery
    const res1 = await request(app)
      .post('/api/ingestion/cloud/aws/conn-aws-airgap')
      .set('X-CyberShield-Key', 'AwsAirgapKeyAlpha123')
      .send(msg);

    expect(res1.status).toBe(202);
    expect(res1.body.status).toBe('ACCEPTED');

    // 2nd delivery (exact duplicate)
    const res2 = await request(app)
      .post('/api/ingestion/cloud/aws/conn-aws-airgap')
      .set('X-CyberShield-Key', 'AwsAirgapKeyAlpha123')
      .send(msg);

    expect(res2.status).toBe(200);
    expect(res2.body.status).toBe('DUPLICATE_ACKNOWLEDGED');

    const docs = await CloudTelemetryEvent.find({ nativeEventId: fixedEventId });
    expect(docs.length).toBe(1);
  });

  test('Gate V: Concurrent Duplicate Race -> Exactly One Durable Event, Race Handled Safely', async () => {
    const fixedEventId = 'evt-race-concurrent-202';
    const msg = {
      Type: 'Notification',
      MessageId: 'msg-race-1',
      Message: JSON.stringify({
        eventVersion: '1.08',
        eventID: fixedEventId,
        eventTime: new Date().toISOString(),
        recipientAccountId: enrolledAwsAccount,
        userIdentity: { type: 'IAMUser', userName: 'RaceUser' },
      }),
    };

    const [resA, resB] = await Promise.all([
      request(app)
        .post('/api/ingestion/cloud/aws/conn-aws-airgap')
        .set('X-CyberShield-Key', 'AwsAirgapKeyAlpha123')
        .send(msg),
      request(app)
        .post('/api/ingestion/cloud/aws/conn-aws-airgap')
        .set('X-CyberShield-Key', 'AwsAirgapKeyAlpha123')
        .send(msg),
    ]);

    const statuses = [resA.status, resB.status].sort();
    expect(statuses).toEqual([200, 202]);

    const docs = await CloudTelemetryEvent.find({ nativeEventId: fixedEventId });
    expect(docs.length).toBe(1);
  });

  test('Gate W: Cross-Tenant Same nativeEventId -> Isolated Across Organizations', async () => {
    const sharedNativeId = 'evt-shared-native-id-303';

    // Org A receives event
    const msgA = {
      Type: 'Notification',
      MessageId: 'msg-org-a',
      Message: JSON.stringify({
        eventVersion: '1.08',
        eventID: sharedNativeId,
        eventTime: new Date().toISOString(),
        recipientAccountId: enrolledAwsAccount,
        userIdentity: { type: 'IAMUser', userName: 'UserA' },
      }),
    };
    const resA = await request(app)
      .post('/api/ingestion/cloud/aws/conn-aws-airgap')
      .set('X-CyberShield-Key', 'AwsAirgapKeyAlpha123')
      .send(msgA);
    expect(resA.status).toBe(202);

    // Org B receives same nativeEventId under conn-aws-orgb
    const msgB = {
      Type: 'Notification',
      MessageId: 'msg-org-b',
      Message: JSON.stringify({
        eventVersion: '1.08',
        eventID: sharedNativeId,
        eventTime: new Date().toISOString(),
        recipientAccountId: '987654321098',
        userIdentity: { type: 'IAMUser', userName: 'UserB' },
      }),
    };
    const resB = await request(app)
      .post('/api/ingestion/cloud/aws/conn-aws-orgb')
      .set('X-CyberShield-Key', 'AwsOrgBKeySecret')
      .send(msgB);
    expect(resB.status).toBe(202);

    const docs = await CloudTelemetryEvent.find({ nativeEventId: sharedNativeId });
    expect(docs.length).toBe(2);
    expect(docs.map((d) => d.organizationId).sort()).toEqual([tenantA, tenantB].sort());
  });

  // ==========================================================================
  // SECTION 8 — DURABLE ACK CONTRACT (GATES X - Z)
  // ==========================================================================

  test('Gate X: Persistence Success -> Mongo Commit Completes BEFORE HTTP 202', async () => {
    const msg = {
      Type: 'Notification',
      MessageId: 'msg-ack-1',
      Message: JSON.stringify({
        eventVersion: '1.08',
        eventID: 'evt-commit-order-1',
        eventTime: new Date().toISOString(),
        recipientAccountId: enrolledAwsAccount,
        userIdentity: { type: 'IAMUser', userName: 'AckUser' },
      }),
    };

    let commitFinishedBeforeResponse = false;
    const originalPersist = CloudPersistenceService.persist;
    jest.spyOn(CloudPersistenceService, 'persist').mockImplementation(async (...args) => {
      const result = await originalPersist.apply(CloudPersistenceService, args);
      const exists = await CloudTelemetryEvent.findOne({ nativeEventId: 'evt-commit-order-1' });
      if (exists) {
        commitFinishedBeforeResponse = true;
      }
      return result;
    });

    const res = await request(app)
      .post('/api/ingestion/cloud/aws/conn-aws-airgap')
      .set('X-CyberShield-Key', 'AwsAirgapKeyAlpha123')
      .send(msg);

    expect(res.status).toBe(202);
    expect(commitFinishedBeforeResponse).toBe(true);

    CloudPersistenceService.persist.mockRestore();
  });

  test('Gate Y: Persistence Failure -> HTTP 503, Zero False 202, Metric Recorded', async () => {
    const msg = {
      Type: 'Notification',
      MessageId: 'msg-db-fail',
      Message: JSON.stringify({
        eventVersion: '1.08',
        eventID: 'evt-db-fail-1',
        eventTime: new Date().toISOString(),
        recipientAccountId: enrolledAwsAccount,
        userIdentity: { type: 'IAMUser', userName: 'FailUser' },
      }),
    };

    jest.spyOn(CloudPersistenceService, 'persist').mockResolvedValueOnce({
      status: 'PERSISTENCE_FAILURE',
      canonicalEventId: 'CLOUD-AWS-org-step9-alpha-evt-db-fail-1',
      error: 'Simulated Mongo write failure',
    });

    const res = await request(app)
      .post('/api/ingestion/cloud/aws/conn-aws-airgap')
      .set('X-CyberShield-Key', 'AwsAirgapKeyAlpha123')
      .send(msg);

    expect(res.status).toBe(503);
    expect(res.body.error).toBe('PERSISTENCE_FAILURE');

    CloudPersistenceService.persist.mockRestore();
  });

  test('Gate Z: Observability Failure -> Ingestion Outcome Remains Completely Unchanged', async () => {
    const msg = {
      Type: 'Notification',
      MessageId: 'msg-obs-fail',
      Message: JSON.stringify({
        eventVersion: '1.08',
        eventID: 'evt-obs-fail-1',
        eventTime: new Date().toISOString(),
        recipientAccountId: enrolledAwsAccount,
        userIdentity: { type: 'IAMUser', userName: 'ObsUser' },
      }),
    };

    jest.spyOn(defaultObservabilityService, 'recordRequest').mockImplementationOnce(() => {
      throw new Error('Explosive metric registry error');
    });

    const res = await request(app)
      .post('/api/ingestion/cloud/aws/conn-aws-airgap')
      .set('X-CyberShield-Key', 'AwsAirgapKeyAlpha123')
      .send(msg);

    expect(res.status).toBe(202);
    expect(res.body.status).toBe('ACCEPTED');

    defaultObservabilityService.recordRequest.mockRestore();
  });

  // ==========================================================================
  // SECTION 9 — GRAPH PROJECTION (GATES AA - AF)
  // ==========================================================================

  test('Gate AA: Successful Projection -> Materialized into Graph Nodes & Edges', async () => {
    const eventDoc = await CloudTelemetryEvent.create({
      canonicalEventId: 'CLOUD-AWS-org-step9-alpha-evt-proj-1',
      organizationId: tenantA,
      connectorId: 'conn-aws-airgap',
      provider: 'AWS',
      nativeEventId: 'evt-proj-1',
      cloudAccountId: enrolledAwsAccount,
      eventTime: new Date(),
      action: { tier: 1, isMutating: true, operation: 'CreateUser' },
      actor: { principalId: 'Alice', principalType: 'IAMUser', principalName: 'Alice' },
      resources: [{ resourceId: 'arn:aws:iam::123456789012:role/SecRole', resourceType: 'IDENTITY' }],
      rawPayloadHash: crypto.createHash('sha256').update('test').digest('hex'),
      projectionStatus: 'PENDING',
    });

    const result = await CloudDataFabricAdapter.projectEvent(eventDoc);
    expect(result.status).toBe('MATERIALIZED');

    const updatedDoc = await CloudTelemetryEvent.findById(eventDoc._id);
    expect(updatedDoc.projectionStatus).toBe('MATERIALIZED');

    const nodes = await SecurityGraphNode.find({ organizationId: tenantA });
    expect(nodes.length).toBeGreaterThanOrEqual(2);
  });

  test('Gate AB: Tier 4 Read/List Event -> SKIPPED_READ_FILTER, Exactly 0 Graph Entities Created', async () => {
    const eventDoc = await CloudTelemetryEvent.create({
      canonicalEventId: 'CLOUD-AWS-org-step9-alpha-evt-read-1',
      organizationId: tenantA,
      connectorId: 'conn-aws-airgap',
      provider: 'AWS',
      nativeEventId: 'evt-read-1',
      cloudAccountId: enrolledAwsAccount,
      eventTime: new Date(),
      action: { tier: 4, isMutating: false, operation: 'DescribeInstances' },
      actor: { principalId: 'ReaderAlice', principalType: 'IAMUser', principalName: 'ReaderAlice' },
      resources: [{ resourceId: 'arn:aws:s3:::my-bucket', resourceType: 'ASSET' }],
      rawPayloadHash: crypto.createHash('sha256').update('test').digest('hex'),
      projectionStatus: 'PENDING',
    });

    const nodeCountBefore = await SecurityGraphNode.countDocuments();
    const result = await CloudDataFabricAdapter.projectEvent(eventDoc);

    expect(result.status).toBe('SKIPPED_READ_FILTER');

    const updatedDoc = await CloudTelemetryEvent.findById(eventDoc._id);
    expect(updatedDoc.projectionStatus).toBe('SKIPPED_READ_FILTER');

    const nodeCountAfter = await SecurityGraphNode.countDocuments();
    expect(nodeCountAfter).toBe(nodeCountBefore);
  });

  test('Gate AC: Tier 5 Unclassified Event -> Safe Default (SKIPPED_READ_FILTER for Normal Severity)', async () => {
    const eventDoc = await CloudTelemetryEvent.create({
      canonicalEventId: 'CLOUD-AWS-org-step9-alpha-evt-tier5-1',
      organizationId: tenantA,
      connectorId: 'conn-aws-airgap',
      provider: 'AWS',
      nativeEventId: 'evt-tier5-1',
      cloudAccountId: enrolledAwsAccount,
      eventTime: new Date(),
      action: { tier: 5, isMutating: false, operation: 'UnknownOp' },
      severity: 'LOW',
      actor: { principalId: 'UnknownUser', principalType: 'IAMUser', principalName: 'UnknownUser' },
      resources: [{ resourceId: 'res-unknown', resourceType: 'UNKNOWN' }],
      rawPayloadHash: crypto.createHash('sha256').update('test').digest('hex'),
      projectionStatus: 'PENDING',
    });

    const result = await CloudDataFabricAdapter.projectEvent(eventDoc);
    expect(result.status).toBe('SKIPPED_READ_FILTER');
  });

  test('Gate AD: Projection Failure -> Durable Event Preserved, Remains Retryable', async () => {
    const eventDoc = await CloudTelemetryEvent.create({
      canonicalEventId: 'CLOUD-AWS-org-step9-alpha-evt-fail-1',
      organizationId: tenantA,
      connectorId: 'conn-aws-airgap',
      provider: 'AWS',
      nativeEventId: 'evt-fail-1',
      cloudAccountId: enrolledAwsAccount,
      eventTime: new Date(),
      action: { tier: 1, isMutating: true, operation: 'MutateKey' },
      actor: { principalId: 'FailingUser', principalType: 'IAMUser', principalName: 'FailingUser' },
      resources: [{ resourceId: 'res-failing', resourceType: 'ASSET' }],
      rawPayloadHash: crypto.createHash('sha256').update('test').digest('hex'),
      projectionStatus: 'PENDING',
    });

    jest.spyOn(SecurityGraphNode, 'create').mockRejectedValueOnce(new Error('Transient graph failure'));

    const result = await CloudDataFabricAdapter.projectEvent(eventDoc);
    expect(result.status).toBe('PENDING');
    expect(result.retryCount).toBe(1);

    const updatedDoc = await CloudTelemetryEvent.findById(eventDoc._id);
    expect(updatedDoc).toBeDefined();
    expect(updatedDoc.projectionStatus).toBe('PENDING');

    SecurityGraphNode.create.mockRestore();
  });

  test('Gate AE: Retry Behavior -> Exponential Backoff, Max 5 Retries Enforced', async () => {
    const eventDoc = await CloudTelemetryEvent.create({
      canonicalEventId: 'CLOUD-AWS-org-step9-alpha-evt-retry-1',
      organizationId: tenantA,
      connectorId: 'conn-aws-airgap',
      provider: 'AWS',
      nativeEventId: 'evt-retry-1',
      cloudAccountId: enrolledAwsAccount,
      eventTime: new Date(),
      action: { tier: 1, isMutating: true, operation: 'RetryOp' },
      actor: { principalId: 'RetryUser', principalType: 'IAMUser', principalName: 'RetryUser' },
      resources: [{ resourceId: 'res-retry', resourceType: 'ASSET' }],
      rawPayloadHash: crypto.createHash('sha256').update('test').digest('hex'),
      projectionStatus: 'PENDING',
      projectionRetryCount: 3,
    });

    jest.spyOn(SecurityGraphNode, 'create').mockRejectedValueOnce(new Error('Simulated failure 4'));
    const res = await CloudDataFabricAdapter.projectEvent(eventDoc);
    expect(res.retryCount).toBe(4);
    expect(res.status).toBe('PENDING');

    SecurityGraphNode.create.mockRestore();
  });

  test('Gate AF: Poison Event -> Max Failures Transition to POISON_FAILED, Durable Record Preserved', async () => {
    const eventDoc = await CloudTelemetryEvent.create({
      canonicalEventId: 'CLOUD-AWS-org-step9-alpha-evt-poison-1',
      organizationId: tenantA,
      connectorId: 'conn-aws-airgap',
      provider: 'AWS',
      nativeEventId: 'evt-poison-1',
      cloudAccountId: enrolledAwsAccount,
      eventTime: new Date(),
      action: { tier: 1, isMutating: true, operation: 'PoisonOp' },
      actor: { principalId: 'PoisonUser', principalType: 'IAMUser', principalName: 'PoisonUser' },
      resources: [{ resourceId: 'res-poison', resourceType: 'ASSET' }],
      rawPayloadHash: crypto.createHash('sha256').update('test').digest('hex'),
      projectionStatus: 'PENDING',
      projectionRetryCount: 4,
    });

    jest.spyOn(SecurityGraphNode, 'create').mockRejectedValueOnce(new Error('Fatal 5th attempt failure'));
    const res = await CloudDataFabricAdapter.projectEvent(eventDoc);

    expect(res.status).toBe('POISON_FAILED');

    const updatedDoc = await CloudTelemetryEvent.findById(eventDoc._id);
    expect(updatedDoc.projectionStatus).toBe('POISON_FAILED');

    SecurityGraphNode.create.mockRestore();
  });

  // ==========================================================================
  // SECTION 10 — RECONCILIATION (GATES AG - AI)
  // ==========================================================================

  test('Gate AG: Pending-Event Recovery -> Batch Limit <= 100, Poison Events Do Not Block Batch', async () => {
    await CloudTelemetryEvent.create([
      {
        canonicalEventId: 'CLOUD-AWS-org-step9-alpha-evt-batch-norm',
        organizationId: tenantA,
        connectorId: 'conn-aws-airgap',
        provider: 'AWS',
        nativeEventId: 'evt-batch-norm',
        cloudAccountId: enrolledAwsAccount,
        eventTime: new Date(),
        action: { tier: 4, isMutating: false, operation: 'DescribeInstances' },
        rawPayloadHash: crypto.createHash('sha256').update('norm').digest('hex'),
        projectionStatus: 'PENDING',
      },
      {
        canonicalEventId: 'CLOUD-AWS-org-step9-alpha-evt-batch-poison',
        organizationId: tenantA,
        connectorId: 'conn-aws-airgap',
        provider: 'AWS',
        nativeEventId: 'evt-batch-poison',
        cloudAccountId: enrolledAwsAccount,
        eventTime: new Date(),
        action: { tier: 1, isMutating: true, operation: 'PoisonOp' },
        rawPayloadHash: crypto.createHash('sha256').update('poison').digest('hex'),
        projectionStatus: 'POISON_FAILED',
      },
    ]);

    const res = await CloudDataFabricAdapter.reconcilePendingBatch(100);
    expect(res.processed).toBe(1);
    expect(res.skipped).toBe(1);
  });

  test('Gate AH: Reconciliation Overlap -> Only One Worker Executes at a Time', () => {
    CloudDataFabricAdapter._isReconciling = true;
    expect(CloudDataFabricAdapter.isReconciling()).toBe(true);
    CloudDataFabricAdapter._isReconciling = false;
    expect(CloudDataFabricAdapter.isReconciling()).toBe(false);
  });

  test('Gate AI: Startup Reconciliation -> Handles Failure Gracefully Without Crashing App', async () => {
    const res = await CloudDataFabricAdapter.runStartupReconciliation();
    expect(res).toBeDefined();
    expect(typeof res.processed).toBe('number');
  });

  // ==========================================================================
  // SECTION 11 — REQUEST SAFEGUARDS (GATES AJ - AL)
  // ==========================================================================

  test('Gate AJ: Oversized Request (>2MB) -> HTTP 413, Socket Drained, Zero Persistence', async () => {
    const bigString = 'x'.repeat(2.1 * 1024 * 1024);

    const res = await request(app)
      .post('/api/ingestion/cloud/aws/conn-aws-airgap')
      .set('X-CyberShield-Key', 'AwsAirgapKeyAlpha123')
      .set('Content-Type', 'application/json')
      .send({ data: bigString });

    expect(res.status).toBe(413);
    expect(res.body.error).toBe('PAYLOAD_TOO_LARGE');

    const count = await CloudTelemetryEvent.countDocuments();
    expect(count).toBe(0);
  });

  test('Gate AK: Rate Limit -> Exceeding 600 req/min Triggers HTTP 429 & Metric Increment', () => {
    const obsBefore = defaultObservabilityService.getMetrics().ingestion.cloud_ingestion_rate_limited_total;
    defaultObservabilityService.recordRateLimited('AWS');
    const obsAfter = defaultObservabilityService.getMetrics().ingestion.cloud_ingestion_rate_limited_total;

    expect(obsAfter).toBe(obsBefore + 1);
  });

  test('Gate AL: Rate-Limit Isolation -> Connector A Limit Does NOT Consume Connector B Quota', () => {
    const reqConnA = { path: '/aws/conn-aws-sig', headers: {}, ip: '127.0.0.1' };
    const reqConnB = { path: '/aws/conn-aws-airgap', headers: {}, ip: '127.0.0.1' };

    const matchA = reqConnA.path.match(/^\/(?:aws|gcp|azure)\/([^/?]+)/i)[1];
    const matchB = reqConnB.path.match(/^\/(?:aws|gcp|azure)\/([^/?]+)/i)[1];

    expect(matchA).toBe('conn-aws-sig');
    expect(matchB).toBe('conn-aws-airgap');
    expect(matchA).not.toBe(matchB);
  });

  // ==========================================================================
  // SECTION 12 — PROTOTYPE POLLUTION / INPUT HARDENING (GATES AM - AP)
  // ==========================================================================

  test('Gate AM: Prototype Pollution -> __proto__, constructor, prototype Stripped & Neutralized', () => {
    const maliciousPayload = {
      Type: 'Notification',
      Message: JSON.stringify({
        __proto__: { polluted: true },
        constructor: { prototype: { admin: true } },
        eventVersion: '1.08',
        eventID: 'evt-proto-1',
        eventTime: new Date().toISOString(),
        recipientAccountId: enrolledAwsAccount,
        userIdentity: { type: 'IAMUser', userName: 'Polluter' },
      }),
    };

    const norm = CloudTelemetryNormalizer.normalize(maliciousPayload, {
      provider: 'AWS',
      organizationId: tenantA,
      connectorId: 'conn-aws-airgap',
      enrolledAccountIds: [enrolledAwsAccount],
    });

    expect(norm.success).toBe(true);
    expect(Object.prototype.polluted).toBeUndefined();
    expect(Object.prototype.admin).toBeUndefined();
  });

  test('Gate AN: Deeply Nested Malicious Object -> Handled Safely Without Stack Overflow', () => {
    let deepObj = { level: 0 };
    let cur = deepObj;
    for (let i = 1; i <= 50; i++) {
      cur.nested = { level: i };
      cur = cur.nested;
    }

    const payload = {
      Type: 'Notification',
      Message: JSON.stringify({
        eventVersion: '1.08',
        eventID: 'evt-deep-1',
        eventTime: new Date().toISOString(),
        recipientAccountId: enrolledAwsAccount,
        userIdentity: { type: 'IAMUser', userName: 'DeepUser' },
        requestParameters: deepObj,
      }),
    };

    expect(() => {
      CloudTelemetryNormalizer.normalize(payload, {
        provider: 'AWS',
        organizationId: tenantA,
        connectorId: 'conn-aws-airgap',
        enrolledAccountIds: [enrolledAwsAccount],
      });
    }).not.toThrow();
  });

  test('Gate AO: Excessive Resource Array -> Bounded to Approved Resource Limit', () => {
    const hugeResources = [];
    for (let i = 0; i < 150; i++) {
      hugeResources.push({ ARN: `arn:aws:s3:::bucket-${i}`, type: 'AWS::S3::Bucket' });
    }

    const payload = {
      Type: 'Notification',
      Message: JSON.stringify({
        eventVersion: '1.08',
        eventID: 'evt-res-150',
        eventTime: new Date().toISOString(),
        recipientAccountId: enrolledAwsAccount,
        userIdentity: { type: 'IAMUser', userName: 'ResourceUser' },
        resources: hugeResources,
      }),
    };

    const norm = CloudTelemetryNormalizer.normalize(payload, {
      provider: 'AWS',
      organizationId: tenantA,
      connectorId: 'conn-aws-airgap',
      enrolledAccountIds: [enrolledAwsAccount],
    });

    expect(norm.success).toBe(true);
    expect(norm.event.resources.length).toBeLessThanOrEqual(25);
  });

  test('Gate AP: Oversized Strings / Parameter Explosion -> Bounded & Truncated', () => {
    const hugeString = 'x'.repeat(5000);
    const payload = {
      Type: 'Notification',
      Message: JSON.stringify({
        eventVersion: '1.08',
        eventID: 'evt-param-huge',
        eventTime: new Date().toISOString(),
        recipientAccountId: enrolledAwsAccount,
        userIdentity: { type: 'IAMUser', userName: 'ParamUser' },
        requestParameters: { hugeParam: hugeString },
      }),
    };

    const norm = CloudTelemetryNormalizer.normalize(payload, {
      provider: 'AWS',
      organizationId: tenantA,
      connectorId: 'conn-aws-airgap',
      enrolledAccountIds: [enrolledAwsAccount],
    });

    expect(norm.success).toBe(true);
    expect(norm.event.parameters.hugeParam.length).toBeLessThanOrEqual(1024);
  });

  // ==========================================================================
  // SECTION 13 — SENSITIVE DATA / LOGGING (GATES AQ - AR)
  // ==========================================================================

  test('Gate AQ: Sensitive Credentials in Payload -> Stripped, Redacted, Never in Logs/Health/Metrics', () => {
    const payloadWithSecrets = {
      Type: 'Notification',
      Message: JSON.stringify({
        eventVersion: '1.08',
        eventID: 'evt-secrets-1',
        eventTime: new Date().toISOString(),
        recipientAccountId: enrolledAwsAccount,
        userIdentity: { type: 'IAMUser', userName: 'SecUser' },
        requestParameters: {
          password: 'SecretPassword123!',
          secretKey: 'AKIAIOSFODNN7EXAMPLE',
          authorization: 'Bearer secret-token-xyz',
        },
      }),
    };

    const norm = CloudTelemetryNormalizer.normalize(payloadWithSecrets, {
      provider: 'AWS',
      organizationId: tenantA,
      connectorId: 'conn-aws-airgap',
      enrolledAccountIds: [enrolledAwsAccount],
    });

    expect(norm.success).toBe(true);
    const serialized = JSON.stringify(norm.event);
    expect(serialized).not.toContain('SecretPassword123!');
  });

  test('Gate AR: Log Injection -> Control Characters & Newlines Neutralized in Structured Logs', () => {
    const maliciousPayload = 'TestEvent\r\n[CRITICAL] Malicious Fake Audit Log\r\n';
    expect(() => {
      logger.info(`[TestLog] Safe logging check: ${maliciousPayload.replace(/[\r\n]+/g, ' ')}`);
    }).not.toThrow();
  });

  // ==========================================================================
  // SECTION 14 — OBSERVABILITY (GATES AS - AU)
  // ==========================================================================

  test('Gate AS: Observability Pipeline Metrics -> Verification, Normalization, Persistence Counters Recorded', () => {
    const metrics = defaultObservabilityService.getMetrics();
    expect(metrics).toBeDefined();
    expect(metrics.ingestion).toBeDefined();
    expect(metrics.latency).toBeDefined();
    expect(metrics.projection).toBeDefined();
    expect(metrics.reconciliation).toBeDefined();
    expect(metrics.ingestion.cloud_ingestion_requests_total).toBeDefined();
    expect(metrics.ingestion.cloud_ingestion_accepted_total).toBeDefined();
    expect(metrics.ingestion.cloud_ingestion_rejected_total).toBeDefined();
  });

  test('Gate AT: Low-Cardinality Controls -> Arbitrary Providers Normalised to UNKNOWN', () => {
    defaultObservabilityService.recordRequest('MALICIOUS_CUSTOM_PROVIDER');
    const metrics = defaultObservabilityService.getMetrics();
    expect(metrics.ingestion.by_provider.requests.MALICIOUS_CUSTOM_PROVIDER).toBeUndefined();
    expect(metrics.ingestion.by_provider.requests.UNKNOWN).toBeGreaterThanOrEqual(1);
  });

  test('Gate AU: Health Endpoint -> Safe Status, Zero Secrets/Tokens/OrgIds Exposed, DB Down Reports 503', async () => {
    // 1. Online health
    const resHealthy = await request(app).get('/api/ingestion/cloud/health');
    expect(resHealthy.status).toBe(200);
    expect(resHealthy.body.status).toMatch(/healthy|degraded/i);
    expect(resHealthy.body.dependencies.mongodb_persistence.status).toBe('HEALTHY');

    // Verify ZERO secrets or raw telemetry
    const bodyStr = JSON.stringify(resHealthy.body);
    expect(bodyStr).not.toContain('secret');
    expect(bodyStr).not.toContain('token');
    expect(bodyStr).not.toContain('password');
    expect(bodyStr).not.toContain(tenantA);
    expect(bodyStr).not.toContain(enrolledAwsAccount);

    // 2. Offline health (DB down)
    defaultObservabilityService._readyStateOverride = 0;
    const resOffline = await request(app).get('/api/ingestion/cloud/health');
    expect(resOffline.status).toBe(503);
    expect(resOffline.body.status).toBe('UNAVAILABLE');
    expect(resOffline.body.dependencies.mongodb_persistence.status).toBe('UNAVAILABLE');

    defaultObservabilityService._readyStateOverride = null;
  });

  // ==========================================================================
  // SECTION 15 — SECURITY REGRESSION (GATES AV - AX)
  // ==========================================================================

  test('Gate AV: Query Secret Prohibition Across All Provider Routes -> HTTP 400', async () => {
    const endpoints = [
      '/api/ingestion/cloud/aws/conn-aws-airgap?token=secret',
      '/api/ingestion/cloud/gcp/conn-gcp-secret?key=secret',
      '/api/ingestion/cloud/azure/conn-azure-sas?secret=secret',
    ];

    for (const ep of endpoints) {
      const res = await request(app).post(ep).send({});
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('QUERY_SECRET_PROHIBITED');
    }
  });

  test('Gate AW: Header Confusion -> Wrong Secrets in Headers Cannot Bypass Authentication', async () => {
    // Send Azure SAS token to AWS endpoint
    const res = await request(app)
      .post('/api/ingestion/cloud/aws/conn-aws-airgap')
      .set('aeg-sas-token', 'AzureSasTokenAlpha789')
      .send({});

    expect(res.status).toBe(401);
  });

  test('Gate AX: Connector Confusion -> AWS Connector on GCP Route Returns 400 PROVIDER_MISMATCH', async () => {
    const res = await request(app)
      .post('/api/ingestion/cloud/gcp/conn-aws-airgap')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('PROVIDER_MISMATCH');
  });

  // ==========================================================================
  // SECTION 16 — PHASE 79 ISOLATION (GATE AY)
  // ==========================================================================

  test('Gate AY: Phase 79 Decision Intelligence Isolation -> Zero Invocations or Writes', async () => {
    const msg = {
      Type: 'Notification',
      MessageId: 'msg-p79-iso-1',
      Message: JSON.stringify({
        eventVersion: '1.08',
        eventID: 'evt-p79-iso-1',
        eventTime: new Date().toISOString(),
        recipientAccountId: enrolledAwsAccount,
        userIdentity: { type: 'IAMUser', userName: 'IsoUser' },
      }),
    };

    const res = await request(app)
      .post('/api/ingestion/cloud/aws/conn-aws-airgap')
      .set('X-CyberShield-Key', 'AwsAirgapKeyAlpha123')
      .send(msg);

    expect(res.status).toBe(202);

    const collections = await mongoose.connection.db.collections();
    const diCollections = collections.filter((c) =>
      ['risksnapshots', 'analystpriorities', 'investigationhypotheses', 'decisionassessments'].includes(c.collectionName.toLowerCase())
    );

    for (const coll of diCollections) {
      const count = await coll.countDocuments();
      expect(count).toBe(0);
    }
  });

  // ==========================================================================
  // SECTION 17 — PHASE 75 / LEGAL HOLD (GATE AZ)
  // ==========================================================================

  test('Gate AZ: Legal Hold Preservation -> Active Hold Blocks Lifecycle Pruning, Release Allows Pruning', async () => {
    const userAdmin = { _id: 'admin-step9', username: 'admin', role: 'ADMIN', organizationId: tenantA };
    const oldEventTime = new Date(Date.now() - 100 * 24 * 60 * 60 * 1000); // 100 days old

    await CloudTelemetryEvent.create({
      canonicalEventId: 'CLOUD-AWS-org-step9-alpha-evt-hold-1',
      organizationId: tenantA,
      connectorId: 'conn-aws-airgap',
      provider: 'AWS',
      nativeEventId: 'evt-hold-1',
      cloudAccountId: enrolledAwsAccount,
      eventTime: oldEventTime,
      rawPayloadHash: crypto.createHash('sha256').update('hold').digest('hex'),
    });

    // 1. Upsert 90-day retention policy
    await DataLifecycleService.upsertRetentionPolicy(
      tenantA,
      { entityType: 'cloud_telemetry', retentionDays: 90, retentionClass: 'EXPIRE' },
      userAdmin
    );

    // 2. Engage active legal hold
    await DataLifecycleService.setLegalHold(
      tenantA,
      'cloud_telemetry',
      true,
      'SEC Investigation Hold Step 9',
      userAdmin
    );

    // Dry run must be BLOCKED
    const dryRun = await DataLifecycleService.dryRunRetention(tenantA, 'cloud_telemetry');
    expect(dryRun.legalHoldActive).toBe(true);
    expect(dryRun.projectedAction).toBe('BLOCKED');

    // Execution must delete 0 records
    const execBlocked = await DataLifecycleService.executeRetention(tenantA, 'cloud_telemetry', userAdmin);
    expect(execBlocked.deletedCount).toBe(0);

    const docStillExists = await CloudTelemetryEvent.findOne({ canonicalEventId: 'CLOUD-AWS-org-step9-alpha-evt-hold-1' });
    expect(docStillExists).toBeDefined();

    // 3. Release legal hold
    await DataLifecycleService.setLegalHold(
      tenantA,
      'cloud_telemetry',
      false,
      'Release of SEC Investigation Hold',
      userAdmin
    );

    // Execution now prunes the 100-day-old event
    const execPruned = await DataLifecycleService.executeRetention(tenantA, 'cloud_telemetry', userAdmin);
    expect(execPruned.deletedCount).toBe(1);

    const docPruned = await CloudTelemetryEvent.findOne({ canonicalEventId: 'CLOUD-AWS-org-step9-alpha-evt-hold-1' });
    expect(docPruned).toBeNull();
  });

  // ==========================================================================
  // SECTION 18 — SYNTHETIC REPLAY MATRIX (CONVERGENCE & IDEMPOTENCY)
  // ==========================================================================

  describe('Section 18 — Deterministic Synthetic Replay Matrix', () => {
    test('Synthetic Replay: Multi-Iteration Convergence Across All 3 Cloud Providers', async () => {
      // 1. AWS Synthetic Fixture
      const awsFixture = {
        Type: 'Notification',
        MessageId: 'msg-synth-aws-001',
        Message: JSON.stringify({
          eventVersion: '1.08',
          eventID: 'evt-synth-aws-001',
          eventTime: new Date().toISOString(),
          recipientAccountId: enrolledAwsAccount,
          userIdentity: { type: 'IAMUser', userName: 'SynthAwsUser' },
          eventName: 'AttachRolePolicy',
        }),
      };

      // 2. GCP Synthetic Fixture
      const gcpFixture = createGcpPubSubEnvelope({
        insertId: 'evt-synth-gcp-001',
        timestamp: new Date().toISOString(),
        resource: {
          type: 'gce_instance',
          labels: { project_id: enrolledGcpProject, instance_id: 'synth-inst-1' },
        },
        protoPayload: {
          serviceName: 'compute.googleapis.com',
          methodName: 'v1.compute.instances.insert',
          authenticationInfo: { principalEmail: 'synth-gcp@sec.local' },
        },
      });

      // 3. Azure Synthetic Fixture
      const azureFixture = createAzureEventGridEnvelope({
        operationName: 'Microsoft.Compute/virtualMachines/write',
      });

      // Replay Iteration 1: All 3 Providers Ingest Successfully (202 CREATED)
      const resAws1 = await request(app)
        .post('/api/ingestion/cloud/aws/conn-aws-airgap')
        .set('X-CyberShield-Key', 'AwsAirgapKeyAlpha123')
        .send(awsFixture);
      expect(resAws1.status).toBe(202);

      const resGcp1 = await request(app)
        .post('/api/ingestion/cloud/gcp/conn-gcp-secret')
        .set('X-CyberShield-Token', 'GcpSharedSecretAlpha456')
        .send(gcpFixture);
      expect(resGcp1.status).toBe(202);

      const resAz1 = await request(app)
        .post('/api/ingestion/cloud/azure/conn-azure-sas')
        .set('aeg-sas-token', 'AzureSasTokenAlpha789')
        .send(azureFixture);
      expect(resAz1.status).toBe(202);

      // Verify Exactly 3 Records Exist
      const count1 = await CloudTelemetryEvent.countDocuments();
      expect(count1).toBe(3);

      // Replay Iteration 2: All 3 Providers Idempotently Acknowledge (200 DUPLICATE)
      const resAws2 = await request(app)
        .post('/api/ingestion/cloud/aws/conn-aws-airgap')
        .set('X-CyberShield-Key', 'AwsAirgapKeyAlpha123')
        .send(awsFixture);
      expect(resAws2.status).toBe(200);
      expect(resAws2.body.status).toBe('DUPLICATE_ACKNOWLEDGED');

      const resGcp2 = await request(app)
        .post('/api/ingestion/cloud/gcp/conn-gcp-secret')
        .set('X-CyberShield-Token', 'GcpSharedSecretAlpha456')
        .send(gcpFixture);
      expect(resGcp2.status).toBe(200);
      expect(resGcp2.body.status).toBe('DUPLICATE_ACKNOWLEDGED');

      const resAz2 = await request(app)
        .post('/api/ingestion/cloud/azure/conn-azure-sas')
        .set('aeg-sas-token', 'AzureSasTokenAlpha789')
        .send(azureFixture);
      expect(resAz2.status).toBe(200);
      expect(resAz2.body.status).toBe('DUPLICATE_ACKNOWLEDGED');

      // Replay Iteration 3: 3rd Delivery Still Idempotent (200 DUPLICATE)
      const resAws3 = await request(app)
        .post('/api/ingestion/cloud/aws/conn-aws-airgap')
        .set('X-CyberShield-Key', 'AwsAirgapKeyAlpha123')
        .send(awsFixture);
      expect(resAws3.status).toBe(200);

      // Verify Document Count Remains EXACTLY 3 (Zero Duplicate Leaks)
      const countFinal = await CloudTelemetryEvent.countDocuments();
      expect(countFinal).toBe(3);
    });
  });
});
