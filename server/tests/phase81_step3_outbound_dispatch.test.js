'use strict';

/**
 * 🛡️ CyberShield X — Phase 81 Step 3: Outbound Dispatch, Worker, Exponential Backoff & DLQ Acceptance Battery
 *
 * Verifies Phase 81 Step 3 implementation across:
 *  - Gate A: Queue & Dispatch Enqueueing (contract validation, UUID v4 jobId, secret prohibition)
 *  - Gate B: Tenant Isolation & Security Defense (authoritative lookup, cross-tenant forgery rejection)
 *  - Gate C: Outbound Connector Resolution & Execution (Jira, ServiceNow, PagerDuty, normalized results)
 *  - Gate D: Deterministic Error Classification & Exponential Backoff Math
 *  - Gate E: Retry Limits & Dead-Letter Queue (DLQ) Isolation
 *  - Gate F: Poison Job & Worker Crash Isolation
 *  - Gate G: IntegrationSyncEvent Audit Trail Conformance (UUID v4 syncId, payloadHash)
 *  - Gate H: Step 3 Scope Boundaries & Protected Contracts
 */

const mongoose = require('mongoose');
const crypto = require('crypto');
const OutboundDispatchService = require('../services/soc/OutboundDispatchService');
const OutboundDispatcherFacade = require('../integrations/outboundDispatcher');
const { integrationQueue } = require('../workers/queueProvider');
const IntegrationConfig = require('../models/IntegrationConfig');
const IntegrationSyncEvent = require('../models/IntegrationSyncEvent');
const { jiraConnector } = require('../integrations/jira');
const { serviceNowConnector } = require('../integrations/servicenow');
const { pagerDutyConnector } = require('../integrations/pagerduty');
const { secureAxios } = require('../integrations/connectorUtils');

describe('Phase 81 Step 3 — Outbound Dispatch, Worker, Exponential Backoff & DLQ Battery', () => {
  const orgA = new mongoose.Types.ObjectId().toString();
  const orgB = new mongoose.Types.ObjectId().toString();
  const integrationIdA = new mongoose.Types.ObjectId().toString();
  const integrationIdB = new mongoose.Types.ObjectId().toString();

  beforeEach(() => {
    OutboundDispatchService.clearDlq();
    OutboundDispatchService.clearRetryTimers();
    integrationQueue.clear();
    jest.restoreAllMocks();
    jest.spyOn(IntegrationSyncEvent, 'create').mockResolvedValue({});
    jest.spyOn(IntegrationConfig, 'findOne').mockResolvedValue(null);
    jest.spyOn(IntegrationConfig, 'findById').mockResolvedValue(null);
  });

  afterEach(async () => {
    OutboundDispatchService.clearDlq();
    OutboundDispatchService.clearRetryTimers();
    integrationQueue.clear();
    await new Promise((resolve) => setTimeout(resolve, 30));
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    OutboundDispatchService.clearDlq();
    OutboundDispatchService.clearRetryTimers();
    integrationQueue.clear();
    await new Promise((resolve) => setTimeout(resolve, 30));
    jest.restoreAllMocks();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // GATE A: Queue & Dispatch Enqueueing
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Gate A: Queue & Dispatch Enqueueing', () => {
    it('enqueues a valid Jira dispatch job with UUID v4 jobId and default attempt metadata', async () => {
      const enqueueSpy = jest.spyOn(integrationQueue, 'enqueue');

      const result = await OutboundDispatchService.enqueueDispatch({
        organizationId: orgA,
        integrationId: integrationIdA,
        provider: 'JIRA',
        operation: 'CREATE',
        targetEntityType: 'CASE',
        targetEntityId: 'CASE-101',
        payload: { summary: 'DDoS Incident', priority: 'High' },
      });

      expect(result.status).toBe('ENQUEUED');
      expect(result.jobId).toBeDefined();
      expect(result.provider).toBe('JIRA');
      expect(result.operation).toBe('CREATE');
      expect(result.targetEntityId).toBe('CASE-101');
      expect(result.attempt).toBe(1);
      expect(result.maxAttempts).toBe(3);
      expect(enqueueSpy).toHaveBeenCalledTimes(1);

      const queuedTask = enqueueSpy.mock.calls[0][0];
      expect(queuedTask.jobType).toBe('OUTBOUND_DISPATCH');
      expect(queuedTask.organizationId).toBe(orgA);
      expect(queuedTask.integrationId).toBe(integrationIdA);
      expect(queuedTask.payload.summary).toBe('DDoS Incident');
    });

    it('enqueues ServiceNow and PagerDuty jobs normalizing provider casing', async () => {
      const resSN = await OutboundDispatchService.enqueueDispatch({
        organizationId: orgA,
        integrationId: integrationIdA,
        provider: 'servicenow',
        targetEntityId: 'CASE-102',
        payload: { short_description: 'Malware alert' },
      });
      expect(resSN.provider).toBe('SERVICENOW');

      const resPD = await OutboundDispatchService.enqueueDispatch({
        organizationId: orgA,
        integrationId: integrationIdA,
        provider: 'PagerDuty',
        targetEntityId: 'INC-202',
        payload: { summary: 'Host down' },
      });
      expect(resPD.provider).toBe('PAGERDUTY');
    });

    it('rejects dispatch requests missing required fields', async () => {
      await expect(
        OutboundDispatchService.enqueueDispatch({
          integrationId: integrationIdA,
          provider: 'JIRA',
          targetEntityId: 'CASE-101',
          payload: {},
        })
      ).rejects.toThrow('organizationId is required');

      await expect(
        OutboundDispatchService.enqueueDispatch({
          organizationId: orgA,
          provider: 'JIRA',
          targetEntityId: 'CASE-101',
          payload: {},
        })
      ).rejects.toThrow('integrationId is required');

      await expect(
        OutboundDispatchService.enqueueDispatch({
          organizationId: orgA,
          integrationId: integrationIdA,
          targetEntityId: 'CASE-101',
          payload: {},
        })
      ).rejects.toThrow('provider is required');

      await expect(
        OutboundDispatchService.enqueueDispatch({
          organizationId: orgA,
          integrationId: integrationIdA,
          provider: 'JIRA',
          payload: {},
        })
      ).rejects.toThrow('targetEntityId is required');
    });

    it('rejects dispatch requests with unsupported providers', async () => {
      await expect(
        OutboundDispatchService.enqueueDispatch({
          organizationId: orgA,
          integrationId: integrationIdA,
          provider: 'UNKNOWN_TICKETING_TOOL',
          targetEntityId: 'CASE-101',
          payload: {},
        })
      ).rejects.toThrow(/unsupported provider/i);
    });

    it('strictly forbids raw secrets or credentials in queue payload', async () => {
      await expect(
        OutboundDispatchService.enqueueDispatch({
          organizationId: orgA,
          integrationId: integrationIdA,
          provider: 'JIRA',
          targetEntityId: 'CASE-101',
          payload: { summary: 'Leak test', apiToken: 'secret-token-12345' },
        })
      ).rejects.toThrow(/forbidden credential field 'apiToken'/i);

      await expect(
        OutboundDispatchService.enqueueDispatch({
          organizationId: orgA,
          integrationId: integrationIdA,
          provider: 'SERVICENOW',
          targetEntityId: 'CASE-101',
          payload: { summary: 'Leak test', nested: { password: 'my-super-secret' } },
        })
      ).rejects.toThrow(/forbidden credential field 'password'/i);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // GATE B: Tenant Isolation & Mismatch Defense
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Gate B: Tenant Isolation & Mismatch Defense', () => {
    it('executes when organizationId authoritatively matches IntegrationConfig', async () => {
      const mockConfig = {
        _id: integrationIdA,
        organizationId: orgA,
        type: 'Jira',
        active: true,
        config: { baseUrl: 'https://jira.org-a.com' },
      };

      jest.spyOn(IntegrationConfig, 'findOne').mockResolvedValue(mockConfig);
      jest.spyOn(jiraConnector, 'createTicket').mockResolvedValue({
        success: true,
        provider: 'JIRA',
        externalTicketKey: 'SEC-101',
      });
      jest.spyOn(IntegrationSyncEvent, 'create').mockResolvedValue({});

      const outcome = await OutboundDispatchService.processJob({
        jobType: 'OUTBOUND_DISPATCH',
        jobId: 'job-tenant-01',
        organizationId: orgA,
        integrationId: integrationIdA,
        provider: 'JIRA',
        operation: 'CREATE',
        targetEntityType: 'CASE',
        targetEntityId: 'CASE-101',
        attempt: 1,
        maxAttempts: 3,
        payload: { summary: 'Tenant match test' },
      });

      expect(outcome.success).toBe(true);
      expect(outcome.status).toBe('COMPLETED');
      expect(IntegrationConfig.findOne).toHaveBeenCalledWith({
        _id: integrationIdA,
        organizationId: orgA,
      });
    });

    it('rejects cross-tenant forgery attempt without calling connector and isolates to DLQ as non-retryable', async () => {
      // Config belongs to orgB, but job claims orgA
      const foreignConfig = {
        _id: integrationIdB,
        organizationId: orgB,
        type: 'Jira',
        active: true,
      };

      jest.spyOn(IntegrationConfig, 'findOne').mockResolvedValue(null); // orgA query returns null
      jest.spyOn(IntegrationConfig, 'findById').mockResolvedValue(foreignConfig); // exists under orgB
      const connectorSpy = jest.spyOn(jiraConnector, 'createTicket');
      const auditSpy = jest.spyOn(IntegrationSyncEvent, 'create').mockResolvedValue({});

      const outcome = await OutboundDispatchService.processJob({
        jobType: 'OUTBOUND_DISPATCH',
        jobId: 'job-forgery-01',
        organizationId: orgA, // Attacker forged orgA
        integrationId: integrationIdB, // Points to victim's integration in orgB
        provider: 'JIRA',
        operation: 'CREATE',
        targetEntityType: 'CASE',
        targetEntityId: 'CASE-ATTACK',
        attempt: 1,
        maxAttempts: 3,
        payload: { summary: 'Forged request' },
      });

      expect(outcome.success).toBe(false);
      expect(outcome.status).toBe('DLQ');
      expect(outcome.reason).toBe('TENANT_MISMATCH');
      expect(outcome.retryable).toBe(false);
      expect(connectorSpy).not.toHaveBeenCalled();

      // Verify audit recorded security violation
      expect(auditSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'REJECTED',
          eventType: 'TICKET_DISPATCH_TENANT_MISMATCH',
        })
      );

      // Verify DLQ item isolation
      const dlqItems = OutboundDispatchService.getDlq({ organizationId: orgA });
      expect(dlqItems.length).toBe(1);
      expect(dlqItems[0].failureReason).toBe('TENANT_MISMATCH');
    });

    it('rejects disabled integration configurations deterministically', async () => {
      const disabledConfig = {
        _id: integrationIdA,
        organizationId: orgA,
        type: 'Jira',
        active: false,
      };

      jest.spyOn(IntegrationConfig, 'findOne').mockResolvedValue(disabledConfig);
      const connectorSpy = jest.spyOn(jiraConnector, 'createTicket');

      const outcome = await OutboundDispatchService.processJob({
        jobType: 'OUTBOUND_DISPATCH',
        jobId: 'job-disabled-01',
        organizationId: orgA,
        integrationId: integrationIdA,
        provider: 'JIRA',
        operation: 'CREATE',
        targetEntityType: 'CASE',
        targetEntityId: 'CASE-101',
        attempt: 1,
        maxAttempts: 3,
        payload: { summary: 'Disabled test' },
      });

      expect(outcome.success).toBe(false);
      expect(outcome.status).toBe('DLQ');
      expect(outcome.reason).toBe('INTEGRATION_DISABLED');
      expect(connectorSpy).not.toHaveBeenCalled();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // GATE C: Outbound Connector Resolution & Execution
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Gate C: Outbound Connector Resolution & Execution', () => {
    it('resolves and executes Jira connector with normalized result', async () => {
      const mockConfig = {
        _id: integrationIdA,
        organizationId: orgA,
        type: 'Jira',
        active: true,
      };

      jest.spyOn(IntegrationConfig, 'findOne').mockResolvedValue(mockConfig);
      jest.spyOn(jiraConnector, 'createTicket').mockResolvedValue({
        success: true,
        provider: 'JIRA',
        operation: 'CREATE',
        externalTicketKey: 'SEC-500',
        externalTicketId: '100500',
        externalUrl: 'https://acme.atlassian.net/browse/SEC-500',
      });
      jest.spyOn(IntegrationSyncEvent, 'create').mockResolvedValue({});

      const outcome = await OutboundDispatchService.processJob({
        jobType: 'OUTBOUND_DISPATCH',
        jobId: 'job-jira-exec',
        organizationId: orgA,
        integrationId: integrationIdA,
        provider: 'JIRA',
        operation: 'CREATE',
        targetEntityType: 'CASE',
        targetEntityId: 'CASE-500',
        attempt: 1,
        maxAttempts: 3,
        payload: { summary: 'High Alert' },
      });

      expect(outcome.success).toBe(true);
      expect(outcome.result.provider).toBe('JIRA');
      expect(outcome.result.externalTicketKey).toBe('SEC-500');
    });

    it('resolves and executes ServiceNow connector with normalized result', async () => {
      const mockConfig = {
        _id: integrationIdA,
        organizationId: orgA,
        type: 'ServiceNow',
        active: true,
      };

      jest.spyOn(IntegrationConfig, 'findOne').mockResolvedValue(mockConfig);
      jest.spyOn(serviceNowConnector, 'createTicket').mockResolvedValue({
        success: true,
        provider: 'SERVICENOW',
        operation: 'CREATE',
        externalTicketKey: 'INC0010999',
        externalTicketId: 'sys_id_10999',
        externalUrl: 'https://dev.service-now.com/nav_to.do?uri=incident.do?sys_id=sys_id_10999',
      });
      jest.spyOn(IntegrationSyncEvent, 'create').mockResolvedValue({});

      const outcome = await OutboundDispatchService.processJob({
        jobType: 'OUTBOUND_DISPATCH',
        jobId: 'job-sn-exec',
        organizationId: orgA,
        integrationId: integrationIdA,
        provider: 'SERVICENOW',
        operation: 'CREATE',
        targetEntityType: 'CASE',
        targetEntityId: 'CASE-501',
        attempt: 1,
        maxAttempts: 3,
        payload: { short_description: 'Incident Alert' },
      });

      expect(outcome.success).toBe(true);
      expect(outcome.result.provider).toBe('SERVICENOW');
      expect(outcome.result.externalTicketKey).toBe('INC0010999');
    });

    it('resolves and executes PagerDuty connector with normalized result', async () => {
      const mockConfig = {
        _id: integrationIdA,
        organizationId: orgA,
        type: 'PagerDuty',
        active: true,
      };

      jest.spyOn(IntegrationConfig, 'findOne').mockResolvedValue(mockConfig);
      jest.spyOn(pagerDutyConnector, 'createTicket').mockResolvedValue({
        success: true,
        provider: 'PAGERDUTY',
        operation: 'CREATE',
        externalTicketKey: 'dedup_cybershield_1234',
        externalTicketId: 'PD_INC_123',
        externalStatus: 'triggered',
      });
      jest.spyOn(IntegrationSyncEvent, 'create').mockResolvedValue({});

      const outcome = await OutboundDispatchService.processJob({
        jobType: 'OUTBOUND_DISPATCH',
        jobId: 'job-pd-exec',
        organizationId: orgA,
        integrationId: integrationIdA,
        provider: 'PAGERDUTY',
        operation: 'CREATE',
        targetEntityType: 'INCIDENT',
        targetEntityId: 'INC-999',
        attempt: 1,
        maxAttempts: 3,
        payload: { summary: 'Firewall outage' },
      });

      expect(outcome.success).toBe(true);
      expect(outcome.result.provider).toBe('PAGERDUTY');
      expect(outcome.result.externalTicketKey).toBe('dedup_cybershield_1234');
    });

    it('rejects provider type mismatch between config and job', async () => {
      const mockConfig = {
        _id: integrationIdA,
        organizationId: orgA,
        type: 'ServiceNow', // Config is ServiceNow
        active: true,
      };

      jest.spyOn(IntegrationConfig, 'findOne').mockResolvedValue(mockConfig);

      const outcome = await OutboundDispatchService.processJob({
        jobType: 'OUTBOUND_DISPATCH',
        jobId: 'job-mismatch-type',
        organizationId: orgA,
        integrationId: integrationIdA,
        provider: 'JIRA', // Job asked for Jira
        operation: 'CREATE',
        targetEntityType: 'CASE',
        targetEntityId: 'CASE-101',
        attempt: 1,
        maxAttempts: 3,
        payload: { summary: 'Mismatch test' },
      });

      expect(outcome.success).toBe(false);
      expect(outcome.status).toBe('DLQ');
      expect(outcome.reason).toBe('PROVIDER_TYPE_MISMATCH');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // GATE D: Deterministic Error Classification & Exponential Backoff Math
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Gate D: Deterministic Error Classification & Exponential Backoff Math', () => {
    it('classifies timeouts, network resets, 429 rate limits, and 5xx as RETRYABLE', () => {
      expect(OutboundDispatchService.classifyError({ code: 'TIMEOUT', message: 'Connection timed out' })).toBe('RETRYABLE');
      expect(OutboundDispatchService.classifyError({ code: 'JIRA_TIMEOUT' }, { code: 'ETIMEDOUT' })).toBe('RETRYABLE');
      expect(OutboundDispatchService.classifyError({ message: 'ECONNRESET: socket hang up' })).toBe('RETRYABLE');
      expect(OutboundDispatchService.classifyError({ statusCode: 429, message: 'Too many requests' })).toBe('RETRYABLE');
      expect(OutboundDispatchService.classifyError({ statusCode: 500, message: 'Internal Server Error' })).toBe('RETRYABLE');
      expect(OutboundDispatchService.classifyError({ statusCode: 503, message: 'Service Unavailable' })).toBe('RETRYABLE');
    });

    it('classifies 401/403 auth errors, 400 Bad Request, tenant mismatch, and SSRF as NON_RETRYABLE', () => {
      expect(OutboundDispatchService.classifyError({ statusCode: 401, message: 'Unauthorized' })).toBe('NON_RETRYABLE');
      expect(OutboundDispatchService.classifyError({ statusCode: 403, message: 'Forbidden' })).toBe('NON_RETRYABLE');
      expect(OutboundDispatchService.classifyError({ statusCode: 400, message: 'Invalid field project' })).toBe('NON_RETRYABLE');
      expect(OutboundDispatchService.classifyError({ code: 'TENANT_MISMATCH', message: 'Tenant mismatch' })).toBe('NON_RETRYABLE');
      expect(OutboundDispatchService.classifyError({ code: 'SSRF_BLOCKED', message: 'SSRF blocked' })).toBe('NON_RETRYABLE');
    });

    it('calculates deterministic bounded exponential backoff math with 0 jitter in test mode', () => {
      const opts = { baseDelayMs: 1000, backoffMultiplier: 2, maxDelayMs: 60000, jitterMs: 0 };

      // Attempt 2 (first retry): 1000 * 2^0 = 1000ms
      expect(OutboundDispatchService.calculateBackoff(2, opts)).toBe(1000);

      // Attempt 3 (second retry): 1000 * 2^1 = 2000ms
      expect(OutboundDispatchService.calculateBackoff(3, opts)).toBe(2000);

      // Attempt 4: 1000 * 2^2 = 4000ms
      expect(OutboundDispatchService.calculateBackoff(4, opts)).toBe(4000);

      // Attempt 10: would be 1000 * 2^8 = 256,000ms, capped at 60,000ms
      expect(OutboundDispatchService.calculateBackoff(10, opts)).toBe(60000);
    });

    it('bounds jitter within configured maximum window', () => {
      const opts = { baseDelayMs: 1000, backoffMultiplier: 2, maxDelayMs: 60000, jitterMs: 200 };
      for (let i = 0; i < 20; i++) {
        const delay = OutboundDispatchService.calculateBackoff(2, opts);
        expect(delay).toBeGreaterThanOrEqual(1000);
        expect(delay).toBeLessThanOrEqual(1200);
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // GATE E: Retry Limits & Dead-Letter Queue (DLQ) Isolation
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Gate E: Retry Limits & Dead-Letter Queue (DLQ) Isolation', () => {
    it('schedules retry when retryable error occurs under maxAttempts', async () => {
      const mockConfig = {
        _id: integrationIdA,
        organizationId: orgA,
        type: 'Jira',
        active: true,
      };

      jest.spyOn(IntegrationConfig, 'findOne').mockResolvedValue(mockConfig);
      jest.spyOn(jiraConnector, 'createTicket').mockRejectedValue({
        code: 'ETIMEDOUT',
        message: 'Upstream gateway timed out',
      });
      jest.spyOn(IntegrationSyncEvent, 'create').mockResolvedValue({});

      const outcome = await OutboundDispatchService.processJob({
        jobType: 'OUTBOUND_DISPATCH',
        jobId: 'job-retry-01',
        organizationId: orgA,
        integrationId: integrationIdA,
        provider: 'JIRA',
        operation: 'CREATE',
        targetEntityType: 'CASE',
        targetEntityId: 'CASE-RETRY',
        attempt: 1,
        maxAttempts: 3,
        payload: { summary: 'Retry test' },
      });

      expect(outcome.success).toBe(false);
      expect(outcome.status).toBe('RETRYING');
      expect(outcome.retryable).toBe(true);
      expect(outcome.attempt).toBe(1);
      expect(outcome.nextAttempt).toBe(2);
      expect(outcome.delayMs).toBeGreaterThanOrEqual(1000);
    });

    it('moves job to DLQ when maxAttempts (3) is reached', async () => {
      const mockConfig = {
        _id: integrationIdA,
        organizationId: orgA,
        type: 'Jira',
        active: true,
      };

      jest.spyOn(IntegrationConfig, 'findOne').mockResolvedValue(mockConfig);
      jest.spyOn(jiraConnector, 'createTicket').mockRejectedValue({
        code: 'ECONNRESET',
        message: 'Connection reset by peer',
      });
      jest.spyOn(IntegrationSyncEvent, 'create').mockResolvedValue({});

      const outcome = await OutboundDispatchService.processJob({
        jobType: 'OUTBOUND_DISPATCH',
        jobId: 'job-dlq-exhausted',
        organizationId: orgA,
        integrationId: integrationIdA,
        provider: 'JIRA',
        operation: 'CREATE',
        targetEntityType: 'CASE',
        targetEntityId: 'CASE-EXHAUST',
        attempt: 3, // Already at max attempt 3!
        maxAttempts: 3,
        payload: { summary: 'Exhausted retries' },
      });

      expect(outcome.success).toBe(false);
      expect(outcome.status).toBe('DLQ');
      expect(outcome.reason).toBe('RETRIES_EXHAUSTED');
      expect(outcome.retryable).toBe(false);
      expect(outcome.dlqId).toBeDefined();

      // Verify DLQ entry exists and contains zero credentials
      const dlqItem = OutboundDispatchService.getDlqItem(outcome.dlqId, orgA);
      expect(dlqItem).toBeDefined();
      expect(dlqItem.jobId).toBe('job-dlq-exhausted');
      expect(dlqItem.attempts).toBe(3);
      expect(dlqItem.error).toContain('Connection reset by peer');
    });

    it('DLQ items strictly preserve tenant isolation on queries', () => {
      // Artificially populate DLQ for orgA and orgB
      OutboundDispatchService._recordDlq({ jobId: 'j1', organizationId: orgA, provider: 'JIRA' }, 'FAIL', 'err1');
      OutboundDispatchService._recordDlq({ jobId: 'j2', organizationId: orgB, provider: 'SERVICENOW' }, 'FAIL', 'err2');

      const orgAItems = OutboundDispatchService.getDlq({ organizationId: orgA });
      expect(orgAItems.length).toBe(1);
      expect(orgAItems[0].jobId).toBe('j1');

      const orgBItems = OutboundDispatchService.getDlq({ organizationId: orgB });
      expect(orgBItems.length).toBe(1);
      expect(orgBItems[0].jobId).toBe('j2');

      // Cross-tenant item retrieval returns null
      expect(OutboundDispatchService.getDlqItem(orgAItems[0].dlqId, orgB)).toBeNull();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // GATE F: Poison Job & Worker Crash Isolation
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Gate F: Poison Job & Worker Crash Isolation', () => {
    it('isolates structurally malformed poison job immediately to DLQ without throwing or crashing worker', async () => {
      jest.spyOn(IntegrationSyncEvent, 'create').mockResolvedValue({});

      // Malformed job: missing organizationId and integrationId
      const poisonJob = {
        jobId: 'poison-job-001',
        provider: 'JIRA',
        payload: 'not-an-object',
      };

      const outcome = await OutboundDispatchService.processJob(poisonJob);

      expect(outcome.success).toBe(false);
      expect(outcome.status).toBe('DLQ');
      expect(outcome.reason).toBe('POISON_JOB');
      expect(outcome.retryable).toBe(false);
      expect(outcome.dlqId).toBeDefined();
    });

    it('ensures a poison job does not block subsequent valid jobs in the queue', async () => {
      jest.spyOn(IntegrationSyncEvent, 'create').mockResolvedValue({});

      // Job 1 is poison
      const outcome1 = await OutboundDispatchService.processJob({
        jobId: 'poison-1',
        payload: null,
      });
      expect(outcome1.status).toBe('DLQ');

      // Job 2 is valid
      const mockConfig = {
        _id: integrationIdA,
        organizationId: orgA,
        type: 'Jira',
        active: true,
      };
      jest.spyOn(IntegrationConfig, 'findOne').mockResolvedValue(mockConfig);
      jest.spyOn(jiraConnector, 'createTicket').mockResolvedValue({
        success: true,
        provider: 'JIRA',
        externalTicketKey: 'SEC-HEALTHY',
      });

      const outcome2 = await OutboundDispatchService.processJob({
        jobType: 'OUTBOUND_DISPATCH',
        jobId: 'healthy-job-02',
        organizationId: orgA,
        integrationId: integrationIdA,
        provider: 'JIRA',
        operation: 'CREATE',
        targetEntityType: 'CASE',
        targetEntityId: 'CASE-HEALTHY',
        attempt: 1,
        maxAttempts: 3,
        payload: { summary: 'Healthy Job' },
      });

      expect(outcome2.success).toBe(true);
      expect(outcome2.status).toBe('COMPLETED');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // GATE G: IntegrationSyncEvent Audit Trail Conformance
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Gate G: IntegrationSyncEvent Audit Trail Conformance', () => {
    it('creates immutable audit event with UUID v4 syncId, SHA-256 payloadHash, and direction OUTBOUND', async () => {
      const mockConfig = {
        _id: integrationIdA,
        organizationId: orgA,
        type: 'ServiceNow',
        active: true,
      };

      jest.spyOn(IntegrationConfig, 'findOne').mockResolvedValue(mockConfig);
      jest.spyOn(serviceNowConnector, 'createTicket').mockResolvedValue({
        success: true,
        provider: 'SERVICENOW',
        externalTicketKey: 'INC009911',
      });

      const auditSpy = jest.spyOn(IntegrationSyncEvent, 'create').mockResolvedValue({});

      await OutboundDispatchService.processJob({
        jobType: 'OUTBOUND_DISPATCH',
        jobId: 'job-audit-test',
        organizationId: orgA,
        integrationId: integrationIdA,
        provider: 'SERVICENOW',
        operation: 'CREATE',
        targetEntityType: 'CASE',
        targetEntityId: 'CASE-AUDIT-1',
        attempt: 1,
        maxAttempts: 3,
        payload: { short_description: 'Audit test payload' },
      });

      expect(auditSpy).toHaveBeenCalledTimes(1);
      const auditArg = auditSpy.mock.calls[0][0];

      // Validate UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
      expect(auditArg.syncId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
      expect(auditArg.direction).toBe('OUTBOUND');
      expect(auditArg.organizationId).toBe(orgA);
      expect(auditArg.provider).toBe('SERVICENOW');
      expect(auditArg.eventType).toBe('TICKET_CREATE_SUCCESS');
      expect(auditArg.status).toBe('SUCCESS');
      expect(auditArg.externalTicketKey).toBe('INC009911');

      // Validate SHA-256 payloadHash format (64 hex characters)
      expect(auditArg.payloadHash).toMatch(/^[0-9a-f]{64}$/);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // GATE H: Step 3 Scope Boundaries & Protected Contracts
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Gate H: Step 3 Scope Boundaries & Protected Contracts', () => {
    it('verifies maxRedirects: 0 is explicitly configured on secureAxios defaults', () => {
      expect(secureAxios.defaults.maxRedirects).toBe(0);
    });

    it('verifies outboundDispatcher facade re-exports OutboundDispatchService methods', () => {
      expect(typeof OutboundDispatcherFacade.enqueueDispatch).toBe('function');
      expect(typeof OutboundDispatcherFacade.processJob).toBe('function');
      expect(typeof OutboundDispatcherFacade.getDlq).toBe('function');
      expect(typeof OutboundDispatcherFacade.calculateBackoff).toBe('function');
      expect(typeof OutboundDispatcherFacade.classifyError).toBe('function');
    });

    it('verifies service re-export stubs point to canonical implementations', () => {
      const qp = require('../services/queueProvider');
      expect(qp.integrationQueue).toBeDefined();

      const aq = require('../services/actionQueue');
      expect(typeof aq.runTask).toBe('function');

      const ods = require('../services/OutboundDispatchService');
      expect(typeof ods.enqueueDispatch).toBe('function');
    });

    it('strictly confirms Step 4+ items are NOT implemented', () => {
      // 1. Zero webhook routes or handlers
      const fs = require('fs');
      const path = require('path');
      expect(fs.existsSync(path.join(__dirname, '../routes/webhooks.js'))).toBe(false);
      expect(fs.existsSync(path.join(__dirname, '../controllers/webhookController.js'))).toBe(false);

      // 2. Zero bidirectional ticket sync engine
      expect(fs.existsSync(path.join(__dirname, '../services/soc/TicketSyncService.js'))).toBe(false);
    });
  });
});
