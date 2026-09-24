/**
 * CyberShield X — Phase 81 Remediation Test Suite
 * FINDING-01: Inbound Webhook Failure Response Semantics
 *
 * Verifies that internal processing / persistence failures fail-closed with HTTP 500,
 * enabling external ITSM provider retries, while business outcomes (success, duplicate,
 * unmatched, unsupported status) preserve HTTP 200 to prevent infinite retry loops.
 */

const request = require('supertest');
const express = require('express');
const crypto = require('crypto');
const mongoose = require('mongoose');

// Target controller & router
const inboundWebhookRouter = require('../routes/inboundWebhook');
const inboundTicketReconciliationService = require('../services/soc/InboundTicketReconciliationService');
const externalApprovalCallbackService = require('../services/soc/ExternalApprovalCallbackService');
const externalApprovalCallbackNormalizer = require('../services/soc/ExternalApprovalCallbackNormalizer');
const IntegrationConfig = require('../models/IntegrationConfig');
const Case = require('../models/Case');
const PendingApproval = require('../models/PendingApproval');
const IntegrationSyncEvent = require('../models/IntegrationSyncEvent');

// Build isolated Express application
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

describe('Phase 81 Remediation — FINDING-01 Webhook Failure Response Semantics', () => {
  const tenantOrgId = new mongoose.Types.ObjectId();
  const jiraIntegrationId = new mongoose.Types.ObjectId().toString();
  const webhookIntegrationId = new mongoose.Types.ObjectId().toString();

  const mockConfigs = {
    [jiraIntegrationId]: {
      _id: jiraIntegrationId,
      organizationId: tenantOrgId,
      type: 'Jira',
      name: 'Production Jira',
      active: true,
      config: {
        baseUrl: 'https://jira.corp.local',
        email: 'soc@corp.local',
        apiToken: 'super-secret-jira-token-999',
        webhookSecret: 'jira-hmac-secret-xyz123',
      },
    },
    [webhookIntegrationId]: {
      _id: webhookIntegrationId,
      organizationId: tenantOrgId,
      type: 'Webhook',
      name: 'Generic Approvals Webhook',
      active: true,
      config: {
        webhookSecret: 'generic-webhook-secret-456',
      },
    },
  };

  beforeEach(() => {
    jest.restoreAllMocks();

    // Mock IntegrationConfig.findById
    jest.spyOn(IntegrationConfig, 'findById').mockImplementation(async (id) => {
      const idStr = id ? id.toString() : '';
      return mockConfigs[idStr] || null;
    });

    // Mock IntegrationSyncEvent.create
    jest.spyOn(IntegrationSyncEvent, 'create').mockResolvedValue({ syncId: 'test-sync-123' });
  });

  // Helper to generate valid HMAC signature
  function signPayload(bodyStr, secret) {
    return crypto.createHmac('sha256', secret).update(bodyStr).digest('hex');
  }

  // ───────────────────────────────────────────────────────────────────────────
  // TEST 1: Valid authenticated webhook -> existing success response preserved (HTTP 200)
  // ───────────────────────────────────────────────────────────────────────────
  test('TEST 1: Valid authenticated webhook returns HTTP 200 with preserved success semantics', async () => {
    jest.spyOn(inboundTicketReconciliationService, 'reconcileWebhook').mockResolvedValue({
      success: true,
      status: 'RECONCILED',
      caseId: 'CASE-2026-TEST1',
      previousStatus: 'NEW',
      newStatus: 'IN_PROGRESS',
      externalTicketKey: 'SEC-101',
      provider: 'JIRA',
    });

    const payload = {
      testId: 'test-1',
      issue: { id: '1001', key: 'SEC-101', fields: { status: { name: 'In Progress' } } },
    };
    const bodyStr = JSON.stringify(payload);
    const signature = signPayload(bodyStr, mockConfigs[jiraIntegrationId].config.webhookSecret);

    const res = await request(app)
      .post(`/api/webhooks/itsm/jira/${jiraIntegrationId}`)
      .set('Content-Type', 'application/json')
      .set('X-Hub-Signature', signature)
      .send(bodyStr);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.status).toBe('AUTHENTICATED');
    expect(res.body.reconciliation).toBeDefined();
    expect(res.body.reconciliation.status).toBe('RECONCILED');
    expect(res.body.reconciliation.caseId).toBe('CASE-2026-TEST1');
  });

  // ───────────────────────────────────────────────────────────────────────────
  // TEST 2: Invalid authentication -> existing 401/403 behavior preserved
  // ───────────────────────────────────────────────────────────────────────────
  test('TEST 2: Invalid signature returns HTTP 401 AUTHENTICATION_FAILED', async () => {
    const payload = { testId: 'test-2', issue: { id: '1002', key: 'SEC-102' } };
    const bodyStr = JSON.stringify(payload);
    const invalidSignature = 'bad0000000000000000000000000000000000000000000000000000000000000';

    const res = await request(app)
      .post(`/api/webhooks/itsm/jira/${jiraIntegrationId}`)
      .set('Content-Type', 'application/json')
      .set('X-Hub-Signature', invalidSignature)
      .send(bodyStr);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('AUTHENTICATION_FAILED');
    expect(res.body.message).toMatch(/signature or credential verification failed/i);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // TEST 3: Duplicate/idempotent event -> HTTP 200 preserved (DUPLICATE_ACKNOWLEDGED)
  // ───────────────────────────────────────────────────────────────────────────
  test('TEST 3: Duplicate/idempotent event returns HTTP 200 DUPLICATE_ACKNOWLEDGED', async () => {
    jest.spyOn(inboundTicketReconciliationService, 'reconcileWebhook').mockResolvedValue({
      success: true,
      status: 'DUPLICATE_ACKNOWLEDGED',
      reason: 'IDEMPOTENT_REPLAY',
      syncId: 'existing-sync-id',
    });

    const payload = { testId: 'test-3', issue: { id: '1003', key: 'SEC-103', fields: { status: { name: 'In Progress' } } } };
    const bodyStr = JSON.stringify(payload);
    const signature = signPayload(bodyStr, mockConfigs[jiraIntegrationId].config.webhookSecret);

    const res = await request(app)
      .post(`/api/webhooks/itsm/jira/${jiraIntegrationId}`)
      .set('Content-Type', 'application/json')
      .set('X-Hub-Signature', signature)
      .send(bodyStr);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.status).toBe('DUPLICATE_ACKNOWLEDGED');
  });

  // ───────────────────────────────────────────────────────────────────────────
  // TEST 4: Expected unmatched/no-binding event -> HTTP 200 preserved
  // ───────────────────────────────────────────────────────────────────────────
  test('TEST 4: Unmatched ticket returns HTTP 200 with UNMATCHED business status', async () => {
    jest.spyOn(inboundTicketReconciliationService, 'reconcileWebhook').mockResolvedValue({
      success: true,
      status: 'UNMATCHED',
      matched: false,
      reason: 'TICKET_NOT_FOUND',
      externalTicketKey: 'UNMANAGED-999',
    });

    const payload = { testId: 'test-4', issue: { id: '999', key: 'UNMANAGED-999', fields: { status: { name: 'Closed' } } } };
    const bodyStr = JSON.stringify(payload);
    const signature = signPayload(bodyStr, mockConfigs[jiraIntegrationId].config.webhookSecret);

    const res = await request(app)
      .post(`/api/webhooks/itsm/jira/${jiraIntegrationId}`)
      .set('Content-Type', 'application/json')
      .set('X-Hub-Signature', signature)
      .send(bodyStr);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.status).toBe('AUTHENTICATED');
    expect(res.body.reconciliation.status).toBe('UNMATCHED');
    expect(res.body.reconciliation.reason).toBe('TICKET_NOT_FOUND');
  });

  // ───────────────────────────────────────────────────────────────────────────
  // TEST 5: Injected internal reconciliation failure -> returns HTTP 500
  // ───────────────────────────────────────────────────────────────────────────
  test('TEST 5: Injected internal reconciliation DB failure returns HTTP 500', async () => {
    // Simulate internal exception in reconciler
    jest.spyOn(inboundTicketReconciliationService, 'reconcileWebhook').mockResolvedValue({
      success: false,
      status: 'INTERNAL_SERVER_ERROR',
      error: 'RECONCILIATION_FAILED',
      message: 'An internal error occurred during ticket reconciliation.',
    });

    const payload = { testId: 'test-5', issue: { id: '1005', key: 'SEC-105', fields: { status: { name: 'Resolved' } } } };
    const bodyStr = JSON.stringify(payload);
    const signature = signPayload(bodyStr, mockConfigs[jiraIntegrationId].config.webhookSecret);

    const res = await request(app)
      .post(`/api/webhooks/itsm/jira/${jiraIntegrationId}`)
      .set('Content-Type', 'application/json')
      .set('X-Hub-Signature', signature)
      .send(bodyStr);

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('INTERNAL_SERVER_ERROR');
    expect(res.body.message).toBe('Internal processing error during ticket reconciliation.');
  });

  // ───────────────────────────────────────────────────────────────────────────
  // TEST 6: Injected internal approval callback failure -> returns HTTP 500
  // ───────────────────────────────────────────────────────────────────────────
  test('TEST 6: Injected internal approval callback failure returns HTTP 500', async () => {
    jest.spyOn(externalApprovalCallbackNormalizer, 'isApprovalCallback').mockReturnValue(true);
    jest.spyOn(externalApprovalCallbackService, 'handleCallback').mockResolvedValue({
      success: false,
      status: 'INTERNAL_SERVER_ERROR',
      error: 'ApprovalDoc write conflict on replica set',
    });

    const payload = { testId: 'test-6', approvalId: 'APPR-FAIL-01', decision: 'approved' };
    const bodyStr = JSON.stringify(payload);
    const signature = signPayload(bodyStr, mockConfigs[webhookIntegrationId].config.webhookSecret);

    const res = await request(app)
      .post(`/api/webhooks/itsm/webhook/${webhookIntegrationId}`)
      .set('Content-Type', 'application/json')
      .set('X-Webhook-Signature', signature)
      .send(bodyStr);

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('INTERNAL_SERVER_ERROR');
    expect(res.body.message).toBe('Internal processing error during approval callback execution.');
  });

  // ───────────────────────────────────────────────────────────────────────────
  // TEST 7: Internal failure response sanitization: zero leaks
  // ───────────────────────────────────────────────────────────────────────────
  test('TEST 7: Internal failure response contains no stack traces, database details, secrets, or internals', async () => {
    // Injected exception that throws directly
    jest.spyOn(inboundTicketReconciliationService, 'reconcileWebhook').mockRejectedValue(
      new Error('MongoServerError: E11000 duplicate key error collection: cybershield.cases index: caseId_1 dup key: { caseId: "CASE-999" }')
    );

    const payload = { testId: 'test-7-unique', issue: { id: '1007', key: 'SEC-107', fields: { status: { name: 'Closed-Internal-Error' } } } };
    const bodyStr = JSON.stringify(payload);
    const signature = signPayload(bodyStr, mockConfigs[jiraIntegrationId].config.webhookSecret);

    const res = await request(app)
      .post(`/api/webhooks/itsm/jira/${jiraIntegrationId}`)
      .set('Content-Type', 'application/json')
      .set('X-Hub-Signature', signature)
      .send(bodyStr);

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('INTERNAL_SERVER_ERROR');

    const resJson = JSON.stringify(res.body);

    // Verify zero leakage of database error internals
    expect(resJson).not.toContain('MongoServerError');
    expect(resJson).not.toContain('E11000');
    expect(resJson).not.toContain('cybershield.cases');
    expect(resJson).not.toContain('dup key');
    expect(res.body.stack).toBeUndefined();

    // Verify zero leakage of secrets
    expect(resJson).not.toContain('super-secret-jira-token-999');
    expect(resJson).not.toContain('jira-hmac-secret-xyz123');
    expect(resJson).not.toContain('generic-webhook-secret-456');

    // Verify zero leakage of tenant internals
    expect(resJson).not.toContain(tenantOrgId.toString());
  });

  // ───────────────────────────────────────────────────────────────────────────
  // TEST 8: Expected business outcomes do not trigger external retry loops
  // ───────────────────────────────────────────────────────────────────────────
  test('TEST 8: Non-fatal business outcomes (unsupported status, blocked) return HTTP 200 so providers do not loop retries', async () => {
    jest.spyOn(inboundTicketReconciliationService, 'reconcileWebhook').mockResolvedValue({
      success: false,
      status: 'UNSUPPORTED_STATUS',
      reason: 'STATUS_NOT_MAPPED',
      externalStatus: 'CustomVendorPending',
    });

    const payload = { testId: 'test-8', issue: { id: '1008', key: 'SEC-108', fields: { status: { name: 'CustomVendorPending' } } } };
    const bodyStr = JSON.stringify(payload);
    const signature = signPayload(bodyStr, mockConfigs[jiraIntegrationId].config.webhookSecret);

    const res = await request(app)
      .post(`/api/webhooks/itsm/jira/${jiraIntegrationId}`)
      .set('Content-Type', 'application/json')
      .set('X-Hub-Signature', signature)
      .send(bodyStr);

    // Business rejection must acknowledge safely with HTTP 200 so external webhook queue doesn't retry indefinitely
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.status).toBe('AUTHENTICATED');
    expect(res.body.reconciliation.status).toBe('UNSUPPORTED_STATUS');
  });
});
