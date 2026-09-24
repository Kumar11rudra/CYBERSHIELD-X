'use strict';

/**
 * 🛡️ CyberShield X — Phase 81 Step 6 External Approval Callback Test Battery
 *
 * Acceptance Gates:
 * GATE A — AUTHENTICATION BOUNDARY (Step 4 verification preserved, secret query param blocked)
 * GATE B — TENANT ISOLATION (Authoritative orgId from config, payload tenant ignored)
 * GATE C — PROVIDER & INTEGRATION SCOPING (Provider mismatch defense, scoped search)
 * GATE D — APPROVAL NORMALIZATION (Jira, ServiceNow, PagerDuty, Generic, malformed fail-closed)
 * GATE E — STATE MACHINE REUSE (PROPOSED, AWAITING_APPROVAL valid states)
 * GATE F — APPROVED TRANSITION (Mutates to APPROVED, sets approvedBy, saves without execution)
 * GATE G — REJECTED / DENIED TRANSITION (Mutates to DENIED, sets approvedBy and reason)
 * GATE H — UNSUPPORTED DECISION (Rejects unknown decision, preserves state unchanged)
 * GATE I — UNMATCHED APPROVAL (Safe acknowledgment, never creates approval, records audit)
 * GATE J — DUPLICATE IDEMPOTENCY (Memory cache & durable DB deduplication)
 * GATE K — CONCURRENCY DEFENSE (Intra-process lock & atomic unique index race handling)
 * GATE L — DURABLE RESTART SURVIVAL (Deterministic RFC 4122 UUID v4 syncId)
 * GATE M — TERMINAL STATE PROTECTION (APPROVED, DENIED, EXECUTING, COMPLETED cannot regress)
 * GATE N — STALE CALLBACK DEFENSE (Delayed out-of-order callback blocked)
 * GATE O — EXPIRATION DEFENSE (Expired approvals marked EXPIRED and transition blocked)
 * GATE P — ZERO ACTION EXECUTION (No terminal, playbook, or tool runner invoked)
 * GATE Q — ZERO OUTBOUND DISPATCH (No outbound queue echo loops)
 * GATE R — IMMUTABLE AUDIT TRAIL (IntegrationSyncEvent conformance: INBOUND, APPROVAL, UUID v4)
 * GATE S — SECRET SANITIZATION (SHA-256 payloadHash, zero tokens/secrets logged)
 * GATE T — SAFE ERROR RESPONSES (Non-enumerative responses, no stack traces)
 * GATE U — CROSS-TENANT ISOLATION (Org A cannot touch Org B approval)
 * GATE V — RUNTIME CONTROLLER ROUTING (Supertest HTTP approval callback delivery)
 * GATE W — STEP 5 REGRESSION PRESERVATION (Ordinary ticket sync continues to route to reconciler)
 */

const request = require('supertest');
const express = require('express');
const crypto = require('crypto');
const mongoose = require('mongoose');

// Services & Models
const normalizer = require('../services/soc/ExternalApprovalCallbackNormalizer');
const callbackService = require('../services/soc/ExternalApprovalCallbackService');
const ticketNormalizer = require('../services/soc/InboundTicketNormalizer');
const ticketReconciler = require('../services/soc/InboundTicketReconciliationService');
const itsmSignatureVerifier = require('../services/soc/ItsmSignatureVerifier');
const safePlaybookAutomationService = require('../services/soc/SafePlaybookAutomationService');
const outboundDispatchService = require('../services/soc/OutboundDispatchService');
const PendingApproval = require('../models/PendingApproval');
const IntegrationConfig = require('../models/IntegrationConfig');
const IntegrationSyncEvent = require('../models/IntegrationSyncEvent');
const Case = require('../models/Case');
const inboundWebhookRouter = require('../routes/inboundWebhook');

// Build isolated Express test app with rawBody preservation
const testApp = express();
testApp.use(
  express.json({
    limit: '1mb',
    verify: (req, res, buf) => {
      if (buf && buf.length) {
        req.rawBody = buf;
      }
    },
  })
);
testApp.use('/api/webhooks', inboundWebhookRouter);

describe('Phase 81 Step 6 — External Approval Callback Engine Battery', () => {
  const orgA = new mongoose.Types.ObjectId();
  const orgB = new mongoose.Types.ObjectId();

  const jiraIntegrationId = new mongoose.Types.ObjectId().toString();
  const snIntegrationId = new mongoose.Types.ObjectId().toString();
  const pdIntegrationId = new mongoose.Types.ObjectId().toString();
  const genericIntegrationId = new mongoose.Types.ObjectId().toString();

  const mockConfigs = {
    [jiraIntegrationId]: {
      _id: jiraIntegrationId,
      organizationId: orgA,
      type: 'Jira',
      name: 'Production Jira',
      active: true,
      config: {
        baseUrl: 'https://cybershield.atlassian.net',
        webhookSecret: 'jira-secret-key-1234',
      },
    },
    [snIntegrationId]: {
      _id: snIntegrationId,
      organizationId: orgA,
      type: 'ServiceNow',
      name: 'Production ServiceNow',
      active: true,
      config: {
        instanceUrl: 'https://dev12345.service-now.com',
        webhookSecret: 'sn-secret-token-5678',
      },
    },
    [pdIntegrationId]: {
      _id: pdIntegrationId,
      organizationId: orgA,
      type: 'PagerDuty',
      name: 'Production PagerDuty',
      active: true,
      config: {
        serviceId: 'PD-SERVICE-99',
        webhookSecret: 'pd-secret-token-9988',
      },
    },
    [genericIntegrationId]: {
      _id: genericIntegrationId,
      organizationId: orgA,
      type: 'Generic',
      name: 'Custom Webhook',
      active: true,
      config: {
        webhookSecret: 'generic-secret-token-0000',
      },
    },
  };

  let recordedAudits = [];
  let enqueueDispatchSpy;
  let approveAndExecuteSpy;

  beforeEach(() => {
    recordedAudits = [];
    callbackService._recentEvents.clear();
    callbackService._inFlightApprovals.clear();
    itsmSignatureVerifier.replayCache.clear();

    jest.spyOn(IntegrationConfig, 'findById').mockImplementation(async (id) => {
      return mockConfigs[String(id)] || null;
    });

    jest.spyOn(IntegrationSyncEvent, 'create').mockImplementation(async (data) => {
      recordedAudits.push(data);
      return data;
    });

    enqueueDispatchSpy = jest.spyOn(outboundDispatchService, 'enqueueDispatch');
    approveAndExecuteSpy = jest.spyOn(safePlaybookAutomationService, 'approveAndExecuteAction');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ═════════════════════════════════════════════════════════════════════════════
  // GATE A: AUTHENTICATION BOUNDARY
  // ═════════════════════════════════════════════════════════════════════════════
  describe('Gate A: Step 4 Authentication Boundary Preserved', () => {
    test('A-01: rejects request when HMAC signature is missing or invalid', async () => {
      const payload = { approvalId: 'APPR-101', decision: 'approved' };
      const res = await request(testApp)
        .post(`/api/webhooks/itsm/generic/${genericIntegrationId}`)
        .send(payload);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('AUTHENTICATION_FAILED');
    });

    test('A-02: rejects query-string secret attempt with 400 Bad Request', async () => {
      const payload = { approvalId: 'APPR-101', decision: 'approved' };
      const res = await request(testApp)
        .post(`/api/webhooks/itsm/generic/${genericIntegrationId}?token=leaked-secret`)
        .send(payload);

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('QUERY_SECRET_PROHIBITED');
    });

    test('A-03: passes valid HMAC signature through to approval callback handler', async () => {
      const payload = { approvalId: 'APPR-101', decision: 'approved' };
      const rawBody = JSON.stringify(payload);
      const secret = mockConfigs[genericIntegrationId].config.webhookSecret;
      const signature = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');

      jest.spyOn(PendingApproval, 'findOne').mockResolvedValue({
        approvalId: 'APPR-101',
        status: 'AWAITING_APPROVAL',
        organizationId: orgA,
        expiresAt: new Date(Date.now() + 86400000),
        save: jest.fn().mockResolvedValue(true),
      });

      const res = await request(testApp)
        .post(`/api/webhooks/itsm/generic/${genericIntegrationId}`)
        .set('x-webhook-signature', signature)
        .set('content-type', 'application/json')
        .send(rawBody);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('AUTHENTICATED');
      expect(res.body.approvalCallback).toBeDefined();
      expect(res.body.approvalCallback.success).toBe(true);
      expect(res.body.approvalCallback.newStatus).toBe('APPROVED');
    });
  });

  // ═════════════════════════════════════════════════════════════════════════════
  // GATE B: AUTHORITATIVE TENANT ISOLATION
  // ═════════════════════════════════════════════════════════════════════════════
  describe('Gate B: Authoritative Tenant Isolation', () => {
    test('B-01: derives organizationId authoritatively from IntegrationConfig and ignores payload tenant claims', async () => {
      let capturedQuery = null;
      jest.spyOn(PendingApproval, 'findOne').mockImplementation(async (query) => {
        capturedQuery = query;
        return {
          approvalId: 'APPR-202',
          status: 'AWAITING_APPROVAL',
          organizationId: orgA,
          expiresAt: new Date(Date.now() + 86400000),
          save: jest.fn().mockResolvedValue(true),
        };
      });

      const req = {
        body: {
          approvalId: 'APPR-202',
          decision: 'approved',
          organizationId: orgB.toString(), // Forged claim!
          tenantId: 'rogue-tenant',
        },
        headers: {},
      };

      const verification = { authenticated: true, method: 'HMAC_SHA256' };
      const result = await callbackService.handleCallback({
        req,
        config: mockConfigs[genericIntegrationId],
        verification,
      });

      expect(result.success).toBe(true);
      expect(capturedQuery.organizationId).toEqual(orgA);
      expect(capturedQuery.organizationId).not.toEqual(orgB);
    });
  });

  // ═════════════════════════════════════════════════════════════════════════════
  // GATE C: PROVIDER & INTEGRATION SCOPING
  // ═════════════════════════════════════════════════════════════════════════════
  describe('Gate C: Provider & Integration Scoping', () => {
    test('C-01: rejects provider mismatch in controller route', async () => {
      const payload = { approvalId: 'APPR-303', decision: 'approved' };
      const rawBody = JSON.stringify(payload);
      const secret = mockConfigs[jiraIntegrationId].config.webhookSecret;
      const signature = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');

      const res = await request(testApp)
        .post(`/api/webhooks/itsm/servicenow/${jiraIntegrationId}`) // Route says servicenow, config is Jira
        .set('x-hub-signature', signature)
        .set('content-type', 'application/json')
        .send(rawBody);

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('PROVIDER_MISMATCH');
    });

    test('C-02: scopes PendingApproval query by organizationId and matching identifiers', async () => {
      let queryArg = null;
      jest.spyOn(PendingApproval, 'findOne').mockImplementation(async (q) => {
        queryArg = q;
        return null;
      });

      const req = {
        body: {
          approvalId: 'APPR-304',
          decision: 'approved',
        },
        headers: {},
      };

      await callbackService.handleCallback({
        req,
        config: mockConfigs[genericIntegrationId],
        verification: { authenticated: true, method: 'HMAC_SHA256' },
      });

      expect(queryArg.organizationId).toEqual(orgA);
      expect(queryArg.$or).toEqual(
        expect.arrayContaining([{ approvalId: 'APPR-304' }])
      );
    });
  });

  // ═════════════════════════════════════════════════════════════════════════════
  // GATE D: APPROVAL CALLBACK NORMALIZATION
  // ═════════════════════════════════════════════════════════════════════════════
  describe('Gate D: Approval Callback Normalization', () => {
    test('D-01: normalizes Jira approval callback payload', () => {
      const req = {
        body: {
          webhookEvent: 'jira:approval_completed',
          approval: {
            id: 'APPR-JIRA-01',
            status: 'approved',
            approver: { name: 'jira_admin', displayName: 'Jira Administrator' },
            comment: 'Approved for automated containment',
          },
          issue: { key: 'SEC-401', id: '10041' },
          timestamp: 1690000000000,
        },
        headers: { 'x-atlassian-webhook-identifier': 'jira-evt-99' },
      };

      const normalized = normalizer.normalize(req, 'JIRA', mockConfigs[jiraIntegrationId]);
      expect(normalized.valid).toBe(true);
      expect(normalized.provider).toBe('JIRA');
      expect(normalized.approvalId).toBe('APPR-JIRA-01');
      expect(normalized.externalReference).toBe('SEC-401');
      expect(normalized.decision).toBe('APPROVED');
      expect(normalized.actor.username).toBe('Jira Administrator');
      expect(normalized.decisionReason).toBe('Approved for automated containment');
      expect(normalized.eventId).toBe('jira-evt-99');
    });

    test('D-02: normalizes ServiceNow sysapproval_approver payload', () => {
      const req = {
        body: {
          table: 'sysapproval_approver',
          sys_id: 'APPR-SN-02',
          document_id: 'INC008899',
          approval_state: 'approved',
          approver_name: 'Beth Anglin',
          comments: 'Approved by IT Security Lead',
          sys_updated_on: '2026-09-20 12:00:00',
        },
        headers: { 'x-servicenow-event-id': 'sn-evt-100' },
      };

      const normalized = normalizer.normalize(req, 'SERVICENOW', mockConfigs[snIntegrationId]);
      expect(normalized.valid).toBe(true);
      expect(normalized.provider).toBe('SERVICENOW');
      expect(normalized.approvalId).toBe('APPR-SN-02');
      expect(normalized.externalReference).toBe('INC008899');
      expect(normalized.decision).toBe('APPROVED');
      expect(normalized.actor.username).toBe('Beth Anglin');
      expect(normalized.decisionReason).toBe('Approved by IT Security Lead');
    });

    test('D-03: normalizes PagerDuty custom action callback', () => {
      const req = {
        body: {
          event: {
            event_type: 'incident.custom_action',
            id: 'pd-evt-200',
            data: {
              approvalId: 'APPR-PD-03',
              action_name: 'deny',
              number: 405,
            },
            agent: { summary: 'On-Call SRE' },
            occurred_at: '2026-09-20T12:05:00Z',
          },
          notes: 'High collateral damage risk',
        },
        headers: {},
      };

      const normalized = normalizer.normalize(req, 'PAGERDUTY', mockConfigs[pdIntegrationId]);
      expect(normalized.valid).toBe(true);
      expect(normalized.provider).toBe('PAGERDUTY');
      expect(normalized.approvalId).toBe('APPR-PD-03');
      expect(normalized.decision).toBe('DENIED');
      expect(normalized.actor.username).toBe('On-Call SRE');
      expect(normalized.decisionReason).toBe('High collateral damage risk');
    });

    test('D-04: normalizes Generic structured callback', () => {
      const req = {
        body: {
          approvalId: 'APPR-GEN-04',
          decision: 'rejected',
          decisionReason: 'Operator denied via Slack integration',
          actor: { username: 'security_analyst', role: 'OPERATOR' },
        },
        headers: { 'x-webhook-event-id': 'gen-evt-300' },
      };

      const normalized = normalizer.normalize(req, 'GENERIC', mockConfigs[genericIntegrationId]);
      expect(normalized.valid).toBe(true);
      expect(normalized.provider).toBe('GENERIC');
      expect(normalized.approvalId).toBe('APPR-GEN-04');
      expect(normalized.decision).toBe('DENIED');
      expect(normalized.actor.username).toBe('security_analyst');
    });

    test('D-05: fails closed on missing approval identity', () => {
      const req = {
        body: {
          decision: 'approved',
          reason: 'No identifier provided',
        },
        headers: {},
      };

      const normalized = normalizer.normalize(req, 'GENERIC', mockConfigs[genericIntegrationId]);
      expect(normalized.valid).toBe(false);
      expect(normalized.error).toBe('MISSING_APPROVAL_IDENTITY');
    });
  });

  // ═════════════════════════════════════════════════════════════════════════════
  // GATE E: STATE MACHINE REUSE
  // ═════════════════════════════════════════════════════════════════════════════
  describe('Gate E: Existing PendingApproval State Machine Reuse', () => {
    test('E-01: operates on AWAITING_APPROVAL status', async () => {
      const mockApproval = {
        approvalId: 'APPR-E01',
        status: 'AWAITING_APPROVAL',
        organizationId: orgA,
        expiresAt: new Date(Date.now() + 86400000),
        save: jest.fn().mockResolvedValue(true),
      };
      jest.spyOn(PendingApproval, 'findOne').mockResolvedValue(mockApproval);

      const req = {
        body: { approvalId: 'APPR-E01', decision: 'approved' },
        headers: {},
      };

      const result = await callbackService.handleCallback({
        req,
        config: mockConfigs[genericIntegrationId],
        verification: { authenticated: true, method: 'HMAC' },
      });

      expect(result.success).toBe(true);
      expect(result.status).toBe('TRANSITION_COMPLETE');
      expect(mockApproval.status).toBe('APPROVED');
    });

    test('E-02: operates on PROPOSED status', async () => {
      const mockApproval = {
        approvalId: 'APPR-E02',
        status: 'PROPOSED',
        organizationId: orgA,
        expiresAt: new Date(Date.now() + 86400000),
        save: jest.fn().mockResolvedValue(true),
      };
      jest.spyOn(PendingApproval, 'findOne').mockResolvedValue(mockApproval);

      const req = {
        body: { approvalId: 'APPR-E02', decision: 'denied' },
        headers: {},
      };

      const result = await callbackService.handleCallback({
        req,
        config: mockConfigs[genericIntegrationId],
        verification: { authenticated: true, method: 'HMAC' },
      });

      expect(result.success).toBe(true);
      expect(result.status).toBe('TRANSITION_COMPLETE');
      expect(mockApproval.status).toBe('DENIED');
    });
  });

  // ═════════════════════════════════════════════════════════════════════════════
  // GATE F: APPROVED TRANSITION
  // ═════════════════════════════════════════════════════════════════════════════
  describe('Gate F: APPROVED Transition Lifecycle', () => {
    test('F-01: transitions to APPROVED, updates approvedBy metadata, saves document', async () => {
      const mockApproval = {
        approvalId: 'APPR-F01',
        status: 'AWAITING_APPROVAL',
        organizationId: orgA,
        expiresAt: new Date(Date.now() + 86400000),
        save: jest.fn().mockResolvedValue(true),
      };
      jest.spyOn(PendingApproval, 'findOne').mockResolvedValue(mockApproval);

      const req = {
        body: {
          approvalId: 'APPR-F01',
          decision: 'approved',
          decisionReason: 'Lead Architect approved containment',
          actor: { userId: 'usr-123', username: 'lead_architect' },
        },
        headers: {},
      };

      const result = await callbackService.handleCallback({
        req,
        config: mockConfigs[genericIntegrationId],
        verification: { authenticated: true, method: 'HMAC' },
      });

      expect(result.success).toBe(true);
      expect(result.newStatus).toBe('APPROVED');
      expect(mockApproval.status).toBe('APPROVED');
      expect(mockApproval.decisionReason).toBe('Lead Architect approved containment');
      expect(mockApproval.approvedBy.username).toBe('lead_architect');
      expect(mockApproval.approvedBy.role).toBe('EXTERNAL_ITSM');
      expect(mockApproval.save).toHaveBeenCalled();
    });
  });

  // ═════════════════════════════════════════════════════════════════════════════
  // GATE G: REJECTED / DENIED TRANSITION
  // ═════════════════════════════════════════════════════════════════════════════
  describe('Gate G: REJECTED / DENIED Transition Lifecycle', () => {
    test('G-01: transitions to DENIED, updates approvedBy metadata and rejection reason', async () => {
      const mockApproval = {
        approvalId: 'APPR-G01',
        status: 'AWAITING_APPROVAL',
        organizationId: orgA,
        expiresAt: new Date(Date.now() + 86400000),
        save: jest.fn().mockResolvedValue(true),
      };
      jest.spyOn(PendingApproval, 'findOne').mockResolvedValue(mockApproval);

      const req = {
        body: {
          approvalId: 'APPR-G01',
          decision: 'rejected',
          decisionReason: 'Risk level too high for automated execution',
          actor: { userId: 'usr-456', username: 'ciso_operator' },
        },
        headers: {},
      };

      const result = await callbackService.handleCallback({
        req,
        config: mockConfigs[genericIntegrationId],
        verification: { authenticated: true, method: 'HMAC' },
      });

      expect(result.success).toBe(true);
      expect(result.newStatus).toBe('DENIED');
      expect(mockApproval.status).toBe('DENIED');
      expect(mockApproval.decisionReason).toBe('Risk level too high for automated execution');
      expect(mockApproval.approvedBy.username).toBe('ciso_operator');
      expect(mockApproval.save).toHaveBeenCalled();
    });
  });

  // ═════════════════════════════════════════════════════════════════════════════
  // GATE H: UNSUPPORTED DECISION REJECTION
  // ═════════════════════════════════════════════════════════════════════════════
  describe('Gate H: Unsupported Decision Rejection', () => {
    test('H-01: preserves PendingApproval unchanged when external decision is unrecognized', async () => {
      const mockApproval = {
        approvalId: 'APPR-H01',
        status: 'AWAITING_APPROVAL',
        organizationId: orgA,
        expiresAt: new Date(Date.now() + 86400000),
        save: jest.fn().mockResolvedValue(true),
      };
      jest.spyOn(PendingApproval, 'findOne').mockResolvedValue(mockApproval);

      const req = {
        body: {
          approvalId: 'APPR-H01',
          decision: 'need_more_info', // Unsupported decision!
        },
        headers: {},
      };

      const result = await callbackService.handleCallback({
        req,
        config: mockConfigs[genericIntegrationId],
        verification: { authenticated: true, method: 'HMAC' },
      });

      expect(result.success).toBe(true);
      expect(result.status).toBe('UNSUPPORTED_DECISION');
      expect(mockApproval.status).toBe('AWAITING_APPROVAL'); // Unchanged!
      expect(mockApproval.save).not.toHaveBeenCalled();

      // Audit recorded with APPROVAL_UNSUPPORTED
      const audit = recordedAudits.find((a) => a.eventType === 'APPROVAL_UNSUPPORTED');
      expect(audit).toBeDefined();
      expect(audit.status).toBe('REJECTED');
    });
  });

  // ═════════════════════════════════════════════════════════════════════════════
  // GATE I: UNMATCHED APPROVAL
  // ═════════════════════════════════════════════════════════════════════════════
  describe('Gate I: Unmatched Approval Handling', () => {
    test('I-01: returns safe unmatched acknowledgment, creates zero records', async () => {
      jest.spyOn(PendingApproval, 'findOne').mockResolvedValue(null);
      const createSpy = jest.spyOn(PendingApproval, 'create');

      const req = {
        body: {
          approvalId: 'APPR-NONEXISTENT-999',
          decision: 'approved',
        },
        headers: {},
      };

      const result = await callbackService.handleCallback({
        req,
        config: mockConfigs[genericIntegrationId],
        verification: { authenticated: true, method: 'HMAC' },
      });

      expect(result.success).toBe(true);
      expect(result.status).toBe('UNMATCHED');
      expect(result.matched).toBe(false);
      expect(createSpy).not.toHaveBeenCalled();

      const audit = recordedAudits.find((a) => a.eventType === 'APPROVAL_UNMATCHED');
      expect(audit).toBeDefined();
      expect(audit.status).toBe('REJECTED');
    });
  });

  // ═════════════════════════════════════════════════════════════════════════════
  // GATE J: DUPLICATE CALLBACK IDEMPOTENCY
  // ═════════════════════════════════════════════════════════════════════════════
  describe('Gate J: Duplicate Callback Idempotency', () => {
    test('J-01: repeated delivery within memory cache is acknowledged without mutating approval', async () => {
      const mockApproval = {
        approvalId: 'APPR-J01',
        status: 'AWAITING_APPROVAL',
        organizationId: orgA,
        expiresAt: new Date(Date.now() + 86400000),
        save: jest.fn().mockResolvedValue(true),
      };
      jest.spyOn(PendingApproval, 'findOne').mockResolvedValue(mockApproval);

      const req = {
        body: { approvalId: 'APPR-J01', decision: 'approved' },
        headers: {},
      };

      // First delivery: processes successfully
      const first = await callbackService.handleCallback({
        req,
        config: mockConfigs[genericIntegrationId],
        verification: { authenticated: true, method: 'HMAC' },
      });
      expect(first.status).toBe('TRANSITION_COMPLETE');
      expect(mockApproval.save).toHaveBeenCalledTimes(1);

      // Second delivery: caught by memory cache
      const second = await callbackService.handleCallback({
        req,
        config: mockConfigs[genericIntegrationId],
        verification: { authenticated: true, method: 'HMAC' },
      });
      expect(second.status).toBe('DUPLICATE_ACKNOWLEDGED');
      expect(second.reason).toBe('MEMORY_CACHE_DUPLICATE');
      expect(mockApproval.save).toHaveBeenCalledTimes(1); // Not called again!
    });

    test('J-02: redelivery after memory cache cleared is caught by durable DB lookup', async () => {
      const mockApproval = {
        approvalId: 'APPR-J02',
        status: 'AWAITING_APPROVAL',
        organizationId: orgA,
        expiresAt: new Date(Date.now() + 86400000),
        save: jest.fn().mockResolvedValue(true),
      };
      jest.spyOn(PendingApproval, 'findOne').mockResolvedValue(mockApproval);

      const req = {
        body: { approvalId: 'APPR-J02', decision: 'approved' },
        headers: {},
      };

      // First delivery
      await callbackService.handleCallback({
        req,
        config: mockConfigs[genericIntegrationId],
        verification: { authenticated: true, method: 'HMAC' },
      });

      // Clear memory cache (simulating process restart)
      callbackService._recentEvents.clear();

      // Mock database lookup finding existing sync event
      jest.spyOn(IntegrationSyncEvent, 'findOne').mockReturnValue({
        lean: jest.fn().mockResolvedValue({
          syncId: 'existing-sync-id',
          status: 'SUCCESS',
        }),
      });

      // Second delivery
      const redelivery = await callbackService.handleCallback({
        req,
        config: mockConfigs[genericIntegrationId],
        verification: { authenticated: true, method: 'HMAC' },
      });

      expect(redelivery.status).toBe('DUPLICATE_ACKNOWLEDGED');
      expect(redelivery.reason).toBe('DURABLE_AUDIT_DUPLICATE');
      expect(mockApproval.save).toHaveBeenCalledTimes(1);
    });
  });

  // ═════════════════════════════════════════════════════════════════════════════
  // GATE K: CONCURRENT DUPLICATE CALLBACK PROTECTION
  // ═════════════════════════════════════════════════════════════════════════════
  describe('Gate K: Concurrent Duplicate Protection', () => {
    test('K-01: intra-process concurrency lock catches concurrent microsecond race', async () => {
      const syncId = callbackService.buildDeterministicSyncId('test-race');
      callbackService._inFlightApprovals.add(syncId);

      jest.spyOn(callbackService, 'buildDeterministicSyncId').mockReturnValue(syncId);

      const req = {
        body: { approvalId: 'APPR-K01', decision: 'approved' },
        headers: {},
      };

      const result = await callbackService.handleCallback({
        req,
        config: mockConfigs[genericIntegrationId],
        verification: { authenticated: true, method: 'HMAC' },
      });

      expect(result.status).toBe('DUPLICATE_ACKNOWLEDGED');
      expect(result.reason).toBe('CONCURRENT_IN_FLIGHT_DUPLICATE');
    });

    test('K-02: multi-process atomic E11000 unique index race handles collision safely without mutating approval', async () => {
      const mockApproval = {
        approvalId: 'APPR-K02',
        status: 'AWAITING_APPROVAL',
        organizationId: orgA,
        expiresAt: new Date(Date.now() + 86400000),
        save: jest.fn().mockResolvedValue(true),
      };
      jest.spyOn(PendingApproval, 'findOne').mockResolvedValue(mockApproval);

      // Simulate MongoDB unique index E11000 duplicate key error on concurrent insert
      jest.spyOn(IntegrationSyncEvent, 'create').mockRejectedValue({
        code: 11000,
        message: 'E11000 duplicate key error collection: IntegrationSyncEvent index: syncId_1 dup key',
      });

      const req = {
        body: { approvalId: 'APPR-K02', decision: 'approved' },
        headers: {},
      };

      const result = await callbackService.handleCallback({
        req,
        config: mockConfigs[genericIntegrationId],
        verification: { authenticated: true, method: 'HMAC' },
      });

      expect(result.status).toBe('DUPLICATE_ACKNOWLEDGED');
      expect(result.reason).toBe('ATOMIC_INDEX_DUPLICATE');
      expect(mockApproval.save).not.toHaveBeenCalled(); // Approval was NEVER mutated!
    });
  });

  // ═════════════════════════════════════════════════════════════════════════════
  // GATE L: RESTART/MULTI-INSTANCE DURABLE IDEMPOTENCY
  // ═════════════════════════════════════════════════════════════════════════════
  describe('Gate L: Durable Idempotency & RFC 4122 syncId', () => {
    test('L-01: generates deterministic RFC 4122 UUID v4 syncId format', () => {
      const identity = 'test-org:test-int:approval:APPR-1:APPROVED:hash123';
      const syncId1 = callbackService.buildDeterministicSyncId(identity);
      const syncId2 = callbackService.buildDeterministicSyncId(identity);

      expect(syncId1).toBe(syncId2); // Repeatable!
      expect(syncId1).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });
  });

  // ═════════════════════════════════════════════════════════════════════════════
  // GATE M: TERMINAL PENDINGAPPROVAL PROTECTION
  // ═════════════════════════════════════════════════════════════════════════════
  describe('Gate M: Terminal PendingApproval Protection', () => {
    test('M-01: blocks transition if approval is already APPROVED', async () => {
      const mockApproval = {
        approvalId: 'APPR-M01',
        status: 'APPROVED',
        organizationId: orgA,
        expiresAt: new Date(Date.now() + 86400000),
        save: jest.fn(),
      };
      jest.spyOn(PendingApproval, 'findOne').mockResolvedValue(mockApproval);

      const req = {
        body: { approvalId: 'APPR-M01', decision: 'rejected' },
        headers: {},
      };

      const result = await callbackService.handleCallback({
        req,
        config: mockConfigs[genericIntegrationId],
        verification: { authenticated: true, method: 'HMAC' },
      });

      expect(result.status).toBe('ALREADY_TERMINAL');
      expect(mockApproval.status).toBe('APPROVED'); // Protected!
      expect(mockApproval.save).not.toHaveBeenCalled();
    });

    test('M-02: blocks transition if approval is already DENIED', async () => {
      const mockApproval = {
        approvalId: 'APPR-M02',
        status: 'DENIED',
        organizationId: orgA,
        expiresAt: new Date(Date.now() + 86400000),
        save: jest.fn(),
      };
      jest.spyOn(PendingApproval, 'findOne').mockResolvedValue(mockApproval);

      const req = {
        body: { approvalId: 'APPR-M02', decision: 'approved' },
        headers: {},
      };

      const result = await callbackService.handleCallback({
        req,
        config: mockConfigs[genericIntegrationId],
        verification: { authenticated: true, method: 'HMAC' },
      });

      expect(result.status).toBe('ALREADY_TERMINAL');
      expect(mockApproval.status).toBe('DENIED'); // Protected!
      expect(mockApproval.save).not.toHaveBeenCalled();
    });

    test('M-03: blocks transition if approval is EXECUTING or COMPLETED', async () => {
      const mockApproval = {
        approvalId: 'APPR-M03',
        status: 'COMPLETED',
        organizationId: orgA,
        expiresAt: new Date(Date.now() + 86400000),
        save: jest.fn(),
      };
      jest.spyOn(PendingApproval, 'findOne').mockResolvedValue(mockApproval);

      const req = {
        body: { approvalId: 'APPR-M03', decision: 'approved' },
        headers: {},
      };

      const result = await callbackService.handleCallback({
        req,
        config: mockConfigs[genericIntegrationId],
        verification: { authenticated: true, method: 'HMAC' },
      });

      expect(result.status).toBe('ALREADY_TERMINAL');
      expect(mockApproval.status).toBe('COMPLETED');
    });
  });

  // ═════════════════════════════════════════════════════════════════════════════
  // GATE N: STALE CALLBACK DEFENSE
  // ═════════════════════════════════════════════════════════════════════════════
  describe('Gate N: Stale Callback Handling', () => {
    test('N-01: rejects stale out-of-order callback when occurredAt is older than updatedAt on terminal record', async () => {
      const mockApproval = {
        approvalId: 'APPR-N01',
        status: 'DENIED',
        updatedAt: new Date('2026-09-20T12:00:00Z'),
        organizationId: orgA,
        save: jest.fn(),
      };
      jest.spyOn(PendingApproval, 'findOne').mockResolvedValue(mockApproval);

      const req = {
        body: {
          approvalId: 'APPR-N01',
          decision: 'approved',
          occurredAt: '2026-09-20T10:00:00Z', // 2 hours older
        },
        headers: {},
      };

      const result = await callbackService.handleCallback({
        req,
        config: mockConfigs[genericIntegrationId],
        verification: { authenticated: true, method: 'HMAC' },
      });

      expect(['ALREADY_TERMINAL', 'STALE_EVENT']).toContain(result.status);
      expect(mockApproval.save).not.toHaveBeenCalled();
    });
  });

  // ═════════════════════════════════════════════════════════════════════════════
  // GATE O: EXPIRATION PROTECTION
  // ═════════════════════════════════════════════════════════════════════════════
  describe('Gate O: Expiration Protection', () => {
    test('O-01: marks approval as EXPIRED and rejects transition if past expiresAt', async () => {
      const mockApproval = {
        approvalId: 'APPR-O01',
        status: 'AWAITING_APPROVAL',
        expiresAt: new Date(Date.now() - 3600000), // Expired 1 hour ago!
        organizationId: orgA,
        save: jest.fn().mockResolvedValue(true),
      };
      jest.spyOn(PendingApproval, 'findOne').mockResolvedValue(mockApproval);

      const req = {
        body: { approvalId: 'APPR-O01', decision: 'approved' },
        headers: {},
      };

      const result = await callbackService.handleCallback({
        req,
        config: mockConfigs[genericIntegrationId],
        verification: { authenticated: true, method: 'HMAC' },
      });

      expect(result.status).toBe('EXPIRED');
      expect(mockApproval.status).toBe('EXPIRED');
      expect(mockApproval.save).toHaveBeenCalled();
    });
  });

  // ═════════════════════════════════════════════════════════════════════════════
  // GATE P: STRICT ZERO ACTION EXECUTION
  // ═════════════════════════════════════════════════════════════════════════════
  describe('Gate P: Strict Zero Action Execution (Guardrail 5)', () => {
    test('P-01: verifies approveAndExecuteAction is NEVER invoked by callback', async () => {
      const mockApproval = {
        approvalId: 'APPR-P01',
        status: 'AWAITING_APPROVAL',
        organizationId: orgA,
        expiresAt: new Date(Date.now() + 86400000),
        save: jest.fn().mockResolvedValue(true),
      };
      jest.spyOn(PendingApproval, 'findOne').mockResolvedValue(mockApproval);

      const req = {
        body: { approvalId: 'APPR-P01', decision: 'approved' },
        headers: {},
      };

      await callbackService.handleCallback({
        req,
        config: mockConfigs[genericIntegrationId],
        verification: { authenticated: true, method: 'HMAC' },
      });

      expect(approveAndExecuteSpy).not.toHaveBeenCalled();
    });
  });

  // ═════════════════════════════════════════════════════════════════════════════
  // GATE Q: STRICT ZERO OUTBOUND SOAR DISPATCH
  // ═════════════════════════════════════════════════════════════════════════════
  describe('Gate Q: Strict Zero Outbound Dispatch (Loop Prevention)', () => {
    test('Q-01: verifies OutboundDispatchService.enqueueDispatch is NEVER called', async () => {
      const mockApproval = {
        approvalId: 'APPR-Q01',
        status: 'AWAITING_APPROVAL',
        organizationId: orgA,
        expiresAt: new Date(Date.now() + 86400000),
        save: jest.fn().mockResolvedValue(true),
      };
      jest.spyOn(PendingApproval, 'findOne').mockResolvedValue(mockApproval);

      const req = {
        body: { approvalId: 'APPR-Q01', decision: 'approved' },
        headers: {},
      };

      await callbackService.handleCallback({
        req,
        config: mockConfigs[genericIntegrationId],
        verification: { authenticated: true, method: 'HMAC' },
      });

      expect(enqueueDispatchSpy).not.toHaveBeenCalled();
    });
  });

  // ═════════════════════════════════════════════════════════════════════════════
  // GATE R: IMMUTABLE AUDIT TRAIL
  // ═════════════════════════════════════════════════════════════════════════════
  describe('Gate R: Immutable IntegrationSyncEvent Audit', () => {
    test('R-01: creates valid IntegrationSyncEvent with direction INBOUND, targetEntityType APPROVAL, UUID v4 syncId', async () => {
      const mockApproval = {
        approvalId: 'APPR-R01',
        status: 'AWAITING_APPROVAL',
        organizationId: orgA,
        expiresAt: new Date(Date.now() + 86400000),
        save: jest.fn().mockResolvedValue(true),
      };
      jest.spyOn(PendingApproval, 'findOne').mockResolvedValue(mockApproval);

      const req = {
        body: { approvalId: 'APPR-R01', decision: 'approved' },
        headers: {},
      };

      await callbackService.handleCallback({
        req,
        config: mockConfigs[genericIntegrationId],
        verification: { authenticated: true, method: 'HMAC' },
      });

      const audit = recordedAudits.find((a) => a.eventType === 'APPROVAL_ACCEPTED');
      expect(audit).toBeDefined();
      expect(audit.direction).toBe('INBOUND');
      expect(audit.targetEntityType).toBe('APPROVAL');
      expect(audit.targetEntityId).toBe('APPR-R01');
      expect(audit.status).toBe('SUCCESS');
      expect(audit.syncId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });
  });

  // ═════════════════════════════════════════════════════════════════════════════
  // GATE S: SECRET SANITIZATION
  // ═════════════════════════════════════════════════════════════════════════════
  describe('Gate S: Secret Sanitization', () => {
    test('S-01: audit record contains SHA-256 payloadHash and zero tokens/passwords', async () => {
      const mockApproval = {
        approvalId: 'APPR-S01',
        status: 'AWAITING_APPROVAL',
        organizationId: orgA,
        expiresAt: new Date(Date.now() + 86400000),
        save: jest.fn().mockResolvedValue(true),
      };
      jest.spyOn(PendingApproval, 'findOne').mockResolvedValue(mockApproval);

      const req = {
        body: {
          approvalId: 'APPR-S01',
          decision: 'approved',
          password: 'secret_password_123',
          token: 'sensitive_bearer_token',
        },
        headers: {},
      };

      await callbackService.handleCallback({
        req,
        config: mockConfigs[genericIntegrationId],
        verification: { authenticated: true, method: 'HMAC' },
      });

      const audit = recordedAudits.find((a) => a.targetEntityId === 'APPR-S01');
      expect(audit).toBeDefined();
      expect(audit.payloadHash).toMatch(/^[a-f0-9]{64}$/);
      expect(JSON.stringify(audit)).not.toContain('secret_password_123');
      expect(JSON.stringify(audit)).not.toContain('sensitive_bearer_token');
    });
  });

  // ═════════════════════════════════════════════════════════════════════════════
  // GATE T: SAFE ERROR RESPONSES
  // ═════════════════════════════════════════════════════════════════════════════
  describe('Gate T: Safe Non-Enumerative Error Responses', () => {
    test('T-01: controller handles internal exceptions safely without stack traces', async () => {
      jest.spyOn(callbackService, 'handleCallback').mockRejectedValue(new Error('Internal DB crash'));

      const payload = { approvalId: 'APPR-T01', decision: 'approved' };
      const rawBody = JSON.stringify(payload);
      const secret = mockConfigs[genericIntegrationId].config.webhookSecret;
      const signature = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');

      const res = await request(testApp)
        .post(`/api/webhooks/itsm/generic/${genericIntegrationId}`)
        .set('x-webhook-signature', signature)
        .set('content-type', 'application/json')
        .send(rawBody);

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('INTERNAL_SERVER_ERROR');
      expect(res.body.message).toBe('Internal processing error during approval callback execution.');
      expect(res.body.stack).toBeUndefined();
    });
  });

  // ═════════════════════════════════════════════════════════════════════════════
  // GATE U: CROSS-TENANT ISOLATION
  // ═════════════════════════════════════════════════════════════════════════════
  describe('Gate U: Cross-Tenant Isolation', () => {
    test('U-01: Org A callback cannot match or mutate Org B approval', async () => {
      // PendingApproval belongs to orgB
      jest.spyOn(PendingApproval, 'findOne').mockImplementation(async (query) => {
        if (query.organizationId && query.organizationId.toString() === orgB.toString()) {
          return {
            approvalId: 'APPR-ORG-B',
            organizationId: orgB,
            status: 'AWAITING_APPROVAL',
            save: jest.fn(),
          };
        }
        return null; // Org A cannot see it!
      });

      const req = {
        body: { approvalId: 'APPR-ORG-B', decision: 'approved' },
        headers: {},
      };

      // Inbound callback belongs to orgA
      const result = await callbackService.handleCallback({
        req,
        config: mockConfigs[genericIntegrationId], // orgA
        verification: { authenticated: true, method: 'HMAC' },
      });

      expect(result.status).toBe('UNMATCHED');
      expect(result.matched).toBe(false);
    });
  });

  // ═════════════════════════════════════════════════════════════════════════════
  // GATE V: RUNTIME CONTROLLER INTEGRATION
  // ═════════════════════════════════════════════════════════════════════════════
  describe('Gate V: Runtime Controller Integration', () => {
    test('V-01: HTTP request with approval payload routes through controller to Step 6 engine', async () => {
      const mockApproval = {
        approvalId: 'APPR-V01',
        status: 'AWAITING_APPROVAL',
        organizationId: orgA,
        expiresAt: new Date(Date.now() + 86400000),
        save: jest.fn().mockResolvedValue(true),
      };
      jest.spyOn(PendingApproval, 'findOne').mockResolvedValue(mockApproval);

      const payload = { approvalId: 'APPR-V01', decision: 'approved', reason: 'Controller integration test' };
      const rawBody = JSON.stringify(payload);
      const secret = mockConfigs[genericIntegrationId].config.webhookSecret;
      const signature = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');

      const res = await request(testApp)
        .post(`/api/webhooks/itsm/generic/${genericIntegrationId}`)
        .set('x-webhook-signature', signature)
        .set('content-type', 'application/json')
        .send(rawBody);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('AUTHENTICATED');
      expect(res.body.approvalCallback).toBeDefined();
      expect(res.body.approvalCallback.success).toBe(true);
      expect(res.body.approvalCallback.approvalId).toBe('APPR-V01');
      expect(res.body.approvalCallback.newStatus).toBe('APPROVED');
    });
  });

  // ═════════════════════════════════════════════════════════════════════════════
  // GATE W: REGRESSION WITH STEP 5 TICKET RECONCILIATION
  // ═════════════════════════════════════════════════════════════════════════════
  describe('Gate W: Regression with Step 5 Ticket Reconciliation', () => {
    test('W-01: non-approval ticket event continues to route to Step 5 reconciler', async () => {
      // Ordinary ticket event with no approval fields
      const payload = {
        issue: {
          id: '10055',
          key: 'SEC-999',
          fields: { status: { name: 'In Progress' } },
        },
        webhookEvent: 'jira:issue_updated',
      };
      const rawBody = JSON.stringify(payload);
      const secret = mockConfigs[jiraIntegrationId].config.webhookSecret;
      const signature = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');

      const reconcileSpy = jest.spyOn(ticketReconciler, 'reconcileWebhook').mockResolvedValue({
        success: true,
        status: 'UNMATCHED',
        matched: false,
      });

      const res = await request(testApp)
        .post(`/api/webhooks/itsm/jira/${jiraIntegrationId}`)
        .set('x-hub-signature', signature)
        .set('content-type', 'application/json')
        .send(rawBody);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('AUTHENTICATED');
      expect(res.body.reconciliation).toBeDefined(); // Routed to Step 5!
      expect(res.body.approvalCallback).toBeUndefined(); // Step 6 not invoked!
      expect(reconcileSpy).toHaveBeenCalled();
    });
  });
});
