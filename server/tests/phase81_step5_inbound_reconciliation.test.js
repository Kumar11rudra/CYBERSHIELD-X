'use strict';

/**
 * 🛡️ CyberShield X — Phase 81 Step 5 Inbound Ticket Reconciliation Test Battery
 *
 * Acceptance gates:
 * GATE A — NORMALIZATION (Jira, ServiceNow, PagerDuty, Generic, Malformed)
 * GATE B — TENANT ISOLATION (Authoritative orgId, payload orgId ignored, cross-tenant isolation)
 * GATE C — TICKET MATCHING (ticketId, ticketKey, integration-scoped, unmatched, collision defense)
 * GATE D — STATUS SAFETY (Canonical mapping, unsupported status, terminal states, reopening)
 * GATE E — IDEMPOTENCY (Same event twice, duplicate payload, retry deduplication)
 * GATE F — STALE EVENTS (Out-of-order stale event regression defense)
 * GATE G — LOOP PREVENTION (Zero outbound dispatch triggered by inbound updates)
 * GATE H — AUDIT TRAIL (IntegrationSyncEvent schema compliance, UUID v4, INBOUND, payloadHash)
 * GATE I — FAILURE SAFETY (Malformed, unmatched, db error graceful recovery)
 * GATE J — RESOURCE & SCOPE (Single target mutation, no broad scans, Step 6/7/8 untouched)
 */

const request = require('supertest');
const express = require('express');
const crypto = require('crypto');
const mongoose = require('mongoose');

// Services & Models
const normalizer = require('../services/soc/InboundTicketNormalizer');
const reconciler = require('../services/soc/InboundTicketReconciliationService');
const itsmSignatureVerifier = require('../services/soc/ItsmSignatureVerifier');
const Case = require('../models/Case');
const IntegrationConfig = require('../models/IntegrationConfig');
const IntegrationSyncEvent = require('../models/IntegrationSyncEvent');
const outboundDispatchService = require('../services/soc/OutboundDispatchService');
const inboundWebhookRouter = require('../routes/inboundWebhook');

// Build isolated Express test application with rawBody capture
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

describe('Phase 81 Step 5 — Inbound Ticket Reconciliation Battery', () => {
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

  beforeEach(() => {
    recordedAudits = [];
    reconciler._recentEvents.clear();
    itsmSignatureVerifier.replayCache.clear();

    jest.spyOn(IntegrationConfig, 'findById').mockImplementation(async (id) => {
      return mockConfigs[String(id)] || null;
    });

    jest.spyOn(IntegrationSyncEvent, 'create').mockImplementation(async (data) => {
      recordedAudits.push(data);
      return data;
    });

    enqueueDispatchSpy = jest.spyOn(outboundDispatchService, 'enqueueDispatch');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ═════════════════════════════════════════════════════════════════════════════
  // GATE A: NORMALIZATION
  // ═════════════════════════════════════════════════════════════════════════════
  describe('Gate A: Inbound Ticket Normalization', () => {
    test('A-01: normalizes Jira webhook payload with issue key and status', () => {
      const rawBody = JSON.stringify({
        timestamp: 1690000000000,
        webhookEvent: 'jira:issue_updated',
        issue: {
          id: '10042',
          key: 'SEC-205',
          fields: {
            status: { name: 'In Progress' },
            updated: '2026-09-18T10:00:00.000Z',
          },
        },
      });

      const req = {
        body: JSON.parse(rawBody),
        rawBody: Buffer.from(rawBody, 'utf8'),
        headers: { 'x-atlassian-webhook-identifier': 'evt-jira-001' },
      };

      const normalized = normalizer.normalize(req, 'JIRA', mockConfigs[jiraIntegrationId]);
      expect(normalized.valid).toBe(true);
      expect(normalized.provider).toBe('JIRA');
      expect(normalized.externalTicketId).toBe('10042');
      expect(normalized.externalTicketKey).toBe('SEC-205');
      expect(normalized.externalStatus).toBe('In Progress');
      expect(normalized.eventType).toBe('jira:issue_updated');
      expect(normalized.eventId).toBe('evt-jira-001');
      expect(normalized.payloadHash).toMatch(/^[a-f0-9]{64}$/);
    });

    test('A-02: normalizes ServiceNow webhook payload with numeric incident state', () => {
      const rawBody = JSON.stringify({
        sys_id: 'sys_sn_9988',
        number: 'INC009988',
        state: 6, // Resolved
        event: 'incident.updated',
        sys_updated_on: '2026-09-18 10:15:00',
      });

      const req = {
        body: JSON.parse(rawBody),
        rawBody: Buffer.from(rawBody, 'utf8'),
        headers: { 'x-request-id': 'req-sn-100' },
      };

      const normalized = normalizer.normalize(req, 'SERVICENOW', mockConfigs[snIntegrationId]);
      expect(normalized.valid).toBe(true);
      expect(normalized.provider).toBe('SERVICENOW');
      expect(normalized.externalTicketId).toBe('sys_sn_9988');
      expect(normalized.externalTicketKey).toBe('INC009988');
      expect(normalized.externalStatus).toBe('Resolved'); // 6 mapped to Resolved
      expect(normalized.eventType).toBe('incident.updated');
    });

    test('A-03: normalizes PagerDuty v3 webhook payload', () => {
      const rawBody = JSON.stringify({
        event: {
          id: 'pd-evt-77',
          event_type: 'pagey.incident.acknowledged',
          occurred_at: '2026-09-18T10:20:00Z',
          data: {
            id: 'PD_INC_554',
            number: 554,
            status: 'acknowledged',
          },
        },
      });

      const req = {
        body: JSON.parse(rawBody),
        rawBody: Buffer.from(rawBody, 'utf8'),
        headers: { 'x-pagerduty-webhook-id': 'pd-webhook-header-id' },
      };

      const normalized = normalizer.normalize(req, 'PAGERDUTY', mockConfigs[pdIntegrationId]);
      expect(normalized.valid).toBe(true);
      expect(normalized.provider).toBe('PAGERDUTY');
      expect(normalized.externalTicketId).toBe('PD_INC_554');
      expect(normalized.externalTicketKey).toBe('554');
      expect(normalized.externalStatus).toBe('acknowledged');
    });

    test('A-04: normalizes Generic webhook payload', () => {
      const rawBody = JSON.stringify({
        ticketId: 'GEN-88',
        ticketKey: 'TICKET-88',
        status: 'RESOLVED',
        eventType: 'soar:status_change',
        timestamp: '2026-09-18T10:30:00Z',
      });

      const req = {
        body: JSON.parse(rawBody),
        rawBody: Buffer.from(rawBody, 'utf8'),
      };

      const normalized = normalizer.normalize(req, 'GENERIC', mockConfigs[genericIntegrationId]);
      expect(normalized.valid).toBe(true);
      expect(normalized.provider).toBe('GENERIC');
      expect(normalized.externalTicketId).toBe('GEN-88');
      expect(normalized.externalTicketKey).toBe('TICKET-88');
      expect(normalized.externalStatus).toBe('RESOLVED');
    });

    test('A-05: fails closed on malformed payload missing external ticket identity', () => {
      const req = {
        body: { unhandledKey: 'hello', count: 123 },
        rawBody: Buffer.from('{"unhandledKey":"hello","count":123}', 'utf8'),
      };

      const normalized = normalizer.normalize(req, 'JIRA', mockConfigs[jiraIntegrationId]);
      expect(normalized.valid).toBe(false);
      expect(normalized.error).toBe('MISSING_TICKET_IDENTITY');
    });

    test('A-06: strips credentials and secrets from normalized structure', () => {
      const req = {
        body: {
          issue: { id: '10001', key: 'SEC-1' },
          secret: 'super-secret',
          token: 'auth-token-xyz',
          password: 'pass',
        },
        rawBody: Buffer.from('{}', 'utf8'),
      };

      const normalized = normalizer.normalize(req, 'JIRA', mockConfigs[jiraIntegrationId]);
      expect(normalized.valid).toBe(true);
      expect(normalized.secret).toBeUndefined();
      expect(normalized.token).toBeUndefined();
      expect(normalized.password).toBeUndefined();
      expect(normalized.rawBody).toBeUndefined();
    });
  });

  // ═════════════════════════════════════════════════════════════════════════════
  // GATE B: TENANT ISOLATION
  // ═════════════════════════════════════════════════════════════════════════════
  describe('Gate B: Tenant Isolation', () => {
    test('B-01: authoritative orgId is strictly sourced from IntegrationConfig, ignoring payload claims', async () => {
      const maliciousPayloadOrgId = new mongoose.Types.ObjectId().toString();
      const payload = {
        organizationId: maliciousPayloadOrgId,
        issue: { id: '10042', key: 'SEC-205', fields: { status: { name: 'Done' } } },
      };
      const rawString = JSON.stringify(payload);

      const req = {
        body: payload,
        rawBody: Buffer.from(rawString, 'utf8'),
        params: { integrationId: jiraIntegrationId },
        headers: {},
      };

      // Mock finding a Case with tenantOrgId
      let queriedFilter = null;
      jest.spyOn(Case, 'findOne').mockImplementation(async (filter) => {
        queriedFilter = filter;
        return null;
      });

      await reconciler.reconcileWebhook({
        req,
        config: mockConfigs[jiraIntegrationId],
        verification: { authenticated: true },
      });

      expect(queriedFilter).not.toBeNull();
      expect(queriedFilter.organizationId).toEqual(orgA);
      expect(queriedFilter.organizationId.toString()).not.toBe(maliciousPayloadOrgId);
    });

    test('B-02: returns INTEGRATION_DISABLED when IntegrationConfig is inactive', async () => {
      const inactiveConfig = {
        ...mockConfigs[jiraIntegrationId],
        active: false,
      };

      const res = await reconciler.reconcileWebhook({
        req: { body: {} },
        config: inactiveConfig,
      });

      expect(res.success).toBe(false);
      expect(res.status).toBe('INTEGRATION_DISABLED');
      expect(enqueueDispatchSpy).not.toHaveBeenCalled();
    });

    test('B-03: returns AUTHENTICATION_FAILED if verification fails', async () => {
      const res = await reconciler.reconcileWebhook({
        req: { body: {} },
        config: mockConfigs[jiraIntegrationId],
        verification: { authenticated: false, reason: 'INVALID_SIGNATURE' },
      });

      expect(res.success).toBe(false);
      expect(res.status).toBe('AUTHENTICATION_FAILED');
    });
  });

  // ═════════════════════════════════════════════════════════════════════════════
  // GATE C: TICKET MATCHING
  // ═════════════════════════════════════════════════════════════════════════════
  describe('Gate C: External Ticket Matching', () => {
    test('C-01: matches Case by integrationId + ticketKey', async () => {
      const caseDoc = {
        caseId: 'CASE-2026-001',
        organizationId: orgA,
        status: 'OPEN',
        timeline: [],
        externalTickets: [
          {
            provider: 'JIRA',
            integrationId: jiraIntegrationId,
            ticketId: '10042',
            ticketKey: 'SEC-205',
            ticketUrl: 'https://cybershield.atlassian.net/browse/SEC-205',
            externalStatus: 'To Do',
            syncStatus: 'IN_SYNC',
            syncDirection: 'BIDIRECTIONAL',
            lastSyncAt: new Date('2026-09-18T09:00:00Z'),
          },
        ],
        save: jest.fn().mockResolvedValue(true),
      };

      jest.spyOn(Case, 'findOne').mockResolvedValue(caseDoc);

      const req = {
        body: {
          issue: { id: '10042', key: 'SEC-205', fields: { status: { name: 'In Progress' } } },
        },
        rawBody: Buffer.from(JSON.stringify({ issue: { id: '10042', key: 'SEC-205' } }), 'utf8'),
      };

      const result = await reconciler.reconcileWebhook({
        req,
        config: mockConfigs[jiraIntegrationId],
        verification: { authenticated: true },
      });

      expect(result.success).toBe(true);
      expect(result.status).toBe('RECONCILED');
      expect(result.previousStatus).toBe('OPEN');
      expect(result.newStatus).toBe('IN_PROGRESS');
      expect(caseDoc.save).toHaveBeenCalled();
    });

    test('C-02: returns UNMATCHED and zero mutations when no Case matches', async () => {
      jest.spyOn(Case, 'findOne').mockResolvedValue(null);

      const req = {
        body: {
          issue: { id: '99999', key: 'SEC-999', fields: { status: { name: 'Done' } } },
        },
        rawBody: Buffer.from('{}', 'utf8'),
      };

      const result = await reconciler.reconcileWebhook({
        req,
        config: mockConfigs[jiraIntegrationId],
        verification: { authenticated: true },
      });

      expect(result.success).toBe(true);
      expect(result.status).toBe('UNMATCHED');
      expect(result.matched).toBe(false);

      // Verify audit logged as REJECTED with TICKET_UNMATCHED
      expect(recordedAudits).toHaveLength(1);
      expect(recordedAudits[0].eventType).toBe('TICKET_UNMATCHED');
      expect(recordedAudits[0].status).toBe('REJECTED');
    });

    test('C-03: cross-tenant collision safety: ignores matching ticketKey belonging to another tenant', async () => {
      // Find returns null because org filter does not match
      jest.spyOn(Case, 'findOne').mockImplementation(async (filter) => {
        if (filter.organizationId.toString() === orgB.toString()) {
          return { caseId: 'CASE-TENANT-B' };
        }
        return null;
      });

      const req = {
        body: {
          issue: { id: '10042', key: 'SEC-205', fields: { status: { name: 'Done' } } },
        },
        rawBody: Buffer.from('{}', 'utf8'),
      };

      const result = await reconciler.reconcileWebhook({
        req,
        config: mockConfigs[jiraIntegrationId], // Config belongs to orgA
        verification: { authenticated: true },
      });

      expect(result.status).toBe('UNMATCHED');
    });
  });

  // ═════════════════════════════════════════════════════════════════════════════
  // GATE D: STATUS SAFETY & TRANSITION MATRIX
  // ═════════════════════════════════════════════════════════════════════════════
  describe('Gate D: Status Safety & Lifecycle Rules', () => {
    test('D-01: correctly maps Jira, ServiceNow, PagerDuty, Generic statuses', () => {
      expect(reconciler.mapExternalStatus('JIRA', 'Done')).toBe('RESOLVED');
      expect(reconciler.mapExternalStatus('JIRA', 'In Development')).toBe('IN_PROGRESS');
      expect(reconciler.mapExternalStatus('JIRA', 'Closed')).toBe('CLOSED');

      expect(reconciler.mapExternalStatus('SERVICENOW', '6')).toBe('RESOLVED');
      expect(reconciler.mapExternalStatus('SERVICENOW', '2')).toBe('IN_PROGRESS');
      expect(reconciler.mapExternalStatus('SERVICENOW', '7')).toBe('CLOSED');

      expect(reconciler.mapExternalStatus('PAGERDUTY', 'acknowledged')).toBe('IN_PROGRESS');
      expect(reconciler.mapExternalStatus('PAGERDUTY', 'resolved')).toBe('RESOLVED');

      expect(reconciler.mapExternalStatus('GENERIC', 'CONTAINED')).toBe('CONTAINED');
    });

    test('D-02: preserves Case.status when receiving unsupported external status', async () => {
      const caseDoc = {
        caseId: 'CASE-002',
        status: 'IN_PROGRESS',
        organizationId: orgA,
        timeline: [],
        externalTickets: [
          {
            provider: 'JIRA',
            integrationId: jiraIntegrationId,
            ticketId: '10042',
            ticketKey: 'SEC-205',
            externalStatus: 'In Progress',
            syncStatus: 'IN_SYNC',
          },
        ],
        save: jest.fn().mockResolvedValue(true),
      };

      jest.spyOn(Case, 'findOne').mockResolvedValue(caseDoc);

      const req = {
        body: {
          issue: { id: '10042', key: 'SEC-205', fields: { status: { name: 'AlienStatusFromMars' } } },
        },
        rawBody: Buffer.from('{}', 'utf8'),
      };

      const result = await reconciler.reconcileWebhook({
        req,
        config: mockConfigs[jiraIntegrationId],
        verification: { authenticated: true },
      });

      expect(result.status).toBe('UNSUPPORTED_STATUS');
      expect(result.previousStatus).toBe('IN_PROGRESS');
      expect(caseDoc.status).toBe('IN_PROGRESS'); // Unmutated
      expect(caseDoc.externalTickets[0].lastError).toBe('UNSUPPORTED_STATUS');
    });

    test('D-03: blocks automated regression of terminal states (CLOSED, ARCHIVED)', async () => {
      const caseDoc = {
        caseId: 'CASE-003',
        status: 'CLOSED',
        organizationId: orgA,
        timeline: [],
        externalTickets: [
          {
            provider: 'JIRA',
            integrationId: jiraIntegrationId,
            ticketId: '10042',
            ticketKey: 'SEC-205',
            externalStatus: 'Closed',
            syncStatus: 'IN_SYNC',
          },
        ],
        save: jest.fn().mockResolvedValue(true),
      };

      jest.spyOn(Case, 'findOne').mockResolvedValue(caseDoc);

      const req = {
        body: {
          issue: { id: '10042', key: 'SEC-205', fields: { status: { name: 'In Progress' } } },
        },
        rawBody: Buffer.from('{}', 'utf8'),
      };

      const result = await reconciler.reconcileWebhook({
        req,
        config: mockConfigs[jiraIntegrationId],
        verification: { authenticated: true },
      });

      expect(result.status).toBe('BLOCKED');
      expect(result.reason).toContain('TERMINAL_STATE_LOCKED');
      expect(caseDoc.status).toBe('CLOSED');
      expect(caseDoc.externalTickets[0].syncStatus).toBe('MANUAL_OVERRIDE');
    });

    test('D-04: supports valid reopening transition from RESOLVED to IN_PROGRESS', async () => {
      const caseDoc = {
        caseId: 'CASE-004',
        status: 'RESOLVED',
        organizationId: orgA,
        timeline: [],
        reopenHistory: [],
        externalTickets: [
          {
            provider: 'JIRA',
            integrationId: jiraIntegrationId,
            ticketId: '10042',
            ticketKey: 'SEC-205',
            externalStatus: 'Resolved',
            syncStatus: 'IN_SYNC',
            lastSyncAt: new Date('2026-09-18T09:00:00Z'),
          },
        ],
        save: jest.fn().mockResolvedValue(true),
      };

      jest.spyOn(Case, 'findOne').mockResolvedValue(caseDoc);

      const req = {
        body: {
          issue: {
            id: '10042',
            key: 'SEC-205',
            fields: { status: { name: 'In Progress' }, updated: '2026-09-18T10:00:00Z' },
          },
        },
        rawBody: Buffer.from('{}', 'utf8'),
      };

      const result = await reconciler.reconcileWebhook({
        req,
        config: mockConfigs[jiraIntegrationId],
        verification: { authenticated: true },
      });

      expect(result.status).toBe('RECONCILED');
      expect(result.newStatus).toBe('IN_PROGRESS');
      expect(caseDoc.status).toBe('IN_PROGRESS');
      expect(caseDoc.timeline).toHaveLength(1);
      expect(caseDoc.timeline[0].action).toBe('CASE_REOPENED');
      expect(caseDoc.reopenHistory).toHaveLength(1);
    });
  });

  // ═════════════════════════════════════════════════════════════════════════════
  // GATE E: IDEMPOTENCY
  // ═════════════════════════════════════════════════════════════════════════════
  describe('Gate E: Duplicate & Idempotency Protection', () => {
    test('E-01: handles duplicate webhook event safely without re-mutating Case', async () => {
      const caseDoc = {
        caseId: 'CASE-005',
        status: 'OPEN',
        organizationId: orgA,
        timeline: [],
        externalTickets: [
          {
            provider: 'JIRA',
            integrationId: jiraIntegrationId,
            ticketId: '10042',
            ticketKey: 'SEC-205',
            externalStatus: 'To Do',
            syncStatus: 'IN_SYNC',
            lastSyncAt: new Date(),
          },
        ],
        save: jest.fn().mockResolvedValue(true),
      };

      jest.spyOn(Case, 'findOne').mockResolvedValue(caseDoc);

      const req = {
        body: {
          issue: { id: '10042', key: 'SEC-205', fields: { status: { name: 'In Progress' } } },
        },
        rawBody: Buffer.from(JSON.stringify({ test: 'duplicate-payload-1' }), 'utf8'),
      };

      // First run: Reconciled
      const run1 = await reconciler.reconcileWebhook({
        req,
        config: mockConfigs[jiraIntegrationId],
        verification: { authenticated: true },
      });
      expect(run1.status).toBe('RECONCILED');
      expect(caseDoc.save).toHaveBeenCalledTimes(1);

      // Second run with same payload: Duplicate acknowledged
      const run2 = await reconciler.reconcileWebhook({
        req,
        config: mockConfigs[jiraIntegrationId],
        verification: { authenticated: true },
      });
      expect(run2.status).toBe('DUPLICATE_ACKNOWLEDGED');
      expect(caseDoc.save).toHaveBeenCalledTimes(1); // Zero additional saves
    });

    test('E-02: respects Step 4 replay detection flag', async () => {
      const res = await reconciler.reconcileWebhook({
        req: { body: {} },
        config: mockConfigs[jiraIntegrationId],
        verification: { authenticated: true, isDuplicate: true },
      });

      expect(res.success).toBe(true);
      expect(res.status).toBe('DUPLICATE_ACKNOWLEDGED');
      expect(res.reason).toBe('REPLAY_DETECTED');
    });
  });

  // ═════════════════════════════════════════════════════════════════════════════
  // GATE F: STALE EVENTS
  // ═════════════════════════════════════════════════════════════════════════════
  describe('Gate F: Stale Event Ordering Defense', () => {
    test('F-01: blocks out-of-order stale event trying to regress state', async () => {
      const lastSync = new Date('2026-09-18T10:00:00.000Z');
      const staleTimestamp = '2026-09-18T09:30:00.000Z'; // 30 minutes earlier

      const caseDoc = {
        caseId: 'CASE-006',
        status: 'IN_PROGRESS',
        organizationId: orgA,
        timeline: [],
        externalTickets: [
          {
            provider: 'JIRA',
            integrationId: jiraIntegrationId,
            ticketId: '10042',
            ticketKey: 'SEC-205',
            externalStatus: 'In Progress',
            syncStatus: 'IN_SYNC',
            lastSyncAt: lastSync,
          },
        ],
        save: jest.fn().mockResolvedValue(true),
      };

      jest.spyOn(Case, 'findOne').mockResolvedValue(caseDoc);

      const req = {
        body: {
          issue: {
            id: '10042',
            key: 'SEC-205',
            fields: { status: { name: 'To Do' }, updated: staleTimestamp },
          },
        },
        rawBody: Buffer.from(JSON.stringify({ stale: true }), 'utf8'),
      };

      const result = await reconciler.reconcileWebhook({
        req,
        config: mockConfigs[jiraIntegrationId],
        verification: { authenticated: true },
      });

      expect(result.status).toBe('BLOCKED');
      expect(result.reason).toContain('STALE_EVENT_REGRESSION_BLOCKED');
      expect(caseDoc.status).toBe('IN_PROGRESS'); // Did not regress to OPEN
    });
  });

  // ═════════════════════════════════════════════════════════════════════════════
  // GATE G: LOOP PREVENTION
  // ═════════════════════════════════════════════════════════════════════════════
  describe('Gate G: Loop Prevention', () => {
    test('G-01: inbound reconciliation never invokes OutboundDispatchService', async () => {
      const caseDoc = {
        caseId: 'CASE-007',
        status: 'OPEN',
        organizationId: orgA,
        timeline: [],
        externalTickets: [
          {
            provider: 'JIRA',
            integrationId: jiraIntegrationId,
            ticketId: '10042',
            ticketKey: 'SEC-205',
            externalStatus: 'To Do',
            syncStatus: 'IN_SYNC',
            lastSyncAt: new Date(),
          },
        ],
        save: jest.fn().mockResolvedValue(true),
      };

      jest.spyOn(Case, 'findOne').mockResolvedValue(caseDoc);

      const req = {
        body: {
          issue: { id: '10042', key: 'SEC-205', fields: { status: { name: 'In Progress' } } },
        },
        rawBody: Buffer.from('{}', 'utf8'),
      };

      await reconciler.reconcileWebhook({
        req,
        config: mockConfigs[jiraIntegrationId],
        verification: { authenticated: true },
      });

      expect(enqueueDispatchSpy).not.toHaveBeenCalled();
      expect(caseDoc.timeline[0].performedBy).toBe('INBOUND_WEBHOOK');
    });

    test('G-02: legitimate outbound dispatch remains fully accessible and unaffected', async () => {
      expect(typeof outboundDispatchService.enqueueDispatch).toBe('function');
      expect(typeof outboundDispatchService.processJob).toBe('function');
    });
  });

  // ═════════════════════════════════════════════════════════════════════════════
  // GATE H: AUDIT TRAIL
  // ═════════════════════════════════════════════════════════════════════════════
  describe('Gate H: Audit Trail Conformance', () => {
    test('H-01: produces valid IntegrationSyncEvent with UUID v4, INBOUND direction, and payloadHash', async () => {
      const caseDoc = {
        caseId: 'CASE-008',
        status: 'OPEN',
        organizationId: orgA,
        timeline: [],
        externalTickets: [
          {
            provider: 'JIRA',
            integrationId: jiraIntegrationId,
            ticketId: '10042',
            ticketKey: 'SEC-205',
            externalStatus: 'To Do',
            syncStatus: 'IN_SYNC',
            lastSyncAt: new Date(),
          },
        ],
        save: jest.fn().mockResolvedValue(true),
      };

      jest.spyOn(Case, 'findOne').mockResolvedValue(caseDoc);

      const rawPayload = JSON.stringify({
        issue: { id: '10042', key: 'SEC-205', fields: { status: { name: 'Done' } } },
      });

      const req = {
        body: JSON.parse(rawPayload),
        rawBody: Buffer.from(rawPayload, 'utf8'),
      };

      await reconciler.reconcileWebhook({
        req,
        config: mockConfigs[jiraIntegrationId],
        verification: { authenticated: true },
      });

      expect(recordedAudits).toHaveLength(1);
      const audit = recordedAudits[0];

      // Conformance checks
      expect(audit.syncId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      );
      expect(audit.organizationId).toEqual(orgA);
      expect(audit.integrationId).toBe(jiraIntegrationId);
      expect(audit.provider).toBe('JIRA');
      expect(audit.direction).toBe('INBOUND');
      expect(audit.eventType).toBe('TICKET_STATUS_RECONCILED');
      expect(audit.targetEntityType).toBe('CASE');
      expect(audit.targetEntityId).toBe('CASE-008');
      expect(audit.status).toBe('SUCCESS');
      expect(audit.payloadHash).toMatch(/^[a-f0-9]{64}$/);

      // Security check: no raw bodies or sensitive fields
      expect(audit.rawBody).toBeUndefined();
      expect(audit.credentials).toBeUndefined();
      expect(audit.secret).toBeUndefined();
    });
  });

  // ═════════════════════════════════════════════════════════════════════════════
  // GATE I: FAILURE SAFETY
  // ═════════════════════════════════════════════════════════════════════════════
  describe('Gate I: Failure Safety & Exception Containment', () => {
    test('I-01: handles database failure gracefully without unhandled rejection', async () => {
      jest.spyOn(Case, 'findOne').mockRejectedValue(new Error('MongoNetworkTimeoutException'));

      const req = {
        body: {
          issue: { id: '10042', key: 'SEC-205', fields: { status: { name: 'Done' } } },
        },
        rawBody: Buffer.from('{}', 'utf8'),
      };

      const result = await reconciler.reconcileWebhook({
        req,
        config: mockConfigs[jiraIntegrationId],
        verification: { authenticated: true },
      });

      expect(result.success).toBe(false);
      expect(result.status).toBe('INTERNAL_SERVER_ERROR');
      expect(result.error).toBe('RECONCILIATION_FAILED');
      // Must not leak internal database error message to caller
      expect(result.message).toBe('An internal error occurred during ticket reconciliation.');
      expect(result.message).not.toContain('MongoNetworkTimeoutException');
    });
  });

  // ═════════════════════════════════════════════════════════════════════════════
  // GATE J: RESOURCE & SCOPE BOUNDARY
  // ═════════════════════════════════════════════════════════════════════════════
  describe('Gate J: Resource & Scope Safety', () => {
    test('J-01: matches exactly one Case and updates only the matching binding in array', async () => {
      const caseDoc = {
        caseId: 'CASE-009',
        status: 'OPEN',
        organizationId: orgA,
        timeline: [],
        externalTickets: [
          {
            provider: 'JIRA',
            integrationId: jiraIntegrationId,
            ticketId: '10042',
            ticketKey: 'SEC-205',
            externalStatus: 'To Do',
            syncStatus: 'IN_SYNC',
          },
          {
            provider: 'PAGERDUTY',
            integrationId: pdIntegrationId,
            ticketId: 'PD-888',
            ticketKey: '888',
            externalStatus: 'triggered',
            syncStatus: 'IN_SYNC',
          },
        ],
        save: jest.fn().mockResolvedValue(true),
      };

      jest.spyOn(Case, 'findOne').mockResolvedValue(caseDoc);

      const req = {
        body: {
          issue: { id: '10042', key: 'SEC-205', fields: { status: { name: 'In Progress' } } },
        },
        rawBody: Buffer.from('{}', 'utf8'),
      };

      await reconciler.reconcileWebhook({
        req,
        config: mockConfigs[jiraIntegrationId],
        verification: { authenticated: true },
      });

      // Jira binding updated
      expect(caseDoc.externalTickets[0].externalStatus).toBe('In Progress');
      expect(caseDoc.externalTickets[0].syncStatus).toBe('IN_SYNC');

      // PagerDuty binding completely untouched
      expect(caseDoc.externalTickets[1].externalStatus).toBe('triggered');
      expect(caseDoc.externalTickets[1].ticketKey).toBe('888');
    });

    test('J-02: verifies Step 6, Step 7, and Step 8 capabilities are not present in reconciler', () => {
      // Step 6: Interactive Human Approvals
      expect(reconciler.requestApproval).toBeUndefined();
      expect(reconciler.processApprovalCallback).toBeUndefined();

      // Step 7: Bi-directional SOAR Playbooks
      expect(reconciler.triggerPlaybook).toBeUndefined();
      expect(reconciler.executeSoarAction).toBeUndefined();

      // Step 8: Frontend UI endpoints
      expect(reconciler.renderUi).toBeUndefined();
    });
  });

  // ═════════════════════════════════════════════════════════════════════════════
  // GATE K: RUNTIME CONTROLLER → RECONCILER WIRING (F-81-5-BLOCKER-01)
  // ═════════════════════════════════════════════════════════════════════════════
  describe('Gate K: Runtime Controller → Reconciler Wiring (F-81-5-BLOCKER-01)', () => {
    test('K-01: authenticated inbound webhook routes through controller into reconciliation and updates Case', async () => {
      const caseDoc = {
        caseId: 'CASE-K01',
        organizationId: orgA,
        status: 'OPEN',
        timeline: [],
        externalTickets: [
          {
            provider: 'JIRA',
            integrationId: jiraIntegrationId,
            ticketId: '10042',
            ticketKey: 'SEC-205',
            externalStatus: 'To Do',
            syncStatus: 'IN_SYNC',
            lastSyncAt: new Date('2026-09-18T09:00:00Z'),
          },
        ],
        save: jest.fn().mockResolvedValue(true),
      };

      jest.spyOn(Case, 'findOne').mockResolvedValue(caseDoc);

      const payload = {
        issue: {
          id: '10042',
          key: 'SEC-205',
          fields: { status: { name: 'In Progress' } },
        },
      };
      const rawString = JSON.stringify(payload);
      const signature = crypto.createHmac('sha256', 'jira-secret-key-1234').update(rawString).digest('hex');

      const res = await request(testApp)
        .post(`/api/webhooks/itsm/jira/${jiraIntegrationId}`)
        .set('Content-Type', 'application/json')
        .set('X-Hub-Signature', signature)
        .send(payload);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.status).toBe('AUTHENTICATED');
      expect(res.body.reconciliation).toBeDefined();
      expect(res.body.reconciliation.status).toBe('RECONCILED');
      expect(res.body.reconciliation.caseId).toBe('CASE-K01');
      expect(res.body.reconciliation.newStatus).toBe('IN_PROGRESS');
      expect(caseDoc.save).toHaveBeenCalled();
      expect(caseDoc.status).toBe('IN_PROGRESS');
    });

    test('K-02: unauthenticated webhook is rejected with 401 and never invokes Case reconciliation', async () => {
      const caseSaveSpy = jest.fn();
      jest.spyOn(Case, 'findOne').mockResolvedValue({ save: caseSaveSpy });

      const payload = {
        issue: { id: '10042', key: 'SEC-205', fields: { status: { name: 'Done' } } },
      };

      const res = await request(testApp)
        .post(`/api/webhooks/itsm/jira/${jiraIntegrationId}`)
        .set('Content-Type', 'application/json')
        .set('X-Hub-Signature', 'invalid-hmac-signature-should-fail')
        .send(payload);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('AUTHENTICATION_FAILED');
      expect(caseSaveSpy).not.toHaveBeenCalled();
    });

    test('K-03: controller returns DUPLICATE_ACKNOWLEDGED when duplicate delivery is detected', async () => {
      const caseDoc = {
        caseId: 'CASE-K03',
        organizationId: orgA,
        status: 'OPEN',
        timeline: [],
        externalTickets: [
          {
            provider: 'JIRA',
            integrationId: jiraIntegrationId,
            ticketId: '10042',
            ticketKey: 'SEC-205',
            externalStatus: 'To Do',
            syncStatus: 'IN_SYNC',
            lastSyncAt: new Date('2026-09-18T09:00:00Z'),
          },
        ],
        save: jest.fn().mockResolvedValue(true),
      };

      jest.spyOn(Case, 'findOne').mockResolvedValue(caseDoc);

      const payload = {
        issue: { id: '10042', key: 'SEC-205', fields: { status: { name: 'In Progress' } } },
      };
      const rawString = JSON.stringify(payload);
      const signature = crypto.createHmac('sha256', 'jira-secret-key-1234').update(rawString).digest('hex');

      // First run: Reconciles
      const res1 = await request(testApp)
        .post(`/api/webhooks/itsm/jira/${jiraIntegrationId}`)
        .set('Content-Type', 'application/json')
        .set('X-Hub-Signature', signature)
        .send(payload);

      expect(res1.status).toBe(200);
      expect(res1.body.reconciliation.status).toBe('RECONCILED');

      // Second run: Acknowledged duplicate
      const res2 = await request(testApp)
        .post(`/api/webhooks/itsm/jira/${jiraIntegrationId}`)
        .set('Content-Type', 'application/json')
        .set('X-Hub-Signature', signature)
        .send(payload);

      expect(res2.status).toBe(200);
      expect(res2.body.status).toBe('DUPLICATE_ACKNOWLEDGED');
      expect(caseDoc.save).toHaveBeenCalledTimes(1); // Zero additional saves
    });
  });

  // ═════════════════════════════════════════════════════════════════════════════
  // GATE L: AUTHORITATIVE IDEMPOTENCY & CONCURRENCY (F-81-5-BLOCKER-02)
  // ═════════════════════════════════════════════════════════════════════════════
  describe('Gate L: Authoritative Idempotency & Multi-Layer Concurrency (F-81-5-BLOCKER-02)', () => {
    test('L-01: deterministic duplicate identity and UUID v4 syncId generation is repeatable', () => {
      const id1 = reconciler.deriveDuplicateIdentity(jiraIntegrationId, 'JIRA', null, 'SEC-205', 'hash123456');
      const id2 = reconciler.deriveDuplicateIdentity(jiraIntegrationId, 'JIRA', null, 'SEC-205', 'hash123456');
      const idDiff = reconciler.deriveDuplicateIdentity(jiraIntegrationId, 'JIRA', null, 'SEC-206', 'hash123456');

      expect(id1).toBe(id2);
      expect(id1).not.toBe(idDiff);

      const syncId1 = reconciler.buildDeterministicSyncId(id1);
      const syncId2 = reconciler.buildDeterministicSyncId(id2);
      const syncIdDiff = reconciler.buildDeterministicSyncId(idDiff);

      expect(syncId1).toBe(syncId2);
      expect(syncId1).not.toBe(syncIdDiff);
      // Valid RFC 4122 UUID v4 regex check
      expect(syncId1).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    test('L-02: durable database idempotency survives in-memory cache clearance (restart simulation)', async () => {
      const caseDoc = {
        caseId: 'CASE-L02',
        status: 'OPEN',
        organizationId: orgA,
        timeline: [],
        externalTickets: [
          {
            provider: 'JIRA',
            integrationId: jiraIntegrationId,
            ticketId: '10042',
            ticketKey: 'SEC-205',
            externalStatus: 'To Do',
            syncStatus: 'IN_SYNC',
            lastSyncAt: new Date(),
          },
        ],
        save: jest.fn().mockResolvedValue(true),
      };

      jest.spyOn(Case, 'findOne').mockResolvedValue(caseDoc);

      const req = {
        body: {
          issue: { id: '10042', key: 'SEC-205', fields: { status: { name: 'In Progress' } } },
        },
        rawBody: Buffer.from(JSON.stringify({ test: 'durable-restart-payload' }), 'utf8'),
      };

      // First run: Reconciles and writes to database
      const run1 = await reconciler.reconcileWebhook({
        req,
        config: mockConfigs[jiraIntegrationId],
        verification: { authenticated: true },
      });
      expect(run1.status).toBe('RECONCILED');
      expect(caseDoc.save).toHaveBeenCalledTimes(1);

      // SIMULATE PROCESS RESTART: clear process-local LRU map
      reconciler._recentEvents.clear();

      // Mock database findOne returning the previously persisted sync event
      jest.spyOn(IntegrationSyncEvent, 'findOne').mockResolvedValue({
        syncId: recordedAudits[0].syncId,
        status: 'SUCCESS',
      });

      // Second run after restart: detected via durable DB query
      const run2 = await reconciler.reconcileWebhook({
        req,
        config: mockConfigs[jiraIntegrationId],
        verification: { authenticated: true },
      });

      expect(run2.status).toBe('DUPLICATE_ACKNOWLEDGED');
      expect(run2.reason).toBe('DURABLE_AUDIT_DUPLICATE');
      expect(caseDoc.save).toHaveBeenCalledTimes(1); // Zero additional mutations
    });

    test('L-03: blocks intra-process concurrent duplicate arrivals via in-flight set', async () => {
      const caseDoc = {
        caseId: 'CASE-L03',
        status: 'OPEN',
        organizationId: orgA,
        timeline: [],
        externalTickets: [
          {
            provider: 'JIRA',
            integrationId: jiraIntegrationId,
            ticketId: '10042',
            ticketKey: 'SEC-205',
            externalStatus: 'To Do',
            syncStatus: 'IN_SYNC',
            lastSyncAt: new Date(),
          },
        ],
        save: jest.fn().mockImplementation(async () => {
          // Artificial microsecond delay simulating database IO
          await new Promise((resolve) => setTimeout(resolve, 50));
          return true;
        }),
      };

      jest.spyOn(Case, 'findOne').mockResolvedValue(caseDoc);

      const req = {
        body: {
          issue: { id: '10042', key: 'SEC-205', fields: { status: { name: 'In Progress' } } },
        },
        rawBody: Buffer.from(JSON.stringify({ test: 'concurrent-payload-flight' }), 'utf8'),
      };

      // Launch two requests concurrently in the same Node process
      const [resA, resB] = await Promise.all([
        reconciler.reconcileWebhook({
          req,
          config: mockConfigs[jiraIntegrationId],
          verification: { authenticated: true },
        }),
        reconciler.reconcileWebhook({
          req,
          config: mockConfigs[jiraIntegrationId],
          verification: { authenticated: true },
        }),
      ]);

      const outcomes = [resA.status, resB.status];
      expect(outcomes).toContain('RECONCILED');
      expect(outcomes).toContain('DUPLICATE_ACKNOWLEDGED');
      expect(caseDoc.save).toHaveBeenCalledTimes(1);
    });

    test('L-04: multi-process race condition is safely blocked by atomic syncId unique key constraint (E11000)', async () => {
      const caseDoc = {
        caseId: 'CASE-L04',
        status: 'OPEN',
        organizationId: orgA,
        timeline: [],
        externalTickets: [
          {
            provider: 'JIRA',
            integrationId: jiraIntegrationId,
            ticketId: '10042',
            ticketKey: 'SEC-205',
            externalStatus: 'To Do',
            syncStatus: 'IN_SYNC',
            lastSyncAt: new Date(),
          },
        ],
        save: jest.fn().mockResolvedValue(true),
      };

      jest.spyOn(Case, 'findOne').mockResolvedValue(caseDoc);

      // Simulate second process trying to insert with identical syncId in MongoDB
      const duplicateError = new Error('E11000 duplicate key error collection: integrationsyncevents index: syncId_1 dup key');
      duplicateError.code = 11000;
      jest.spyOn(IntegrationSyncEvent, 'create').mockRejectedValue(duplicateError);

      const req = {
        body: {
          issue: { id: '10042', key: 'SEC-205', fields: { status: { name: 'In Progress' } } },
        },
        rawBody: Buffer.from(JSON.stringify({ test: 'atomic-e11000-payload' }), 'utf8'),
      };

      const res = await reconciler.reconcileWebhook({
        req,
        config: mockConfigs[jiraIntegrationId],
        verification: { authenticated: true },
      });

      expect(res.success).toBe(true);
      expect(res.status).toBe('DUPLICATE_ACKNOWLEDGED');
      expect(res.reason).toBe('ATOMIC_INDEX_DUPLICATE');
      expect(caseDoc.save).not.toHaveBeenCalled(); // Zero mutations on atomic collision
    });

    test('L-05: cleans up claimed audit record when Case save throws an exception', async () => {
      const caseDoc = {
        caseId: 'CASE-L05',
        status: 'OPEN',
        organizationId: orgA,
        timeline: [],
        externalTickets: [
          {
            provider: 'JIRA',
            integrationId: jiraIntegrationId,
            ticketId: '10042',
            ticketKey: 'SEC-205',
            externalStatus: 'To Do',
            syncStatus: 'IN_SYNC',
            lastSyncAt: new Date(),
          },
        ],
        save: jest.fn().mockRejectedValue(new Error('MongoWriteConflict')),
      };

      jest.spyOn(Case, 'findOne').mockResolvedValue(caseDoc);
      const deleteSpy = jest.spyOn(IntegrationSyncEvent, 'deleteOne').mockResolvedValue({ deletedCount: 1 });

      const req = {
        body: {
          issue: { id: '10042', key: 'SEC-205', fields: { status: { name: 'In Progress' } } },
        },
        rawBody: Buffer.from(JSON.stringify({ test: 'rollback-on-failure' }), 'utf8'),
      };

      const res = await reconciler.reconcileWebhook({
        req,
        config: mockConfigs[jiraIntegrationId],
        verification: { authenticated: true },
      });

      expect(res.success).toBe(false);
      expect(res.status).toBe('INTERNAL_SERVER_ERROR');
      expect(deleteSpy).toHaveBeenCalled(); // Rolled back claimed syncId
    });
  });
});
