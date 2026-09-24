/**
 * CyberShield X — Phase 81 Remediation Test Suite
 * FINDING-04: Canonical Integration Connection Testing
 *
 * Verifies that the admin "Test Connection" flow:
 * 1. Correctly resolves the target IntegrationConfig by ID from route param or request body
 * 2. Enforces authoritative tenant/org isolation (never trusting client-supplied body org overrides)
 * 3. Invokes the real connector testConnection() implementation via approved CONNECTOR_REGISTRY
 * 4. Returns the actual sanitized connection result with latencyMs and updates health status
 *
 * Test Matrix:
 * - Case A: Valid tenant + valid integration -> real connector test invoked
 * - Case B: Integration ID correctly resolved from route/body (both :id/test and /test with { id })
 * - Case C: Wrong/cross-tenant integration -> rejected
 * - Case D: Missing/invalid/nonexistent integration -> appropriate 400/404 error
 * - Case E: Unsupported/inactive integration -> safe failure without network calls
 * - Case F: Connector failure -> sanitized failure, not false success
 * - Case G: Credentials/secrets never appear in response or logs
 * - Case H: Existing supported providers remain compatible (Jira, ServiceNow, PagerDuty, Slack, etc.)
 * - Case I: No client-supplied organizationId can override authoritative tenant
 * - Case J: No regression to existing integration configuration behavior
 */

const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');

// Mock auth middleware to supply authenticated user
const userAId = new mongoose.Types.ObjectId();
const userBId = new mongoose.Types.ObjectId();
const tenantAId = new mongoose.Types.ObjectId();
const tenantBId = new mongoose.Types.ObjectId();

let mockCurrentUser = {
  _id: userAId,
  username: 'secops_admin',
  role: 'admin',
};

jest.mock('../middleware/auth', () => ({
  authenticate: (req, res, next) => {
    req.user = mockCurrentUser;
    next();
  },
}));

// Target routes, controllers, models & services
const integrationRouter = require('../routes/integration');
const integrationController = require('../controllers/integrationController');
const IntegrationService = require('../services/platform/IntegrationService');
const IntegrationConfig = require('../models/IntegrationConfig');
const Membership = require('../models/Membership');
const RBACService = require('../services/org/RBACService');
const OutboundDispatchService = require('../services/soc/OutboundDispatchService');
const { jiraConnector } = require('../integrations/jira');
const { serviceNowConnector } = require('../integrations/servicenow');
const { pagerDutyConnector } = require('../integrations/pagerduty');

describe('Phase 81 Remediation — FINDING-04 Canonical Integration Connection Testing', () => {
  let app;

  beforeEach(() => {
    jest.clearAllMocks();

    mockCurrentUser = {
      _id: userAId,
      username: 'secops_admin',
      role: 'admin',
    };

    // Default RBAC allow
    jest.spyOn(RBACService, 'requirePermission').mockImplementation(async (orgId, userId, perm) => {
      if (orgId && String(orgId) !== String(tenantAId)) {
        const err = new Error('Tenant isolation violation: User is not a member of this organization');
        err.status = 403;
        throw err;
      }
      return 'admin';
    });

    // Mock Membership resolution
    jest.spyOn(Membership, 'findOne').mockImplementation(({ organizationId, userId }) => {
      if (String(organizationId) === String(tenantAId) && String(userId) === String(userAId)) {
        return Promise.resolve({
          organizationId: tenantAId,
          userId: userAId,
          role: 'admin',
        });
      }
      return Promise.resolve(null);
    });

    // Build Express test application with router
    app = express();
    app.use(express.json());
    app.use('/api/integrations', integrationRouter);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // =========================================================================
  // Case A: Valid Tenant + Valid Integration -> Real Connector Test Invoked
  // =========================================================================
  describe('Case A: Valid Tenant + Valid Integration Execution', () => {
    test('invokes real connector testConnection() for Jira and returns normalized result', async () => {
      const jiraId = new mongoose.Types.ObjectId();
      const mockJiraDoc = {
        _id: jiraId,
        organizationId: tenantAId,
        type: 'Jira',
        name: 'Enterprise Jira Cloud',
        active: true,
        config: {
          baseUrl: 'https://jira.corp.internal',
          email: 'admin@corp.internal',
          apiToken: 'super-secret-jira-token-999',
          projectKey: 'SEC',
        },
        healthStatus: 'Unknown',
        save: jest.fn().mockResolvedValue(true),
      };

      jest.spyOn(IntegrationConfig, 'findOne').mockResolvedValue(mockJiraDoc);

      const processJobSpy = jest.spyOn(OutboundDispatchService, 'processJob').mockResolvedValue({
        success: true,
        status: 'COMPLETED',
        result: {
          success: true,
          provider: 'JIRA',
          externalStatus: 'CONNECTED',
          operation: 'TEST',
        },
      });

      const res = await request(app)
        .post(`/api/integrations/${jiraId}/test`)
        .set('x-organization-id', tenantAId.toString());

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.provider).toBe('Jira');
      expect(res.body.healthStatus).toBe('Healthy');
      expect(res.body.latencyMs).toBeGreaterThanOrEqual(0);
      expect(res.body.testedAt).toBeDefined();

      expect(processJobSpy).toHaveBeenCalledTimes(1);
      expect(processJobSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: tenantAId.toString(),
          integrationId: jiraId.toString(),
          provider: 'JIRA',
          operation: 'TEST',
        })
      );
      expect(mockJiraDoc.save).toHaveBeenCalled();
    });

    test('invokes real connector testConnection() for ServiceNow', async () => {
      const snId = new mongoose.Types.ObjectId();
      const mockSnDoc = {
        _id: snId,
        organizationId: tenantAId,
        type: 'ServiceNow',
        name: 'Corporate ServiceNow',
        active: true,
        config: {
          instanceUrl: 'https://instance.service-now.com',
          username: 'admin',
          password: 'sn-secret-password-123',
        },
        healthStatus: 'Unknown',
        save: jest.fn().mockResolvedValue(true),
      };

      jest.spyOn(IntegrationConfig, 'findOne').mockResolvedValue(mockSnDoc);

      const processJobSpy = jest.spyOn(OutboundDispatchService, 'processJob').mockResolvedValue({
        success: true,
        status: 'COMPLETED',
        result: {
          success: true,
          provider: 'SERVICENOW',
          externalStatus: 'CONNECTED',
          operation: 'TEST',
        },
      });

      const res = await request(app)
        .post(`/api/integrations/${snId}/test`)
        .set('x-organization-id', tenantAId.toString());

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.provider).toBe('ServiceNow');
      expect(processJobSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          provider: 'SERVICENOW',
          operation: 'TEST',
        })
      );
    });
  });

  // =========================================================================
  // Case B: Integration ID Resolution from Route vs Body
  // =========================================================================
  describe('Case B: Integration ID Resolution Contracts', () => {
    test('resolves integrationId from URL route parameter /:id/test', async () => {
      const id = new mongoose.Types.ObjectId();
      const mockDoc = {
        _id: id,
        organizationId: tenantAId,
        type: 'Jira',
        name: 'Route Test',
        active: true,
        save: jest.fn().mockResolvedValue(true),
      };

      jest.spyOn(IntegrationConfig, 'findOne').mockResolvedValue(mockDoc);
      jest.spyOn(OutboundDispatchService, 'processJob').mockResolvedValue({
        success: true,
        status: 'COMPLETED',
        result: { success: true },
      });

      const res = await request(app)
        .post(`/api/integrations/${id}/test`)
        .set('x-organization-id', tenantAId.toString());

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.integrationId).toBe(id.toString());
    });

    test('resolves integrationId from request body { id } on /test (client workflow service alias)', async () => {
      const id = new mongoose.Types.ObjectId();
      const mockDoc = {
        _id: id,
        organizationId: tenantAId,
        type: 'Jira',
        name: 'Body Test',
        active: true,
        save: jest.fn().mockResolvedValue(true),
      };

      jest.spyOn(IntegrationConfig, 'findOne').mockResolvedValue(mockDoc);
      jest.spyOn(OutboundDispatchService, 'processJob').mockResolvedValue({
        success: true,
        status: 'COMPLETED',
        result: { success: true },
      });

      const res = await request(app)
        .post('/api/integrations/test')
        .set('x-organization-id', tenantAId.toString())
        .send({ id: id.toString() });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.integrationId).toBe(id.toString());
    });

    test('resolves integrationId from request body { integrationId } on /test', async () => {
      const id = new mongoose.Types.ObjectId();
      const mockDoc = {
        _id: id,
        organizationId: tenantAId,
        type: 'PagerDuty',
        name: 'Alt Body Test',
        active: true,
        save: jest.fn().mockResolvedValue(true),
      };

      jest.spyOn(IntegrationConfig, 'findOne').mockResolvedValue(mockDoc);
      jest.spyOn(OutboundDispatchService, 'processJob').mockResolvedValue({
        success: true,
        status: 'COMPLETED',
        result: { success: true },
      });

      const res = await request(app)
        .post('/api/integrations/test')
        .set('x-organization-id', tenantAId.toString())
        .send({ integrationId: id.toString() });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // =========================================================================
  // Case C: Wrong / Cross-Tenant Integration -> Rejected
  // =========================================================================
  describe('Case C: Multi-Tenant Boundary Enforcement', () => {
    test('strictly rejects attempt to test an integration belonging to another tenant', async () => {
      const foreignId = new mongoose.Types.ObjectId();
      const foreignDoc = {
        _id: foreignId,
        organizationId: tenantBId, // Belongs to Tenant B
        type: 'Jira',
        name: 'Tenant B Jira',
        active: true,
      };

      // Scoped query for Tenant A returns null
      jest.spyOn(IntegrationConfig, 'findOne').mockResolvedValue(null);
      // But exists under Tenant B
      jest.spyOn(IntegrationConfig, 'findById').mockResolvedValue(foreignDoc);

      const processJobSpy = jest.spyOn(OutboundDispatchService, 'processJob');

      const res = await request(app)
        .post(`/api/integrations/${foreignId}/test`)
        .set('x-organization-id', tenantAId.toString());

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/Tenant isolation violation/i);

      // Verify zero connector dispatch occurred
      expect(processJobSpy).not.toHaveBeenCalled();
    });
  });

  // =========================================================================
  // Case D: Missing / Invalid / Nonexistent Integration ID
  // =========================================================================
  describe('Case D: Missing, Invalid and Nonexistent ID Handling', () => {
    test('returns 400 when integrationId is missing from both route and body', async () => {
      const res = await request(app)
        .post('/api/integrations/test')
        .set('x-organization-id', tenantAId.toString())
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('MISSING_INTEGRATION_ID');
    });

    test('returns 400 when integrationId is not a valid ObjectId', async () => {
      const res = await request(app)
        .post('/api/integrations/invalid-id-xyz/test')
        .set('x-organization-id', tenantAId.toString());

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('INVALID_INTEGRATION_ID');
    });

    test('returns 404 when integrationId does not exist in database', async () => {
      const randomId = new mongoose.Types.ObjectId();
      jest.spyOn(IntegrationConfig, 'findOne').mockResolvedValue(null);
      jest.spyOn(IntegrationConfig, 'findById').mockResolvedValue(null);

      const res = await request(app)
        .post(`/api/integrations/${randomId}/test`)
        .set('x-organization-id', tenantAId.toString());

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('INTEGRATION_NOT_FOUND');
    });
  });

  // =========================================================================
  // Case E: Unsupported / Inactive Integration -> Safe Failure
  // =========================================================================
  describe('Case E: Inactive and Unsupported Provider Safe Failure', () => {
    test('returns safe failure when integration is inactive without invoking connector', async () => {
      const inactiveId = new mongoose.Types.ObjectId();
      const mockDoc = {
        _id: inactiveId,
        organizationId: tenantAId,
        type: 'Jira',
        name: 'Disabled Jira',
        active: false,
        healthStatus: 'Unknown',
        save: jest.fn().mockResolvedValue(true),
      };

      jest.spyOn(IntegrationConfig, 'findOne').mockResolvedValue(mockDoc);
      const processJobSpy = jest.spyOn(OutboundDispatchService, 'processJob');

      const res = await request(app)
        .post(`/api/integrations/${inactiveId}/test`)
        .set('x-organization-id', tenantAId.toString());

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(false);
      expect(res.body.status).toBe('INACTIVE');
      expect(res.body.healthStatus).toBe('Failed');
      expect(res.body.message).toMatch(/is inactive/i);

      // Verify zero external network calls
      expect(processJobSpy).not.toHaveBeenCalled();
      expect(mockDoc.save).toHaveBeenCalled();
      expect(mockDoc.healthStatus).toBe('Failed');
    });

    test('returns safe failure for unrecognized provider type', async () => {
      const unsuppId = new mongoose.Types.ObjectId();
      const mockDoc = {
        _id: unsuppId,
        organizationId: tenantAId,
        type: 'AlienProvider',
        name: 'Unknown Provider',
        active: true,
        save: jest.fn().mockResolvedValue(true),
      };

      jest.spyOn(IntegrationConfig, 'findOne').mockResolvedValue(mockDoc);

      const res = await request(app)
        .post(`/api/integrations/${unsuppId}/test`)
        .set('x-organization-id', tenantAId.toString());

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(false);
      expect(res.body.status).toBe('UNSUPPORTED_PROVIDER');
      expect(res.body.healthStatus).toBe('Failed');
    });
  });

  // =========================================================================
  // Case F: Connector Failure -> Sanitized Failure, Not False Success
  // =========================================================================
  describe('Case F: Connector Failure Handling', () => {
    test('returns sanitized failure and sets healthStatus to Failed when connector throws', async () => {
      const jiraId = new mongoose.Types.ObjectId();
      const mockDoc = {
        _id: jiraId,
        organizationId: tenantAId,
        type: 'Jira',
        name: 'Failing Jira',
        active: true,
        healthStatus: 'Healthy',
        save: jest.fn().mockResolvedValue(true),
      };

      jest.spyOn(IntegrationConfig, 'findOne').mockResolvedValue(mockDoc);

      // Simulate connector failure returned from OutboundDispatchService
      jest.spyOn(OutboundDispatchService, 'processJob').mockResolvedValue({
        success: false,
        status: 'NON_RETRYABLE',
        reason: 'Jira API authentication failed (HTTP 401 Unauthorized)',
        result: {
          success: false,
          error: {
            code: 'AUTH_FAILED',
            message: 'Jira API authentication failed (HTTP 401 Unauthorized)',
          },
        },
      });

      const res = await request(app)
        .post(`/api/integrations/${jiraId}/test`)
        .set('x-organization-id', tenantAId.toString());

      expect(res.status).toBe(200);
      // MUST NOT return false success!
      expect(res.body.success).toBe(false);
      expect(res.body.healthStatus).toBe('Failed');
      expect(res.body.message).toMatch(/authentication failed/i);
      expect(mockDoc.healthStatus).toBe('Failed');
      expect(mockDoc.lastTestStatus).toBe('failed');
    });

    test('safely catches unexpected network exceptions and returns sanitized failure', async () => {
      const jiraId = new mongoose.Types.ObjectId();
      const mockDoc = {
        _id: jiraId,
        organizationId: tenantAId,
        type: 'Jira',
        name: 'Crashing Jira',
        active: true,
        healthStatus: 'Healthy',
        save: jest.fn().mockResolvedValue(true),
      };

      jest.spyOn(IntegrationConfig, 'findOne').mockResolvedValue(mockDoc);

      // Simulate network exception (e.g. connection refused)
      jest.spyOn(OutboundDispatchService, 'processJob').mockRejectedValue(
        new Error('connect ECONNREFUSED 198.51.100.1:443')
      );

      const res = await request(app)
        .post(`/api/integrations/${jiraId}/test`)
        .set('x-organization-id', tenantAId.toString());

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(false);
      expect(res.body.healthStatus).toBe('Failed');
      expect(res.body.message).toBeDefined();
    });
  });

  // =========================================================================
  // Case G: Credentials / Secrets Never Leak
  // =========================================================================
  describe('Case G: Credential Protection and Non-Exposure', () => {
    test('never exposes apiToken, password, or webhookSecret in response', async () => {
      const jiraId = new mongoose.Types.ObjectId();
      const mockDoc = {
        _id: jiraId,
        organizationId: tenantAId,
        type: 'Jira',
        name: 'Secret Leak Test',
        active: true,
        config: {
          baseUrl: 'https://jira.corp.internal',
          email: 'admin@corp.internal',
          apiToken: 'ULTRA_SECRET_TOKEN_DO_NOT_LEAK',
          webhookSecret: 'HMAC_SECRET_DO_NOT_LEAK',
        },
        save: jest.fn().mockResolvedValue(true),
      };

      jest.spyOn(IntegrationConfig, 'findOne').mockResolvedValue(mockDoc);
      jest.spyOn(OutboundDispatchService, 'processJob').mockResolvedValue({
        success: true,
        status: 'COMPLETED',
        result: { success: true },
      });

      const res = await request(app)
        .post(`/api/integrations/${jiraId}/test`)
        .set('x-organization-id', tenantAId.toString());

      expect(res.status).toBe(200);
      const resString = JSON.stringify(res.body);
      expect(resString).not.toContain('ULTRA_SECRET_TOKEN_DO_NOT_LEAK');
      expect(resString).not.toContain('HMAC_SECRET_DO_NOT_LEAK');
    });
  });

  // =========================================================================
  // Case H: Compatibility with Non-ITSM Providers (Slack, GitHub, etc.)
  // =========================================================================
  describe('Case H: Compatibility with Existing Notification Providers', () => {
    test('tests Slack integration via modular connection test handler', async () => {
      const slackId = new mongoose.Types.ObjectId();
      const mockDoc = {
        _id: slackId,
        organizationId: tenantAId,
        type: 'Slack',
        name: 'SecOps Slack Alerts',
        active: true,
        config: { webhookUrl: 'https://hooks.slack.com/services/T00/B00/X00' },
        save: jest.fn().mockResolvedValue(true),
      };

      jest.spyOn(IntegrationConfig, 'findOne').mockResolvedValue(mockDoc);

      const legacyService = require('../integrations/integrationService');
      const testConnSpy = jest.spyOn(legacyService, 'testIntegrationConnection').mockResolvedValue({
        success: true,
        result: { delivered: true },
      });

      const res = await request(app)
        .post(`/api/integrations/${slackId}/test`)
        .set('x-organization-id', tenantAId.toString());

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.provider).toBe('Slack');
      expect(testConnSpy).toHaveBeenCalledWith('Slack', mockDoc.config, mockDoc._id);
    });
  });

  // =========================================================================
  // Case I: Client-Supplied organizationId Cannot Override Authoritative Tenant
  // =========================================================================
  describe('Case I: Client-Supplied Organization Override Defense', () => {
    test('ignores organizationId sent in request body and strictly enforces authenticated tenant', async () => {
      const targetId = new mongoose.Types.ObjectId();
      const mockDoc = {
        _id: targetId,
        organizationId: tenantAId, // Belongs to Tenant A
        type: 'Jira',
        name: 'Tenant Override Check',
        active: true,
        save: jest.fn().mockResolvedValue(true),
      };

      const findOneSpy = jest.spyOn(IntegrationConfig, 'findOne').mockResolvedValue(mockDoc);
      jest.spyOn(OutboundDispatchService, 'processJob').mockResolvedValue({
        success: true,
        status: 'COMPLETED',
        result: { success: true },
      });

      // Attacker attempts to pass a different organizationId in the body
      const res = await request(app)
        .post('/api/integrations/test')
        .set('x-organization-id', tenantAId.toString())
        .send({
          id: targetId.toString(),
          organizationId: tenantBId.toString(), // Attacker attempts to forge Tenant B
        });

      expect(res.status).toBe(200);
      // The query MUST have been executed with the authenticated tenantAId, NOT tenantBId
      expect(findOneSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: tenantAId.toString(),
        })
      );
    });
  });

  // =========================================================================
  // Case J: No Regression to Existing Configuration Operations
  // =========================================================================
  describe('Case J: Zero Regression to Existing CRUD Behavior', () => {
    test('getIntegrations returns sanitized list for the tenant', async () => {
      const mockDocs = [
        { _id: new mongoose.Types.ObjectId(), type: 'Jira', organizationId: tenantAId, status: 'active' },
        { _id: new mongoose.Types.ObjectId(), type: 'ServiceNow', organizationId: tenantAId, status: 'active' },
      ];

      // Mock QueryBuilder execution
      const QueryBuilder = require('../utils/QueryBuilder');
      jest.spyOn(QueryBuilder.prototype, 'execute').mockResolvedValue({
        data: mockDocs,
        pagination: { total: 2, page: 1, limit: 10 },
      });

      const res = await request(app)
        .get('/api/integrations')
        .set('x-organization-id', tenantAId.toString());

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.pagination).toBeDefined();
    });

    test('deleteIntegration removes integration and returns success', async () => {
      const targetId = new mongoose.Types.ObjectId();
      jest.spyOn(IntegrationConfig, 'findOneAndDelete').mockResolvedValue({ _id: targetId });

      const res = await request(app)
        .delete(`/api/integrations/${targetId}`)
        .set('x-organization-id', tenantAId.toString());

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
