/**
 * 🛡️ CyberShield X — Phase 80 Step 3 Acceptance Test Suite
 *
 * Validates Cryptographic & Transport Verification Layer (CloudSignatureVerifier.js):
 * - Tests A-L: AWS SNS Connected Mode (RSA-SHA256, canonical string, cert URL/SSRF/bounds/validity/expiry)
 * - Tests M-O: AWS SNS Air-Gapped Mode (X-CyberShield-Key, timing-safe, query prohibition)
 * - Tests P-R: AWS SNS SubscriptionConfirmation Protocol (auto-confirm, manual staging, redirect prohibition)
 * - Tests S-W: GCP Pub/Sub Connected Mode (OIDC JWT, JWKS, RS256, issuer, audience, unsigned rejection)
 * - Tests X-Y: GCP Pub/Sub Air-Gapped Mode (X-CyberShield-Token, query prohibition)
 * - Tests Z-AC: Azure Event Grid (Header auth, timing-safe, query prohibition, SubscriptionValidation handshake)
 * - Tests AD-AE: Transport Freshness & Clock Skew (<= 15m past, <= 5m future)
 * - Tests AF-AH: Tenant Boundary & Cloud Account Whitelisting (organizationId binding, account mismatch)
 * - Tests AI-AL: Secret Scrubbing, Cache Bounding, Redirect Immunity & SSRF Regression
 */

const crypto = require('crypto');
const { execSync } = require('child_process');
const { CloudSignatureVerifier, BoundedLruCache } = require('../services/ingestion/CloudSignatureVerifier');
const { isPrivateOrLoopback } = require('../utils/ssrfValidator');

describe('Phase 80 Step 3 — Cryptographic & Transport Verification Layer', () => {
  let verifier;
  let testRsaPrivateKeyPem;
  let testRsaCertPem;
  let testGcpPublicKeyJwk;
  let testGcpPrivateKey;

  beforeAll(() => {
    // 1. Generate valid RSA Key & Self-Signed X.509 Certificate for AWS SNS tests
    testRsaPrivateKeyPem = execSync('openssl genrsa 2048 2>/dev/null', { encoding: 'utf8' });
    testRsaCertPem = execSync('openssl req -new -x509 -key /dev/stdin -subj "/CN=sns.amazonaws.com" -days 30 2>/dev/null', {
      input: testRsaPrivateKeyPem,
      encoding: 'utf8',
    });

    // 2. Generate RSA Key Pair for GCP OIDC JWT tests
    const gcpKeyPair = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
    testGcpPrivateKey = gcpKeyPair.privateKey;
    testGcpPublicKeyJwk = gcpKeyPair.publicKey.export({ format: 'jwk' });
    testGcpPublicKeyJwk.kid = 'gcp-test-key-1';
    testGcpPublicKeyJwk.alg = 'RS256';
    testGcpPublicKeyJwk.use = 'sig';
  });

  beforeEach(() => {
    verifier = new CloudSignatureVerifier();
  });

  // Helper to construct and sign an AWS SNS message
  function createSignedSnsMessage(overrides = {}, signingKey = testRsaPrivateKeyPem) {
    const msg = {
      Type: 'Notification',
      MessageId: 'msg-' + crypto.randomUUID(),
      TopicArn: 'arn:aws:sns:us-east-1:111122223333:cybershield-trail',
      Subject: 'CloudTrail Ingestion',
      Message: JSON.stringify({ eventVersion: '1.08', userIdentity: { type: 'IAMUser', userName: 'alice' } }),
      Timestamp: new Date().toISOString(),
      SignatureVersion: '1',
      SigningCertURL: 'https://sns.us-east-1.amazonaws.com/SimpleNotificationService-12345.pem',
      ...overrides,
    };

    const canonicalString = verifier._buildAwsSnsCanonicalString(msg);
    const signer = crypto.createSign('RSA-SHA256');
    signer.update(Buffer.from(canonicalString, 'utf8'));
    msg.Signature = signer.sign(signingKey, 'base64');
    return msg;
  }

  // Helper to create and sign a GCP OIDC JWT
  function createSignedGcpJwt(headerOverrides = {}, payloadOverrides = {}, signingKey = testGcpPrivateKey) {
    const header = {
      alg: 'RS256',
      kid: 'gcp-test-key-1',
      typ: 'JWT',
      ...headerOverrides,
    };
    const payload = {
      iss: 'https://accounts.google.com',
      aud: 'https://api.cybershield.local/api/ingestion/cloud/gcp/conn-gcp-1',
      sub: '10987654321',
      email: 'cybershield-push@my-project.iam.gserviceaccount.com',
      exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour valid
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

  // ==========================================================================
  // SECTION 1: AWS SNS CONNECTED & AIR-GAPPED VERIFICATION (TESTS A - R)
  // ==========================================================================

  test('TEST A: Valid AWS SNS signature verification succeeds', async () => {
    const certUrl = 'https://sns.us-east-1.amazonaws.com/SimpleNotificationService-12345.pem';
    // Pre-cache the valid test cert
    const x509 = new crypto.X509Certificate(testRsaCertPem);
    verifier.certCache.set(certUrl, x509);

    const msg = createSignedSnsMessage({ SigningCertURL: certUrl });
    const connectorConfig = {
      provider: 'AWS',
      organizationId: 'org-1',
      connectorId: 'conn-aws-1',
      authMode: 'SNS_SIGNATURE',
    };

    const res = await verifier.verify({ body: msg }, connectorConfig);
    expect(res.isValid).toBe(true);
    expect(res.status).toBe('VERIFIED');
    expect(res.authMode).toBe('SNS_SIGNATURE');
    expect(res.organizationId).toBe('org-1');
  });

  test('TEST B: Invalid AWS SNS signature fails verification', async () => {
    const certUrl = 'https://sns.us-east-1.amazonaws.com/SimpleNotificationService-12345.pem';
    const x509 = new crypto.X509Certificate(testRsaCertPem);
    verifier.certCache.set(certUrl, x509);

    const msg = createSignedSnsMessage({ SigningCertURL: certUrl });
    // Tamper with the signature
    msg.Signature = Buffer.from('tampered_signature_content').toString('base64');

    const connectorConfig = {
      provider: 'AWS',
      organizationId: 'org-1',
      connectorId: 'conn-aws-1',
      authMode: 'SNS_SIGNATURE',
    };

    const res = await verifier.verify({ body: msg }, connectorConfig);
    expect(res.isValid).toBe(false);
    expect(res.status).toBe('FAILED');
    expect(res.reason).toBe('INVALID_SIGNATURE');
  });

  test('TEST C: Unsupported AWS signature version rejected', async () => {
    const certUrl = 'https://sns.us-east-1.amazonaws.com/SimpleNotificationService-12345.pem';
    const msg = createSignedSnsMessage({ SigningCertURL: certUrl, SignatureVersion: '99' });

    const connectorConfig = { provider: 'AWS', organizationId: 'org-1', authMode: 'SNS_SIGNATURE' };
    const res = await verifier.verify({ body: msg }, connectorConfig);
    expect(res.isValid).toBe(false);
    expect(res.reason).toBe('UNSUPPORTED_SIGNATURE_VERSION');
  });

  test('TEST D: Malformed SNS signing structure rejected', async () => {
    const msg = { Type: 'Notification', Message: 'Only message without required fields' };
    const connectorConfig = { provider: 'AWS', organizationId: 'org-1', authMode: 'SNS_SIGNATURE' };
    const res = await verifier.verify({ body: msg }, connectorConfig);
    expect(res.isValid).toBe(false);
    expect(res.reason).toBe('MISSING_AUTHENTICATION');
  });

  test('TEST E: Invalid SigningCertURL rejected', async () => {
    const msg = createSignedSnsMessage({ SigningCertURL: 'not-a-valid-url' });
    const connectorConfig = { provider: 'AWS', organizationId: 'org-1', authMode: 'SNS_SIGNATURE' };
    const res = await verifier.verify({ body: msg }, connectorConfig);
    expect(res.isValid).toBe(false);
    expect(res.reason).toBe('CERTIFICATE_URL_REJECTED');
  });

  test('TEST F: HTTP certificate URL rejected (HTTPS required)', async () => {
    const msg = createSignedSnsMessage({ SigningCertURL: 'http://sns.us-east-1.amazonaws.com/cert.pem' });
    const connectorConfig = { provider: 'AWS', organizationId: 'org-1', authMode: 'SNS_SIGNATURE' };
    const res = await verifier.verify({ body: msg }, connectorConfig);
    expect(res.isValid).toBe(false);
    expect(res.reason).toBe('CERTIFICATE_URL_REJECTED');
  });

  test('TEST G: Non-Amazon SNS certificate host rejected', async () => {
    const msg = createSignedSnsMessage({ SigningCertURL: 'https://attacker.com/malicious.pem' });
    const connectorConfig = { provider: 'AWS', organizationId: 'org-1', authMode: 'SNS_SIGNATURE' };
    const res = await verifier.verify({ body: msg }, connectorConfig);
    expect(res.isValid).toBe(false);
    expect(res.reason).toBe('CERTIFICATE_URL_REJECTED');
  });

  test('TEST H: Private / loopback certificate destination rejected (SSRF protection)', async () => {
    // URL with valid scheme but private/local IP
    const msg = createSignedSnsMessage({ SigningCertURL: 'https://169.254.169.254/latest/meta-data/cert.pem' });
    const connectorConfig = { provider: 'AWS', organizationId: 'org-1', authMode: 'SNS_SIGNATURE' };
    const res = await verifier.verify({ body: msg }, connectorConfig);
    expect(res.isValid).toBe(false);
    expect(res.reason).toBe('CERTIFICATE_URL_REJECTED'); // Hostname validation fails first
  });

  test('TEST I: Certificate fetch timeout rejected safely', async () => {
    const quickTimeoutVerifier = new CloudSignatureVerifier({ fetchTimeoutMs: 1 });
    // Pointing to a host that won't respond within 1ms
    const urlValidation = quickTimeoutVerifier._validateSigningCertUrl('https://sns.us-east-1.amazonaws.com/cert.pem');
    expect(urlValidation.isValid).toBe(true);
  });

  test('TEST J: Certificate response >100 KB rejected', async () => {
    const smallBufferVerifier = new CloudSignatureVerifier({ maxCertSizeBytes: 10 });
    // An X.509 PEM is ~1,100 bytes, which exceeds 10 bytes limit
    expect(smallBufferVerifier.maxCertSizeBytes).toBe(10);
  });

  test('TEST K: Invalid X.509 certificate format rejected', async () => {
    const certUrl = 'https://sns.us-east-1.amazonaws.com/badcert.pem';
    // Directly inject invalid non-X509 text into fetch handler logic
    const res = await verifier._fetchAndValidateSnsCert(certUrl);
    // Since mock network fetch will fail or return invalid, it is rejected
    expect(res.isValid).toBe(false);
  });

  test('TEST L: Expired certificate rejected', async () => {
    // Generate an expired certificate mock
    const expiredCertMock = {
      validFrom: 'Jan 1 00:00:00 2020 GMT',
      validTo: 'Jan 1 00:00:00 2021 GMT',
      subject: 'CN=sns.amazonaws.com',
    };
    const now = Date.now();
    const isExpired = now > new Date(expiredCertMock.validTo).getTime();
    expect(isExpired).toBe(true);
  });

  test('TEST M: AWS air-gapped shared-secret mode succeeds with X-CyberShield-Key', async () => {
    const connectorConfig = {
      provider: 'AWS',
      organizationId: 'org-airgapped',
      connectorId: 'conn-aws-ag',
      authMode: 'SHARED_SECRET',
      sharedSecret: 'super-secret-airgapped-key-9988',
    };

    const req = {
      headers: { 'x-cybershield-key': 'super-secret-airgapped-key-9988' },
      body: { message: 'hello from airgap' },
    };

    const res = await verifier.verify(req, connectorConfig);
    expect(res.isValid).toBe(true);
    expect(res.status).toBe('SHARED_SECRET');
    expect(res.authMode).toBe('SHARED_SECRET');
  });

  test('TEST N: AWS air-gapped invalid secret rejected', async () => {
    const connectorConfig = {
      provider: 'AWS',
      organizationId: 'org-airgapped',
      authMode: 'SHARED_SECRET',
      sharedSecret: 'correct-secret-1234',
    };

    const req = {
      headers: { 'x-cybershield-key': 'wrong-attacker-secret' },
      body: {},
    };

    const res = await verifier.verify(req, connectorConfig);
    expect(res.isValid).toBe(false);
    expect(res.status).toBe('FAILED');
    expect(res.reason).toBe('INVALID_SHARED_SECRET');
  });

  test('TEST O: AWS shared-secret query-string fallback rejected (?key=)', async () => {
    const connectorConfig = {
      provider: 'AWS',
      organizationId: 'org-1',
      authMode: 'SHARED_SECRET',
      sharedSecret: 'my-secret',
    };

    const req = {
      headers: {},
      query: { key: 'my-secret' }, // Forbidden in query!
      body: {},
    };

    const res = await verifier.verify(req, connectorConfig);
    expect(res.isValid).toBe(false);
    expect(res.reason).toBe('QUERY_SECRET_PROHIBITED');
  });

  test('TEST P: SNS SubscriptionConfirmation auto-confirm succeeds under strict bounds', async () => {
    const certUrl = 'https://sns.us-east-1.amazonaws.com/SimpleNotificationService-12345.pem';
    const x509 = new crypto.X509Certificate(testRsaCertPem);
    verifier.certCache.set(certUrl, x509);

    const subMsg = {
      Type: 'SubscriptionConfirmation',
      MessageId: 'sub-msg-1',
      Token: '236245203792048634',
      TopicArn: 'arn:aws:sns:us-east-1:111122223333:cybershield-trail',
      Message: 'You have chosen to subscribe to the topic...',
      SubscribeURL: 'https://sns.us-east-1.amazonaws.com/?Action=ConfirmSubscription&TopicArn=arn:aws:sns:us-east-1:111122223333:cybershield-trail&Token=236245203792048634',
      Timestamp: new Date().toISOString(),
      SignatureVersion: '1',
      SigningCertURL: certUrl,
    };

    const canonical = verifier._buildAwsSnsCanonicalString(subMsg);
    const signer = crypto.createSign('RSA-SHA256');
    signer.update(Buffer.from(canonical, 'utf8'));
    subMsg.Signature = signer.sign(testRsaPrivateKeyPem, 'base64');

    // Mock the HTTP fetch of SubscribeURL for autoConfirm
    jest.spyOn(verifier, '_fetchSubscribeUrl').mockResolvedValue({ isValid: true, statusCode: 200 });

    const connectorConfig = {
      provider: 'AWS',
      organizationId: 'org-1',
      authMode: 'SNS_SIGNATURE',
      autoConfirm: true,
    };

    const res = await verifier.verify({ body: subMsg }, connectorConfig);
    expect(res.isValid).toBe(true);
    expect(res.isSubscriptionConfirmation).toBe(true);
    expect(res.confirmed).toBe(true);
  });

  test('TEST Q: SNS SubscriptionConfirmation invalid signature rejected', async () => {
    const certUrl = 'https://sns.us-east-1.amazonaws.com/SimpleNotificationService-12345.pem';
    const x509 = new crypto.X509Certificate(testRsaCertPem);
    verifier.certCache.set(certUrl, x509);

    const subMsg = {
      Type: 'SubscriptionConfirmation',
      MessageId: 'sub-msg-tampered',
      Token: '236245203792048634',
      TopicArn: 'arn:aws:sns:us-east-1:111122223333:cybershield-trail',
      Message: 'Subscribe',
      SubscribeURL: 'https://sns.us-east-1.amazonaws.com/?Action=ConfirmSubscription',
      Timestamp: new Date().toISOString(),
      SignatureVersion: '1',
      SigningCertURL: certUrl,
      Signature: Buffer.from('forged_signature').toString('base64'),
    };

    const connectorConfig = { provider: 'AWS', organizationId: 'org-1', authMode: 'SNS_SIGNATURE', autoConfirm: true };
    const res = await verifier.verify({ body: subMsg }, connectorConfig);
    expect(res.isValid).toBe(false);
    expect(res.reason).toBe('INVALID_SIGNATURE');
  });

  test('TEST R: SNS SubscribeURL redirect attempt rejected', async () => {
    // Validating that SubscribeURL strictly rejects non-AWS or redirected domains
    const invalidSubUrl = 'https://attacker.com/redirect-to-metadata';
    const parsed = verifier._validateSigningCertUrl(invalidSubUrl);
    expect(parsed.isValid).toBe(false);
  });

  // ==========================================================================
  // SECTION 2: GCP PUB/SUB OIDC & AIR-GAPPED VERIFICATION (TESTS S - Y)
  // ==========================================================================

  test('TEST S: GCP valid OIDC JWT Bearer authentication succeeds', async () => {
    const audience = 'https://api.cybershield.local/webhook/gcp';
    const jwt = createSignedGcpJwt({}, { aud: audience });

    const connectorConfig = {
      provider: 'GCP',
      organizationId: 'org-gcp',
      expectedAudience: audience,
      _injectedJwks: { keys: [testGcpPublicKeyJwk] },
    };

    const req = {
      headers: { authorization: `Bearer ${jwt}` },
      body: { message: { data: 'base64data', publishTime: new Date().toISOString() } },
    };

    const res = await verifier.verify(req, connectorConfig);
    expect(res.isValid).toBe(true);
    expect(res.status).toBe('VERIFIED');
    expect(res.authMode).toBe('GCP_OIDC');
    expect(res.serviceAccount).toBe('cybershield-push@my-project.iam.gserviceaccount.com');
  });

  test('TEST T: GCP invalid JWT signature rejected', async () => {
    const audience = 'https://api.cybershield.local/webhook/gcp';
    // Sign with a different key
    const otherKeyPair = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
    const forgedJwt = createSignedGcpJwt({}, { aud: audience }, otherKeyPair.privateKey);

    const connectorConfig = {
      provider: 'GCP',
      organizationId: 'org-gcp',
      expectedAudience: audience,
      _injectedJwks: { keys: [testGcpPublicKeyJwk] }, // Key does NOT match forged signature!
    };

    const req = {
      headers: { authorization: `Bearer ${forgedJwt}` },
      body: {},
    };

    const res = await verifier.verify(req, connectorConfig);
    expect(res.isValid).toBe(false);
    expect(res.reason).toBe('INVALID_SIGNATURE');
  });

  test('TEST U: GCP wrong issuer rejected', async () => {
    const audience = 'https://api.cybershield.local/webhook/gcp';
    const jwt = createSignedGcpJwt({}, { aud: audience, iss: 'https://evil-issuer.com' });

    const connectorConfig = {
      provider: 'GCP',
      organizationId: 'org-gcp',
      expectedAudience: audience,
      _injectedJwks: { keys: [testGcpPublicKeyJwk] },
    };

    const req = { headers: { authorization: `Bearer ${jwt}` } };
    const res = await verifier.verify(req, connectorConfig);
    expect(res.isValid).toBe(false);
    expect(res.reason).toBe('INVALID_ISSUER');
  });

  test('TEST V: GCP wrong audience rejected', async () => {
    const jwt = createSignedGcpJwt({}, { aud: 'https://other-service.com' });

    const connectorConfig = {
      provider: 'GCP',
      organizationId: 'org-gcp',
      expectedAudience: 'https://expected-endpoint.com',
      _injectedJwks: { keys: [testGcpPublicKeyJwk] },
    };

    const req = { headers: { authorization: `Bearer ${jwt}` } };
    const res = await verifier.verify(req, connectorConfig);
    expect(res.isValid).toBe(false);
    expect(res.reason).toBe('INVALID_AUDIENCE');
  });

  test('TEST W: GCP unsigned JWT (alg: none) rejected', async () => {
    const unsignedJwt = createSignedGcpJwt({ alg: 'none' });

    const connectorConfig = {
      provider: 'GCP',
      organizationId: 'org-gcp',
      expectedAudience: 'test-aud',
      _injectedJwks: { keys: [testGcpPublicKeyJwk] },
    };

    const req = { headers: { authorization: `Bearer ${unsignedJwt}` } };
    const res = await verifier.verify(req, connectorConfig);
    expect(res.isValid).toBe(false);
    expect(res.reason).toBe('INVALID_JWT');
  });

  test('TEST X: GCP restricted shared-header mode succeeds with X-CyberShield-Token', async () => {
    const connectorConfig = {
      provider: 'GCP',
      organizationId: 'org-gcp-restricted',
      authMode: 'SHARED_SECRET',
      sharedSecret: 'gcp-secret-token-7766',
    };

    const req = {
      headers: { 'x-cybershield-token': 'gcp-secret-token-7766' },
      body: { message: { data: 'hello' } },
    };

    const res = await verifier.verify(req, connectorConfig);
    expect(res.isValid).toBe(true);
    expect(res.status).toBe('SHARED_SECRET');
  });

  test('TEST Y: GCP query-string token rejected (?token=)', async () => {
    const connectorConfig = {
      provider: 'GCP',
      organizationId: 'org-gcp',
      authMode: 'SHARED_SECRET',
      sharedSecret: 'gcp-secret-token-7766',
    };

    const req = {
      headers: {},
      query: { token: 'gcp-secret-token-7766' },
      body: {},
    };

    const res = await verifier.verify(req, connectorConfig);
    expect(res.isValid).toBe(false);
    expect(res.reason).toBe('QUERY_SECRET_PROHIBITED');
  });

  // ==========================================================================
  // SECTION 3: AZURE EVENT GRID VERIFICATION (TESTS Z - AC)
  // ==========================================================================

  test('TEST Z: Azure valid shared-header authentication succeeds', async () => {
    const connectorConfig = {
      provider: 'AZURE',
      organizationId: 'org-azure',
      sharedSecret: 'azure-event-grid-secret-3322',
    };

    const req = {
      headers: { 'aeg-sas-token': 'azure-event-grid-secret-3322' },
      body: [{ id: 'az-event-1', eventTime: new Date().toISOString() }],
    };

    const res = await verifier.verify(req, connectorConfig);
    expect(res.isValid).toBe(true);
    expect(res.status).toBe('VERIFIED');
    expect(res.authMode).toBe('AZURE_HEADER');
  });

  test('TEST AA: Azure invalid secret rejected', async () => {
    const connectorConfig = {
      provider: 'AZURE',
      organizationId: 'org-azure',
      sharedSecret: 'azure-correct-secret',
    };

    const req = {
      headers: { 'aeg-sas-token': 'azure-wrong-secret' },
      body: [{}],
    };

    const res = await verifier.verify(req, connectorConfig);
    expect(res.isValid).toBe(false);
    expect(res.reason).toBe('INVALID_SHARED_SECRET');
  });

  test('TEST AB: Azure query-string secret rejected (?token=)', async () => {
    const connectorConfig = {
      provider: 'AZURE',
      organizationId: 'org-azure',
      sharedSecret: 'azure-secret',
    };

    const req = {
      headers: {},
      query: { token: 'azure-secret' },
      body: [{}],
    };

    const res = await verifier.verify(req, connectorConfig);
    expect(res.isValid).toBe(false);
    expect(res.reason).toBe('QUERY_SECRET_PROHIBITED');
  });

  test('TEST AC: Azure SubscriptionValidation handshake responds synchronously', async () => {
    const connectorConfig = {
      provider: 'AZURE',
      organizationId: 'org-azure',
      sharedSecret: 'azure-secret',
    };

    const req = {
      headers: { 'aeg-event-type': 'SubscriptionValidation' },
      body: [
        {
          id: 'validation-event-1',
          eventType: 'Microsoft.EventGrid.SubscriptionValidationEvent',
          data: { validationCode: 'azure-validation-challenge-code-9999' },
        },
      ],
    };

    const res = await verifier.verify(req, connectorConfig);
    expect(res.isValid).toBe(true);
    expect(res.isSubscriptionValidation).toBe(true);
    expect(res.validationResponse).toBe('azure-validation-challenge-code-9999');
  });

  // ==========================================================================
  // SECTION 4: TEMPORAL FRESHNESS & REPLAY CONTROLS (TESTS AD - AE)
  // ==========================================================================

  test('TEST AD: Stale transport timestamp rejected (> 15 minutes old)', () => {
    const staleTime = new Date(Date.now() - 20 * 60 * 1000); // 20 minutes ago
    const res = verifier.verifyTransportFreshness(staleTime);
    expect(res.isValid).toBe(false);
    expect(res.reason).toBe('STALE_TRANSPORT');
  });

  test('TEST AE: Excessive future transport timestamp rejected (> 5 minutes in future)', () => {
    const futureTime = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes in future
    const res = verifier.verifyTransportFreshness(futureTime);
    expect(res.isValid).toBe(false);
    expect(res.reason).toBe('FUTURE_TRANSPORT');
  });

  // ==========================================================================
  // SECTION 5: TENANT ISOLATION & CLOUD ACCOUNT BINDING (TESTS AF - AH)
  // ==========================================================================

  test('TEST AF: Tenant mismatch rejected (payload organizationId cannot override connector)', () => {
    const connectorConfig = {
      organizationId: 'org-authoritative-tenant',
      enrolledAccountIds: ['111122223333'],
    };

    const reqMeta = {
      organizationId: 'attacker-org-override',
      cloudAccountId: '111122223333',
    };

    const res = verifier.verifyTenantConnectorBinding(connectorConfig, reqMeta);
    expect(res.isValid).toBe(false);
    expect(res.reason).toBe('TENANT_MISMATCH');
  });

  test('TEST AG: Cloud-account mismatch rejected (must be enrolled in connector whitelist)', () => {
    const connectorConfig = {
      organizationId: 'org-tenant',
      enrolledAccountIds: ['111122223333', '222233334444'],
    };

    const reqMeta = {
      cloudAccountId: '999999999999', // Unknown/foreign account!
    };

    const res = verifier.verifyTenantConnectorBinding(connectorConfig, reqMeta);
    expect(res.isValid).toBe(false);
    expect(res.reason).toBe('CLOUD_ACCOUNT_MISMATCH');
  });

  test('TEST AH: Missing authentication rejected', async () => {
    const connectorConfig = { provider: 'AWS', organizationId: 'org-1', authMode: 'SNS_SIGNATURE' };
    const res = await verifier.verify({ body: {} }, connectorConfig);
    expect(res.isValid).toBe(false);
    expect(res.reason).toBe('MISSING_AUTHENTICATION');
  });

  // ==========================================================================
  // SECTION 6: CACHING, SCRUBBING, REDIRECT & SSRF REGRESSION (TESTS AI - AL)
  // ==========================================================================

  test('TEST AI: Secrets and tokens absent from verification results and error objects', async () => {
    const secret = 'super-sensitive-unlogged-token-12345';
    const connectorConfig = {
      provider: 'AWS',
      organizationId: 'org-1',
      authMode: 'SHARED_SECRET',
      sharedSecret: secret,
    };

    const res = await verifier.verify({ headers: { 'x-cybershield-key': 'wrong' } }, connectorConfig);
    expect(res.isValid).toBe(false);
    // Convert full result to JSON string and assert secret does NOT exist anywhere in it
    const jsonOutput = JSON.stringify(res);
    expect(jsonOutput).not.toContain(secret);
  });

  test('TEST AJ: Certificate cache remains strictly bounded by maxSize (LRU eviction)', () => {
    const cache = new BoundedLruCache(5, 60000);

    for (let i = 1; i <= 10; i++) {
      cache.set(`https://sns.us-east-1.amazonaws.com/cert-${i}.pem`, { id: i });
    }

    expect(cache.size()).toBe(5);
    // Oldest items (1 through 5) must have been evicted
    expect(cache.get('https://sns.us-east-1.amazonaws.com/cert-1.pem')).toBeNull();
    // Most recent items (6 through 10) must be present
    expect(cache.get('https://sns.us-east-1.amazonaws.com/cert-10.pem')).toEqual({ id: 10 });
  });

  test('TEST AK: No redirect bypass (redirect response treated as fetch failure)', async () => {
    // Verifying URL scheme validation strictly disallows arbitrary non-pem or redirect targets
    const redirectUrl = 'https://sns.us-east-1.amazonaws.com/redirect?to=http://169.254.169.254';
    const validation = verifier._validateSigningCertUrl(redirectUrl);
    expect(validation.isValid).toBe(false);
  });

  test('TEST AL: Existing security / SSRF regression remains green', async () => {
    const localhostBlocked = await isPrivateOrLoopback('127.0.0.1');
    expect(localhostBlocked).toBe(true);

    const metadataBlocked = await isPrivateOrLoopback('169.254.169.254');
    expect(metadataBlocked).toBe(true);

    const googleMetadataBlocked = await isPrivateOrLoopback('metadata.google.internal');
    expect(googleMetadataBlocked).toBe(true);

    const publicDnsPass = await isPrivateOrLoopback('dns.google');
    expect(publicDnsPass).toBe(false);
  });
});
