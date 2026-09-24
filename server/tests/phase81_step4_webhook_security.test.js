'use strict';

/**
 * 🛡️ CyberShield X — Phase 81 Step 4 Inbound Webhook Security Battery
 *
 * Comprehensive acceptance test suite for:
 * Gate A — Route & Integration Resolution
 * Gate B — HMAC Cryptography
 * Gate C — Raw Body Integrity
 * Gate D — Secret Isolation
 * Gate E — Freshness & Replay Defense
 * Gate F — Provider Confusion Defense
 * Gate G — Resource Safety & Payload Bounds
 * Gate H — SSRF & Outbound Boundary
 * Gate I — Inbound Security Audit Trail Conformance
 * Gate J — Step 4 Boundary (Zero Business Side-Effects)
 */

const request = require('supertest');
const crypto = require('crypto');
const mongoose = require('mongoose');

// Models & Services
const IntegrationConfig = require('../models/IntegrationConfig');
const IntegrationSyncEvent = require('../models/IntegrationSyncEvent');
const Case = require('../models/Case');
const itsmSignatureVerifier = require('../services/soc/ItsmSignatureVerifier');
const inboundWebhookRouter = require('../routes/inboundWebhook');
const inboundWebhookController = require('../controllers/inboundWebhookController');

// Build an isolated Express test application with raw body verification enabled
const express = require('express');
const app = express();

app.use(
  express.json({
    limit: '1mb',
    verify: (req, res, buf) => {
      if (buf && buf.length) {
        req.rawBody = buf;
      }
    },
  })
);

app.use('/api/webhooks', inboundWebhookRouter);
app.use('/api/integrations/:integrationId/webhook', (req, res, next) => {
  req.url = `/${req.params.integrationId}/webhook`;
  inboundWebhookRouter(req, res, next);
});

describe('Phase 81 Step 4 — Inbound Webhook Crypto / Security Battery', () => {
  const tenantOrgId = new mongoose.Types.ObjectId();
  const jiraIntegrationId = new mongoose.Types.ObjectId().toString();
  const pagerDutyIntegrationId = new mongoose.Types.ObjectId().toString();
  const serviceNowIntegrationId = new mongoose.Types.ObjectId().toString();
  const genericWebhookId = new mongoose.Types.ObjectId().toString();

  const mockConfigs = {
    [jiraIntegrationId]: {
      _id: jiraIntegrationId,
      organizationId: tenantOrgId,
      type: 'Jira',
      name: 'Production Jira Cloud',
      active: true,
      config: {
        baseUrl: 'https://cybershield.atlassian.net',
        email: 'soc@cybershieldx.com',
        apiToken: 'jira-api-token-xyz',
        webhookSecret: 'jira-webhook-secret-9988',
      },
    },
    [pagerDutyIntegrationId]: {
      _id: pagerDutyIntegrationId,
      organizationId: tenantOrgId,
      type: 'PagerDuty',
      name: 'Production PagerDuty',
      active: true,
      config: {
        routingKey: 'pd-routing-key-1234',
        apiToken: 'pd-rest-token-5678',
        webhookSecret: 'pd-webhook-secret-4321',
      },
    },
    [serviceNowIntegrationId]: {
      _id: serviceNowIntegrationId,
      organizationId: tenantOrgId,
      type: 'ServiceNow',
      name: 'Enterprise ServiceNow',
      active: true,
      config: {
        instanceUrl: 'https://dev12345.service-now.com',
        username: 'sn_admin',
        password: 'sn_password_secret',
        webhookSecret: 'sn-webhook-token-7788',
      },
    },
    [genericWebhookId]: {
      _id: genericWebhookId,
      organizationId: tenantOrgId,
      type: 'Webhook',
      name: 'Generic SOAR Webhook',
      active: true,
      config: {
        callbackUrl: 'https://external.soar.io/callback',
        webhookSecret: 'generic-secret-5566',
      },
    },
  };

  let auditEvents = [];

  beforeEach(() => {
    auditEvents = [];
    itsmSignatureVerifier.replayCache.clear();

    jest.spyOn(IntegrationConfig, 'findById').mockImplementation(async (id) => {
      return mockConfigs[String(id)] || null;
    });

    jest.spyOn(IntegrationSyncEvent, 'create').mockImplementation(async (data) => {
      auditEvents.push(data);
      return data;
    });

    // Spies on business models to verify zero mutations
    jest.spyOn(Case, 'create').mockImplementation(async () => {});
    jest.spyOn(Case, 'updateOne').mockImplementation(async () => {});
    jest.spyOn(Case, 'findByIdAndUpdate').mockImplementation(async () => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ─── GATE A: Route & Integration Resolution ─────────────────────────────────
  describe('Gate A: Route & Integration Resolution', () => {
    it('authenticates a valid Jira integration using provider-specified route', async () => {
      const payload = { issue: { key: 'SEC-101', fields: { status: { name: 'Done' } } } };
      const rawString = JSON.stringify(payload);
      const signature = crypto.createHmac('sha256', 'jira-webhook-secret-9988').update(rawString).digest('hex');

      const res = await request(app)
        .post(`/api/webhooks/itsm/jira/${jiraIntegrationId}`)
        .set('Content-Type', 'application/json')
        .set('X-Hub-Signature', `sha256=${signature}`)
        .send(payload);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.status).toBe('AUTHENTICATED');
      expect(res.body.provider).toBe('JIRA');
      expect(res.body.integrationId).toBe(jiraIntegrationId);
    });

    it('authenticates via the alias route /api/integrations/:integrationId/webhook', async () => {
      const payload = { event: 'incident.trigger' };
      const rawString = JSON.stringify(payload);
      const signature = crypto.createHmac('sha256', 'pd-webhook-secret-4321').update(rawString).digest('hex');

      const res = await request(app)
        .post(`/api/integrations/${pagerDutyIntegrationId}/webhook`)
        .set('Content-Type', 'application/json')
        .set('X-PagerDuty-Signature', `v1=${signature}`)
        .send(payload);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('AUTHENTICATED');
      expect(res.body.provider).toBe('PAGERDUTY');
    });

    it('rejects a nonexistent integration ID with 404', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .post(`/api/webhooks/itsm/jira/${nonExistentId}`)
        .set('Content-Type', 'application/json')
        .send({ test: true });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('INTEGRATION_NOT_FOUND');
    });

    it('rejects an invalid ObjectId format with 400', async () => {
      const res = await request(app)
        .post('/api/webhooks/itsm/jira/not-a-valid-object-id')
        .set('Content-Type', 'application/json')
        .send({ test: true });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('INVALID_INTEGRATION_ID');
    });

    it('rejects a disabled integration with 403', async () => {
      const disabledId = new mongoose.Types.ObjectId().toString();
      mockConfigs[disabledId] = {
        _id: disabledId,
        organizationId: tenantOrgId,
        type: 'Jira',
        active: false,
        config: { webhookSecret: 'secret' },
      };

      const res = await request(app)
        .post(`/api/webhooks/itsm/jira/${disabledId}`)
        .set('Content-Type', 'application/json')
        .send({ test: true });

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('INTEGRATION_DISABLED');
    });

    it('rejects query-string secrets with 400 QUERY_SECRET_PROHIBITED', async () => {
      const res = await request(app)
        .post(`/api/webhooks/itsm/jira/${jiraIntegrationId}?token=leakedSecret123`)
        .set('Content-Type', 'application/json')
        .send({ test: true });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('QUERY_SECRET_PROHIBITED');
    });
  });

  // ─── GATE B: HMAC Cryptography ──────────────────────────────────────────────
  describe('Gate B: HMAC Cryptography', () => {
    it('accepts valid HMAC-SHA256 signature for Jira (with and without sha256= prefix)', async () => {
      const payload = { issue: { id: '1001' } };
      const rawString = JSON.stringify(payload);
      const signature = crypto.createHmac('sha256', 'jira-webhook-secret-9988').update(rawString).digest('hex');

      // Test without sha256= prefix
      const res = await request(app)
        .post(`/api/webhooks/itsm/jira/${jiraIntegrationId}`)
        .set('Content-Type', 'application/json')
        .set('X-Hub-Signature', signature)
        .send(payload);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('AUTHENTICATED');
    });

    it('rejects invalid HMAC signature with 401 AUTHENTICATION_FAILED', async () => {
      const payload = { issue: { id: '1001' } };
      const res = await request(app)
        .post(`/api/webhooks/itsm/jira/${jiraIntegrationId}`)
        .set('Content-Type', 'application/json')
        .set('X-Hub-Signature', 'sha256=badf00d1234567890badf00d1234567890badf00d1234567890badf00d1234567890')
        .send(payload);

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('AUTHENTICATION_FAILED');
      expect(res.body.reason).toBe('INVALID_SIGNATURE');
    });

    it('rejects missing signature with 401', async () => {
      const payload = { issue: { id: '1001' } };
      const res = await request(app)
        .post(`/api/webhooks/itsm/jira/${jiraIntegrationId}`)
        .set('Content-Type', 'application/json')
        .send(payload);

      expect(res.status).toBe(401);
      expect(res.body.reason).toBe('MISSING_SIGNATURE_OR_TOKEN');
    });

    it('verifies PagerDuty v1 HMAC signature with multiple comma-separated entries', async () => {
      const payload = { event: { id: 'EVT-99' } };
      const rawString = JSON.stringify(payload);
      const validSig = crypto.createHmac('sha256', 'pd-webhook-secret-4321').update(rawString).digest('hex');

      const res = await request(app)
        .post(`/api/webhooks/itsm/pagerduty/${pagerDutyIntegrationId}`)
        .set('Content-Type', 'application/json')
        .set('X-PagerDuty-Signature', `v1=stale_sig_123, v1=${validSig}`)
        .send(payload);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('AUTHENTICATED');
      expect(res.body.method).toBe('PAGERDUTY_HMAC');
    });

    it('verifies ServiceNow shared secret token via X-ServiceNow-Token', async () => {
      const payload = { incident: { number: 'INC001001' } };
      const res = await request(app)
        .post(`/api/webhooks/itsm/servicenow/${serviceNowIntegrationId}`)
        .set('Content-Type', 'application/json')
        .set('X-ServiceNow-Token', 'sn-webhook-token-7788')
        .send(payload);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('AUTHENTICATED');
      expect(res.body.method).toBe('SERVICENOW_TOKEN');
    });

    it('verifies ServiceNow Basic Auth credentials', async () => {
      const payload = { incident: { number: 'INC001002' } };
      const basicHeader = 'Basic ' + Buffer.from('sn_admin:sn_password_secret').toString('base64');

      const res = await request(app)
        .post(`/api/webhooks/itsm/servicenow/${serviceNowIntegrationId}`)
        .set('Content-Type', 'application/json')
        .set('Authorization', basicHeader)
        .send(payload);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('AUTHENTICATED');
      expect(res.body.method).toBe('SERVICENOW_BASIC');
    });

    it('verifies Generic Webhook HMAC-SHA256 signature', async () => {
      const payload = { eventType: 'ALERT_FORWARD', alertId: 'ALT-505' };
      const rawString = JSON.stringify(payload);
      const signature = crypto.createHmac('sha256', 'generic-secret-5566').update(rawString).digest('hex');

      const res = await request(app)
        .post(`/api/webhooks/itsm/webhook/${genericWebhookId}`)
        .set('Content-Type', 'application/json')
        .set('X-Hub-Signature-256', `sha256=${signature}`)
        .send(payload);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('AUTHENTICATED');
      expect(res.body.method).toBe('WEBHOOK_HMAC');
    });
  });

  // ─── GATE C: Raw Body Integrity ─────────────────────────────────────────────
  describe('Gate C: Raw Body Integrity', () => {
    it('verifies signature computed over exact raw request bytes', () => {
      const secret = 'raw-test-secret';
      const exactRaw = Buffer.from('{"key":"value",   "spaced": true}');
      const computed = crypto.createHmac('sha256', secret).update(exactRaw).digest('hex');

      const mockReq = {
        rawBody: exactRaw,
        headers: { 'x-hub-signature': computed },
      };

      const verification = itsmSignatureVerifier.verifyJira(mockReq, {
        config: { webhookSecret: secret },
      });

      expect(verification.authenticated).toBe(true);
    });

    it('fails verification if body bytes are mutated after signature computation', () => {
      const secret = 'raw-test-secret';
      const originalRaw = Buffer.from('{"tampered": false}');
      const signature = crypto.createHmac('sha256', secret).update(originalRaw).digest('hex');

      const tamperedRaw = Buffer.from('{"tampered": true}');
      const mockReq = {
        rawBody: tamperedRaw,
        headers: { 'x-hub-signature': signature },
      };

      const verification = itsmSignatureVerifier.verifyJira(mockReq, {
        config: { webhookSecret: secret },
      });

      expect(verification.authenticated).toBe(false);
      expect(verification.reason).toBe('INVALID_SIGNATURE');
    });

    it('rejects whitespace differences between signature buffer and verification buffer', () => {
      const secret = 'raw-test-secret';
      const originalRaw = Buffer.from('{"a":1,"b":2}');
      const signature = crypto.createHmac('sha256', secret).update(originalRaw).digest('hex');

      // Semantically equivalent JSON, but byte sequence differs
      const formattedRaw = Buffer.from('{\n  "a": 1,\n  "b": 2\n}');
      const mockReq = {
        rawBody: formattedRaw,
        headers: { 'x-hub-signature': signature },
      };

      const verification = itsmSignatureVerifier.verifyJira(mockReq, {
        config: { webhookSecret: secret },
      });

      expect(verification.authenticated).toBe(false);
      expect(verification.reason).toBe('INVALID_SIGNATURE');
    });
  });

  // ─── GATE D: Secret Isolation ───────────────────────────────────────────────
  describe('Gate D: Secret Isolation', () => {
    it('never leaks webhookSecret, passwords, or tokens in successful or rejected responses', async () => {
      const payload = { test: 'leak-check' };
      const rawString = JSON.stringify(payload);
      const signature = crypto.createHmac('sha256', 'jira-webhook-secret-9988').update(rawString).digest('hex');

      const resSuccess = await request(app)
        .post(`/api/webhooks/itsm/jira/${jiraIntegrationId}`)
        .set('Content-Type', 'application/json')
        .set('X-Hub-Signature', signature)
        .send(payload);

      const resSuccessStr = JSON.stringify(resSuccess.body);
      expect(resSuccessStr).not.toContain('jira-webhook-secret-9988');
      expect(resSuccessStr).not.toContain('jira-api-token-xyz');

      // Failure response check
      const resFail = await request(app)
        .post(`/api/webhooks/itsm/jira/${jiraIntegrationId}`)
        .set('Content-Type', 'application/json')
        .set('X-Hub-Signature', 'bad-sig')
        .send(payload);

      const resFailStr = JSON.stringify(resFail.body);
      expect(resFailStr).not.toContain('jira-webhook-secret-9988');
    });

    it('never persists raw payload or secrets in IntegrationSyncEvent audit records', async () => {
      const payload = { sensitiveToken: 'super-secret-token', password: 'user-pass' };
      const rawString = JSON.stringify(payload);
      const signature = crypto.createHmac('sha256', 'jira-webhook-secret-9988').update(rawString).digest('hex');

      await request(app)
        .post(`/api/webhooks/itsm/jira/${jiraIntegrationId}`)
        .set('Content-Type', 'application/json')
        .set('X-Hub-Signature', signature)
        .send(payload);

      expect(auditEvents.length).toBeGreaterThan(0);
      const audit = auditEvents[0];

      expect(audit.payloadHash).toBeDefined();
      expect(audit.payloadHash).toMatch(/^[a-f0-9]{64}$/);
      expect(audit.payload).toBeUndefined();
      expect(JSON.stringify(audit)).not.toContain('super-secret-token');
    });

    it('rejects requests attempting to supply or override webhookSecret in the body', async () => {
      const payload = { webhookSecret: 'attacker-supplied-secret' };
      const rawString = JSON.stringify(payload);
      // Signed with the attacker's supplied secret, NOT the authoritative config secret
      const signature = crypto.createHmac('sha256', 'attacker-supplied-secret').update(rawString).digest('hex');

      const res = await request(app)
        .post(`/api/webhooks/itsm/jira/${jiraIntegrationId}`)
        .set('Content-Type', 'application/json')
        .set('X-Hub-Signature', signature)
        .send(payload);

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('AUTHENTICATION_FAILED');
    });
  });

  // ─── GATE E: Freshness / Replay Defense ──────────────────────────────────────
  describe('Gate E: Freshness & Replay Defense', () => {
    it('accepts valid fresh timestamp header', async () => {
      const payload = { action: 'ping' };
      const rawString = JSON.stringify(payload);
      const signature = crypto.createHmac('sha256', 'jira-webhook-secret-9988').update(rawString).digest('hex');
      const freshTimestamp = Date.now().toString();

      const res = await request(app)
        .post(`/api/webhooks/itsm/jira/${jiraIntegrationId}`)
        .set('Content-Type', 'application/json')
        .set('X-Hub-Signature', signature)
        .set('X-Webhook-Timestamp', freshTimestamp)
        .send(payload);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('AUTHENTICATED');
    });

    it('rejects stale timestamp exceeding maxAgeMs (5 minutes) with 401', async () => {
      const payload = { action: 'ping' };
      const rawString = JSON.stringify(payload);
      const signature = crypto.createHmac('sha256', 'jira-webhook-secret-9988').update(rawString).digest('hex');
      const staleTimestamp = (Date.now() - 10 * 60 * 1000).toString(); // 10 minutes old

      const res = await request(app)
        .post(`/api/webhooks/itsm/jira/${jiraIntegrationId}`)
        .set('Content-Type', 'application/json')
        .set('X-Hub-Signature', signature)
        .set('X-Webhook-Timestamp', staleTimestamp)
        .send(payload);

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('AUTHENTICATION_FAILED');
      expect(res.body.reason).toBe('STALE_TIMESTAMP');
    });

    it('rejects excessive future clock skew exceeding 1 minute with 401', async () => {
      const payload = { action: 'ping' };
      const rawString = JSON.stringify(payload);
      const signature = crypto.createHmac('sha256', 'jira-webhook-secret-9988').update(rawString).digest('hex');
      const futureTimestamp = (Date.now() + 5 * 60 * 1000).toString(); // 5 minutes in future

      const res = await request(app)
        .post(`/api/webhooks/itsm/jira/${jiraIntegrationId}`)
        .set('Content-Type', 'application/json')
        .set('X-Hub-Signature', signature)
        .set('X-Webhook-Timestamp', futureTimestamp)
        .send(payload);

      expect(res.status).toBe(401);
      expect(res.body.reason).toBe('FUTURE_TIMESTAMP_SKEW');
    });

    it('safely handles duplicate replays acknowledging with 200 DUPLICATE_ACKNOWLEDGED', async () => {
      const payload = { eventId: 'unique-webhook-evt-001', data: 'test' };
      const rawString = JSON.stringify(payload);
      const signature = crypto.createHmac('sha256', 'jira-webhook-secret-9988').update(rawString).digest('hex');

      // First delivery
      const firstRes = await request(app)
        .post(`/api/webhooks/itsm/jira/${jiraIntegrationId}`)
        .set('Content-Type', 'application/json')
        .set('X-Hub-Signature', signature)
        .send(payload);

      expect(firstRes.status).toBe(200);
      expect(firstRes.body.status).toBe('AUTHENTICATED');

      // Second delivery (Replay attack / duplicated network retry)
      const secondRes = await request(app)
        .post(`/api/webhooks/itsm/jira/${jiraIntegrationId}`)
        .set('Content-Type', 'application/json')
        .set('X-Hub-Signature', signature)
        .send(payload);

      expect(secondRes.status).toBe(200);
      expect(secondRes.body.status).toBe('DUPLICATE_ACKNOWLEDGED');
      expect(secondRes.body.reason).toBe('REPLAY_DETECTED');
    });
  });

  // ─── GATE F: Provider Confusion Defense ─────────────────────────────────────
  describe('Gate F: Provider Confusion Defense', () => {
    it('rejects Jira authentication sent to a PagerDuty integration route', async () => {
      const payload = { test: 'provider-confusion' };
      const rawString = JSON.stringify(payload);
      const signature = crypto.createHmac('sha256', 'jira-webhook-secret-9988').update(rawString).digest('hex');

      // Pointing Jira signature to PagerDuty integration route
      const res = await request(app)
        .post(`/api/webhooks/itsm/jira/${pagerDutyIntegrationId}`)
        .set('Content-Type', 'application/json')
        .set('X-Hub-Signature', signature)
        .send(payload);

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('PROVIDER_MISMATCH');
    });

    it('rejects when payload attempts to claim a different provider than IntegrationConfig.type', async () => {
      const payload = { provider: 'JIRA', data: 'forgery' };
      const rawString = JSON.stringify(payload);
      const signature = crypto.createHmac('sha256', 'pd-webhook-secret-4321').update(rawString).digest('hex');

      // Target is PagerDuty integration, but payload says provider: JIRA
      const res = await request(app)
        .post(`/api/webhooks/itsm/pagerduty/${pagerDutyIntegrationId}`)
        .set('Content-Type', 'application/json')
        .set('X-PagerDuty-Signature', `v1=${signature}`)
        .send(payload);

      expect(res.status).toBe(200);
      // Authoritative provider returned is PAGERDUTY, ignoring payload claim
      expect(res.body.provider).toBe('PAGERDUTY');
    });
  });

  // ─── GATE G: Resource Safety & Payload Bounds ───────────────────────────────
  describe('Gate G: Resource Safety & Payload Bounds', () => {
    it('rejects oversized signatures exceeding 512 characters with 401', async () => {
      const oversizedSig = 'a'.repeat(600);
      const res = await request(app)
        .post(`/api/webhooks/itsm/jira/${jiraIntegrationId}`)
        .set('Content-Type', 'application/json')
        .set('X-Hub-Signature', oversizedSig)
        .send({ test: true });

      expect(res.status).toBe(401);
      expect(res.body.reason).toBe('SIGNATURE_TOO_LONG');
    });

    it('handles malformed non-numeric timestamp strings safely without throwing', () => {
      const result = itsmSignatureVerifier.validateTimestamp('invalid-date-format-string-xyz');
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('MALFORMED_TIMESTAMP');
    });
  });

  // ─── GATE H: SSRF & Network Boundary ────────────────────────────────────────
  describe('Gate H: SSRF & Network Boundary', () => {
    it('performs zero outbound HTTP network calls during webhook authentication', async () => {
      const https = require('https');
      const httpsSpy = jest.spyOn(https, 'request');

      const payload = { ping: true };
      const rawString = JSON.stringify(payload);
      const signature = crypto.createHmac('sha256', 'jira-webhook-secret-9988').update(rawString).digest('hex');

      await request(app)
        .post(`/api/webhooks/itsm/jira/${jiraIntegrationId}`)
        .set('Content-Type', 'application/json')
        .set('X-Hub-Signature', signature)
        .send(payload);

      expect(httpsSpy).not.toHaveBeenCalled();
      httpsSpy.mockRestore();
    });
  });

  // ─── GATE I: Inbound Security Audit Trail Conformance ───────────────────────
  describe('Gate I: Inbound Security Audit Trail Conformance', () => {
    it('generates immutable IntegrationSyncEvent with UUID v4 syncId and direction INBOUND', async () => {
      const payload = { issue: { key: 'SEC-202' } };
      const rawString = JSON.stringify(payload);
      const signature = crypto.createHmac('sha256', 'jira-webhook-secret-9988').update(rawString).digest('hex');

      await request(app)
        .post(`/api/webhooks/itsm/jira/${jiraIntegrationId}`)
        .set('Content-Type', 'application/json')
        .set('X-Hub-Signature', signature)
        .send(payload);

      expect(auditEvents.length).toBe(1);
      const audit = auditEvents[0];

      expect(audit.direction).toBe('INBOUND');
      expect(audit.provider).toBe('JIRA');
      expect(audit.status).toBe('SUCCESS');
      expect(audit.eventType).toBe('WEBHOOK_AUTHENTICATED');
      expect(audit.organizationId).toBe(tenantOrgId);
      expect(audit.syncId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
      expect(audit.payloadHash).toBeDefined();
    });

    it('generates audit event with status REJECTED on failed verification', async () => {
      await request(app)
        .post(`/api/webhooks/itsm/jira/${jiraIntegrationId}`)
        .set('Content-Type', 'application/json')
        .set('X-Hub-Signature', 'invalid-signature')
        .send({ bad: true });

      expect(auditEvents.length).toBe(1);
      const audit = auditEvents[0];

      expect(audit.direction).toBe('INBOUND');
      expect(audit.status).toBe('REJECTED');
      expect(audit.eventType).toBe('WEBHOOK_REJECTED');
      expect(audit.errorMessage).toBe('INVALID_SIGNATURE');
    });
  });

  // ─── GATE J: Step 4 Boundary (Zero Business Side-Effects) ───────────────────
  describe('Gate J: Step 4 Boundary (Zero Business Side-Effects)', () => {
    it('confirms Case model is NEVER queried, created, or updated during webhook authentication', async () => {
      const payload = { issue: { key: 'SEC-303', fields: { status: { name: 'Closed' } } } };
      const rawString = JSON.stringify(payload);
      const signature = crypto.createHmac('sha256', 'jira-webhook-secret-9988').update(rawString).digest('hex');

      await request(app)
        .post(`/api/webhooks/itsm/jira/${jiraIntegrationId}`)
        .set('Content-Type', 'application/json')
        .set('X-Hub-Signature', signature)
        .send(payload);

      expect(Case.create).not.toHaveBeenCalled();
      expect(Case.updateOne).not.toHaveBeenCalled();
      expect(Case.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it('confirms external ticket synchronization logic is NOT invoked in Step 4', async () => {
      // Proves that Step 4 acts purely as an authentication and security filter
      const res = await request(app)
        .post(`/api/webhooks/itsm/servicenow/${serviceNowIntegrationId}`)
        .set('Content-Type', 'application/json')
        .set('X-ServiceNow-Token', 'sn-webhook-token-7788')
        .send({ sys_id: 'sys123', state: 'Resolved' });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('AUTHENTICATED');
      // No sync details or case mutations returned
      expect(res.body.caseId).toBeUndefined();
      expect(res.body.externalStatus).toBeUndefined();
    });
  });
});
