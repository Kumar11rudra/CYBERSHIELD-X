/**
 * CyberShield X — Phase 81 Remediation Test Suite
 * FINDING-03: Approval vs Ticket Reconciliation Ambiguity Fallback
 *
 * Verifies that when an incoming webhook is heuristically classified as an approval
 * callback but matches NO active PendingApproval record in the database, the controller
 * deterministically falls through to the Inbound Ticket Reconciliation Engine (Step 5)
 * instead of terminating early with empty status.
 *
 * Test Matrix:
 * - Case A: Approval-like event matches approval -> transitions approval, does NOT reconcile ticket
 * - Case B: Approval-like event matches NO approval, but matches a ticket -> reconciles ticket successfully
 * - Case C: Approval-like event matches NEITHER -> safely acknowledged / unmatched, zero mutations
 * - Case D: Non-approval ticket event -> normal reconciliation path untouched
 * - Case E: Internal error on approval -> HTTP 500 fail-closed preserved (FINDING-01)
 * - Case F: Internal error on reconciliation (when approval unmatched) -> HTTP 500 fail-closed preserved (FINDING-01)
 * - Case G: Duplicate acknowledgment preserved on both branches
 * - Case H: Tenant boundary isolation preserved during fallthrough
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

describe('Phase 81 Remediation — FINDING-03 Approval vs Ticket Reconciliation Ambiguity Fallback', () => {
  const tenantOrgId = new mongoose.Types.ObjectId();
  const otherOrgId = new mongoose.Types.ObjectId();
  const jiraIntegrationId = new mongoose.Types.ObjectId().toString();
  const genericIntegrationId = new mongoose.Types.ObjectId().toString();

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
    [genericIntegrationId]: {
      _id: genericIntegrationId,
      organizationId: tenantOrgId,
      type: 'Webhook',
      name: 'Generic ITSM Webhook',
      active: true,
      config: {
        webhookSecret: 'generic-webhook-secret-456',
      },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock IntegrationConfig.findById
    jest.spyOn(IntegrationConfig, 'findById').mockImplementation((id) => {
      const idStr = String(id);
      if (mockConfigs[idStr]) {
        return Promise.resolve(mockConfigs[idStr]);
      }
      return Promise.resolve(null);
    });

    // Mock IntegrationSyncEvent.create and findOne
    jest.spyOn(IntegrationSyncEvent, 'create').mockResolvedValue({ _id: new mongoose.Types.ObjectId() });
    jest.spyOn(IntegrationSyncEvent, 'findOne').mockResolvedValue(null);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // Helper to generate HMAC headers
  function signBody(body, secret) {
    const raw = typeof body === 'string' ? body : JSON.stringify(body);
    return {
      raw,
      signature: crypto.createHmac('sha256', secret).update(raw).digest('hex'),
    };
  }

  // =========================================================================
  // Case A: Approval-like event matches approval -> transitions approval, does NOT reconcile ticket
  // =========================================================================
  describe('Case A: Approval-like Event Matches Approval', () => {
    test('transitions approval record and does NOT invoke ticket reconciler', async () => {
      const mockApproval = {
        approvalId: 'APPR-MATCH-001',
        status: 'AWAITING_APPROVAL',
        organizationId: tenantOrgId,
        expiresAt: new Date(Date.now() + 86400000),
        save: jest.fn().mockResolvedValue(true),
      };

      const handleCallbackSpy = jest.spyOn(externalApprovalCallbackService, 'handleCallback').mockResolvedValue({
        success: true,
        status: 'TRANSITION_COMPLETE',
        matched: true,
        previousStatus: 'AWAITING_APPROVAL',
        newStatus: 'APPROVED',
        approvalId: 'APPR-MATCH-001',
      });

      const reconcileSpy = jest.spyOn(inboundTicketReconciliationService, 'reconcileWebhook');

      const payload = { approvalId: 'APPR-MATCH-001', decision: 'approved', comment: 'Approved by Lead SecOps' };
      const { raw, signature } = signBody(payload, mockConfigs[genericIntegrationId].config.webhookSecret);

      const res = await request(app)
        .post(`/api/webhooks/itsm/webhook/${genericIntegrationId}`)
        .set('x-webhook-signature', signature)
        .set('content-type', 'application/json')
        .send(raw);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.status).toBe('AUTHENTICATED');
      expect(res.body.approvalCallback).toBeDefined();
      expect(res.body.approvalCallback.status).toBe('TRANSITION_COMPLETE');
      expect(res.body.approvalCallback.newStatus).toBe('APPROVED');
      expect(res.body.reconciliation).toBeUndefined();

      expect(handleCallbackSpy).toHaveBeenCalledTimes(1);
      expect(reconcileSpy).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // Case B: Approval-like event matches NO approval, but matches a ticket -> reconciles ticket
  // =========================================================================
  describe('Case B: Approval-like Event Matches NO Approval, but Matches a Ticket', () => {
    test('deterministically falls through from approval to ticket reconciliation and updates ticket', async () => {
      // Step 6 handleCallback reports UNMATCHED (no PendingApproval with that ID/ref)
      const handleCallbackSpy = jest.spyOn(externalApprovalCallbackService, 'handleCallback').mockResolvedValue({
        success: true,
        status: 'UNMATCHED',
        matched: false,
        reason: 'APPROVAL_NOT_FOUND',
        approvalId: '10042',
      });

      // Step 5 reconcileWebhook matches the ticket and reconciles it
      const reconcileSpy = jest.spyOn(inboundTicketReconciliationService, 'reconcileWebhook').mockResolvedValue({
        success: true,
        status: 'RECONCILED',
        action: 'STATUS_UPDATED',
        caseId: 'CASE-2026-0042',
        ticketKey: 'SEC-10042',
        newStatus: 'IN_PROGRESS',
        previousStatus: 'OPEN',
      });

      // Payload has both decision heuristic (approval-like) and Jira issue structure (ticket)
      const payload = {
        webhookEvent: 'jira:issue_updated',
        decision: 'approved', // causes isApproval to be true
        issue: {
          id: '10042',
          key: 'SEC-10042',
          fields: {
            status: { name: 'In Progress' },
            updated: new Date().toISOString(),
          },
        },
      };

      const { raw, signature } = signBody(payload, mockConfigs[jiraIntegrationId].config.webhookSecret);

      const res = await request(app)
        .post(`/api/webhooks/itsm/jira/${jiraIntegrationId}`)
        .set('x-hub-signature', `sha256=${signature}`)
        .set('content-type', 'application/json')
        .send(raw);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.status).toBe('AUTHENTICATED');
      expect(res.body.reconciliation).toBeDefined();
      expect(res.body.reconciliation.status).toBe('RECONCILED');
      expect(res.body.reconciliation.caseId).toBe('CASE-2026-0042');
      expect(res.body.approvalCallback).toBeUndefined();

      expect(handleCallbackSpy).toHaveBeenCalledTimes(1);
      expect(reconcileSpy).toHaveBeenCalledTimes(1);
    });
  });

  // =========================================================================
  // Case C: Approval-like event matches NEITHER -> safely acknowledged, zero mutations
  // =========================================================================
  describe('Case C: Approval-like Event Matches NEITHER Approval NOR Ticket', () => {
    test('safely returns 200 with UNMATCHED reconciliation, executing zero mutations', async () => {
      // Step 6 handleCallback reports UNMATCHED
      const handleCallbackSpy = jest.spyOn(externalApprovalCallbackService, 'handleCallback').mockResolvedValue({
        success: true,
        status: 'UNMATCHED',
        matched: false,
        reason: 'APPROVAL_NOT_FOUND',
        approvalId: 'APPR-GHOST-999',
      });

      // Step 5 reconcileWebhook reports UNMATCHED
      const reconcileSpy = jest.spyOn(inboundTicketReconciliationService, 'reconcileWebhook').mockResolvedValue({
        success: true,
        status: 'UNMATCHED',
        matched: false,
        reason: 'UNMATCHED_TICKET',
      });

      const payload = { approvalId: 'APPR-GHOST-999', decision: 'approved', ticketKey: 'TICKET-NONEXISTENT' };
      const { raw, signature } = signBody(payload, mockConfigs[genericIntegrationId].config.webhookSecret);

      const res = await request(app)
        .post(`/api/webhooks/itsm/webhook/${genericIntegrationId}`)
        .set('x-webhook-signature', signature)
        .set('content-type', 'application/json')
        .send(raw);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.status).toBe('AUTHENTICATED');
      expect(res.body.reconciliation).toBeDefined();
      expect(res.body.reconciliation.status).toBe('UNMATCHED');
      expect(res.body.reconciliation.matched).toBe(false);

      expect(handleCallbackSpy).toHaveBeenCalledTimes(1);
      expect(reconcileSpy).toHaveBeenCalledTimes(1);
    });
  });

  // =========================================================================
  // Case D: Non-approval ticket event -> normal reconciliation path untouched
  // =========================================================================
  describe('Case D: Standard Ticket Event (No Approval Heuristic)', () => {
    test('routes directly to reconciliation without calling approval callback engine', async () => {
      const handleCallbackSpy = jest.spyOn(externalApprovalCallbackService, 'handleCallback');
      const reconcileSpy = jest.spyOn(inboundTicketReconciliationService, 'reconcileWebhook').mockResolvedValue({
        success: true,
        status: 'RECONCILED',
        caseId: 'CASE-2026-0001',
      });

      const payload = {
        webhookEvent: 'jira:issue_updated',
        issue: {
          id: '10001',
          key: 'SEC-1',
          fields: {
            status: { name: 'Resolved' },
          },
        },
      };

      const { raw, signature } = signBody(payload, mockConfigs[jiraIntegrationId].config.webhookSecret);

      const res = await request(app)
        .post(`/api/webhooks/itsm/jira/${jiraIntegrationId}`)
        .set('x-hub-signature', `sha256=${signature}`)
        .set('content-type', 'application/json')
        .send(raw);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.reconciliation).toBeDefined();
      expect(handleCallbackSpy).not.toHaveBeenCalled();
      expect(reconcileSpy).toHaveBeenCalledTimes(1);
    });
  });

  // =========================================================================
  // Case E: Internal error on approval -> 500 preserved (FINDING-01)
  // =========================================================================
  describe('Case E: Internal Error on Approval Callback Execution', () => {
    test('fails closed with HTTP 500 and does not fall through to reconciliation', async () => {
      jest.spyOn(externalApprovalCallbackService, 'handleCallback').mockRejectedValue(
        new Error('Database write collision on approvals collection')
      );
      const reconcileSpy = jest.spyOn(inboundTicketReconciliationService, 'reconcileWebhook');

      const payload = { approvalId: 'APPR-ERR-01', decision: 'approved' };
      const { raw, signature } = signBody(payload, mockConfigs[genericIntegrationId].config.webhookSecret);

      const res = await request(app)
        .post(`/api/webhooks/itsm/webhook/${genericIntegrationId}`)
        .set('x-webhook-signature', signature)
        .set('content-type', 'application/json')
        .send(raw);

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('INTERNAL_SERVER_ERROR');
      expect(res.body.message).toBe('Internal processing error during approval callback execution.');
      expect(res.body.stack).toBeUndefined();

      expect(reconcileSpy).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // Case F: Internal error on reconciliation (when approval unmatched) -> 500 preserved
  // =========================================================================
  describe('Case F: Internal Error on Fallthrough Reconciliation', () => {
    test('fails closed with HTTP 500 when reconciler throws after unmatched approval', async () => {
      jest.spyOn(externalApprovalCallbackService, 'handleCallback').mockResolvedValue({
        success: true,
        status: 'UNMATCHED',
        matched: false,
        reason: 'APPROVAL_NOT_FOUND',
      });

      jest.spyOn(inboundTicketReconciliationService, 'reconcileWebhook').mockRejectedValue(
        new Error('Case repository connection lost')
      );

      const payload = { approvalId: 'APPR-UNMATCHED', decision: 'rejected' };
      const { raw, signature } = signBody(payload, mockConfigs[genericIntegrationId].config.webhookSecret);

      const res = await request(app)
        .post(`/api/webhooks/itsm/webhook/${genericIntegrationId}`)
        .set('x-webhook-signature', signature)
        .set('content-type', 'application/json')
        .send(raw);

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('INTERNAL_SERVER_ERROR');
      expect(res.body.message).toBe('Internal processing error during ticket reconciliation.');
      expect(res.body.stack).toBeUndefined();
    });
  });

  // =========================================================================
  // Case G: Duplicate acknowledgment preserved on both branches
  // =========================================================================
  describe('Case G: Duplicate Acknowledgment Preserved', () => {
    test('returns DUPLICATE_ACKNOWLEDGED when approval engine detects replay', async () => {
      jest.spyOn(externalApprovalCallbackService, 'handleCallback').mockResolvedValue({
        success: true,
        status: 'DUPLICATE_ACKNOWLEDGED',
        reason: 'REPLAY_DETECTED',
      });

      const payload = { approvalId: 'APPR-REPLAY', decision: 'approved' };
      const { raw, signature } = signBody(payload, mockConfigs[genericIntegrationId].config.webhookSecret);

      const res = await request(app)
        .post(`/api/webhooks/itsm/webhook/${genericIntegrationId}`)
        .set('x-webhook-signature', signature)
        .set('content-type', 'application/json')
        .send(raw);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('DUPLICATE_ACKNOWLEDGED');
    });

    test('returns DUPLICATE_ACKNOWLEDGED when reconciler detects replay on fallthrough', async () => {
      jest.spyOn(externalApprovalCallbackService, 'handleCallback').mockResolvedValue({
        success: true,
        status: 'UNMATCHED',
        matched: false,
      });

      jest.spyOn(inboundTicketReconciliationService, 'reconcileWebhook').mockResolvedValue({
        success: true,
        status: 'DUPLICATE_ACKNOWLEDGED',
        reason: 'REPLAY_DETECTED',
      });

      const payload = { approvalId: 'APPR-FALLTHROUGH-REPLAY', decision: 'approved' };
      const { raw, signature } = signBody(payload, mockConfigs[genericIntegrationId].config.webhookSecret);

      const res = await request(app)
        .post(`/api/webhooks/itsm/webhook/${genericIntegrationId}`)
        .set('x-webhook-signature', signature)
        .set('content-type', 'application/json')
        .send(raw);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('DUPLICATE_ACKNOWLEDGED');
    });
  });

  // =========================================================================
  // Case H: Multi-tenant boundary preservation during fallthrough
  // =========================================================================
  describe('Case H: Multi-Tenant Boundary Preservation During Fallthrough', () => {
    test('passes authenticated config and tenant organizationId to reconciler on fallthrough', async () => {
      jest.spyOn(externalApprovalCallbackService, 'handleCallback').mockResolvedValue({
        success: true,
        status: 'UNMATCHED',
        matched: false,
      });

      let capturedContext = null;
      jest.spyOn(inboundTicketReconciliationService, 'reconcileWebhook').mockImplementation(async (ctx) => {
        capturedContext = ctx;
        return {
          success: true,
          status: 'UNMATCHED',
          matched: false,
        };
      });

      const payload = { approvalId: 'APPR-TENANT-CHECK', decision: 'approved' };
      const { raw, signature } = signBody(payload, mockConfigs[genericIntegrationId].config.webhookSecret);

      const res = await request(app)
        .post(`/api/webhooks/itsm/webhook/${genericIntegrationId}`)
        .set('x-webhook-signature', signature)
        .set('content-type', 'application/json')
        .send(raw);

      expect(res.status).toBe(200);
      expect(capturedContext).toBeDefined();
      expect(capturedContext.config.organizationId.toString()).toBe(tenantOrgId.toString());
      expect(capturedContext.config._id.toString()).toBe(genericIntegrationId);
      expect(capturedContext.isControllerHandoff).toBe(true);
    });
  });
});
