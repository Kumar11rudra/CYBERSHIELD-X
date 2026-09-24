'use strict';

/**
 * 🛡️ CyberShield X — Phase 81 Step 2: Outbound Connectors Acceptance Test Battery
 *
 * Verifies outbound connector adapters for Jira, ServiceNow, and PagerDuty:
 *  - Gate A: Jira Outbound Connector (create, update, test, validation, errors, masking)
 *  - Gate B: ServiceNow Outbound Connector (create, update, test, validation, errors, masking)
 *  - Gate C: PagerDuty Outbound Connector (trigger, update, test, validation, errors, masking)
 *  - Gate D: Security & Tenant Isolation (SSRF blocking, tenant mismatch, credential sanitization)
 *  - Gate E: Normalized Result Contract Conformance across all 3 providers
 *  - Gate F: Step 2 Boundaries & Anti-Scope-Creep Verification
 */

const mongoose = require('mongoose');
const {
  secureAxios,
  validateApiUrl,
  sanitizeError,
  verifyTenantOwnership,
  formatNormalizedResult,
} = require('../integrations/connectorUtils');

const {
  createJiraTicket,
  updateJiraTicket,
  testJiraConnection,
  jiraConnector,
} = require('../integrations/jira');

const {
  createServiceNowIncident,
  updateServiceNowIncident,
  testServiceNowConnection,
  serviceNowConnector,
} = require('../integrations/servicenow');

const {
  triggerPagerDutyIncident,
  updatePagerDutyIncident,
  testPagerDutyConnection,
  pagerDutyConnector,
} = require('../integrations/pagerduty');

describe('Phase 81 Step 2 — Outbound Connectors Acceptance Battery', () => {
  const orgA = new mongoose.Types.ObjectId().toString();
  const orgB = new mongoose.Types.ObjectId().toString();
  const integrationId = new mongoose.Types.ObjectId().toString();

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // GATE A: Jira Outbound Connector
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Gate A: Jira Outbound Connector', () => {
    const validJiraConfig = {
      baseUrl: 'https://acme-soc.atlassian.net',
      email: 'analyst@acme.com',
      apiToken: 'jira-secret-token-xyz',
      projectKey: 'SEC',
      issueType: 'Incident',
      organizationId: orgA,
      _id: integrationId,
    };

    test('A-01: Successful issue creation via normalized connector', async () => {
      jest.spyOn(secureAxios, 'post').mockResolvedValueOnce({
        data: { id: '10042', key: 'SEC-104', self: 'https://acme-soc.atlassian.net/rest/api/3/issue/10042' },
      });

      const result = await jiraConnector.createTicket(
        validJiraConfig,
        { title: 'Suspicious Lateral Movement', severity: 'HIGH', asset: 'SRV-DB-01', cve: 'CVE-2024-1234' }
      );

      expect(result.success).toBe(true);
      expect(result.provider).toBe('JIRA');
      expect(result.externalTicketId).toBe('10042');
      expect(result.externalTicketKey).toBe('SEC-104');
      expect(result.externalUrl).toBe('https://acme-soc.atlassian.net/browse/SEC-104');
      expect(result.externalStatus).toBe('Open');
      expect(result.operation).toBe('CREATE');
      expect(result.error).toBeNull();
    });

    test('A-02: Successful issue update (transition)', async () => {
      jest.spyOn(secureAxios, 'post').mockResolvedValueOnce({ data: {} });

      const result = await jiraConnector.updateTicket(
        validJiraConfig,
        'SEC-104',
        { transitionId: '31', transitionName: 'In Progress' }
      );

      expect(result.success).toBe(true);
      expect(result.provider).toBe('JIRA');
      expect(result.externalTicketKey).toBe('SEC-104');
      expect(result.externalStatus).toBe('In Progress');
      expect(result.operation).toBe('UPDATE');
    });

    test('A-03: Successful connection test', async () => {
      jest.spyOn(secureAxios, 'get').mockResolvedValueOnce({
        data: { name: 'Security Operations', key: 'SEC' },
      });

      const result = await jiraConnector.testConnection(validJiraConfig);
      expect(result.success).toBe(true);
      expect(result.externalTicketKey).toBe('SEC');
      expect(result.externalStatus).toBe('CONNECTED');
    });

    test('A-04: Rejects missing required configuration', async () => {
      const badConfig = { baseUrl: 'https://test.atlassian.net' };
      const result = await jiraConnector.createTicket(badConfig, { title: 'Test' });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error.code).toBe('JIRA_BAD_REQUEST');
      expect(result.error.message).toContain('missing required fields');
    });

    test('A-05: Handles upstream 401/403 authentication failure safely', async () => {
      const authErr = new Error('Request failed with status code 401');
      authErr.response = { status: 401 };
      jest.spyOn(secureAxios, 'post').mockRejectedValueOnce(authErr);

      const result = await jiraConnector.createTicket(validJiraConfig, { title: 'Test' });
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('JIRA_AUTHENTICATION_FAILED');
      expect(result.error.statusCode).toBe(401);
    });

    test('A-06: Handles upstream 500 server error', async () => {
      const serverErr = new Error('Internal Server Error');
      serverErr.response = { status: 500 };
      jest.spyOn(secureAxios, 'post').mockRejectedValueOnce(serverErr);

      const result = await jiraConnector.createTicket(validJiraConfig, { title: 'Test' });
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('JIRA_UPSTREAM_SERVER_ERROR');
      expect(result.error.statusCode).toBe(500);
    });

    test('A-07: Handles connection timeout', async () => {
      const timeoutErr = new Error('timeout of 10000ms exceeded');
      timeoutErr.code = 'ECONNABORTED';
      jest.spyOn(secureAxios, 'post').mockRejectedValueOnce(timeoutErr);

      const result = await jiraConnector.createTicket(validJiraConfig, { title: 'Test' });
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('JIRA_TIMEOUT');
    });

    test('A-08: Redacts credentials from error messages', async () => {
      const leakErr = new Error('Failed with Basic dXNlcjpwYXNzd29yZA== and api_token=super-secret');
      leakErr.response = { status: 400 };
      jest.spyOn(secureAxios, 'post').mockRejectedValueOnce(leakErr);

      const result = await jiraConnector.createTicket(validJiraConfig, { title: 'Test' });
      expect(result.success).toBe(false);
      expect(result.error.message).not.toContain('dXNlcjpwYXNzd29yZA==');
      expect(result.error.message).not.toContain('super-secret');
      expect(result.error.message).toContain('••••••••');
    });

    test('A-09: Legacy createJiraTicket export remains backward compatible', async () => {
      jest.spyOn(secureAxios, 'post').mockResolvedValueOnce({
        data: { id: '10043', key: 'SEC-105' },
      });

      const legacyResult = await createJiraTicket(validJiraConfig, { title: 'Legacy test' });
      expect(legacyResult.ticketKey).toBe('SEC-105');
      expect(legacyResult.issueId).toBe('10043');
      expect(legacyResult.url).toBe('https://acme-soc.atlassian.net/browse/SEC-105');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // GATE B: ServiceNow Outbound Connector
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Gate B: ServiceNow Outbound Connector', () => {
    const validSNConfig = {
      instanceUrl: 'https://dev98765.service-now.com',
      username: 'admin',
      password: 'sn-secure-password!',
      defaultTable: 'incident',
      organizationId: orgA,
      _id: integrationId,
    };

    test('B-01: Successful incident creation via Table API', async () => {
      jest.spyOn(secureAxios, 'post').mockResolvedValueOnce({
        data: {
          result: {
            sys_id: 'a1b2c3d4e5f6',
            number: 'INC0010042',
            state: '1',
          },
        },
      });

      const result = await serviceNowConnector.createTicket(
        validSNConfig,
        { title: 'Compromised Service Account', severity: 'CRITICAL', asset: 'AUTH-DC-01' }
      );

      expect(result.success).toBe(true);
      expect(result.provider).toBe('SERVICENOW');
      expect(result.externalTicketId).toBe('a1b2c3d4e5f6');
      expect(result.externalTicketKey).toBe('INC0010042');
      expect(result.externalUrl).toContain('incident.do?sys_id=a1b2c3d4e5f6');
      expect(result.externalStatus).toBe('New');
      expect(result.operation).toBe('CREATE');
    });

    test('B-02: Successful incident update via PATCH', async () => {
      jest.spyOn(secureAxios, 'patch').mockResolvedValueOnce({
        data: {
          result: {
            sys_id: 'a1b2c3d4e5f6',
            number: 'INC0010042',
            state: '6',
          },
        },
      });

      const result = await serviceNowConnector.updateTicket(
        validSNConfig,
        'a1b2c3d4e5f6',
        { workNotes: 'Threat eradicated.', state: 'Resolved' }
      );

      expect(result.success).toBe(true);
      expect(result.externalTicketId).toBe('a1b2c3d4e5f6');
      expect(result.externalTicketKey).toBe('INC0010042');
      expect(result.externalStatus).toBe('Resolved');
      expect(result.operation).toBe('UPDATE');
    });

    test('B-03: Successful connection test', async () => {
      jest.spyOn(secureAxios, 'get').mockResolvedValueOnce({
        data: { result: [{ sys_id: 'sample1' }] },
      });

      const result = await serviceNowConnector.testConnection(validSNConfig);
      expect(result.success).toBe(true);
      expect(result.externalStatus).toBe('CONNECTED');
    });

    test('B-04: Rejects missing required configuration', async () => {
      const badConfig = { instanceUrl: 'https://dev.service-now.com' };
      const result = await serviceNowConnector.createTicket(badConfig, { title: 'Test' });

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('SERVICENOW_BAD_REQUEST');
      expect(result.error.message).toContain('missing required fields');
    });

    test('B-05: Handles upstream 401 unauthorized', async () => {
      const authErr = new Error('Unauthorized');
      authErr.response = { status: 401 };
      jest.spyOn(secureAxios, 'post').mockRejectedValueOnce(authErr);

      const result = await serviceNowConnector.createTicket(validSNConfig, { title: 'Test' });
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('SERVICENOW_AUTHENTICATION_FAILED');
      expect(result.error.statusCode).toBe(401);
    });

    test('B-06: Handles upstream 503 service unavailable', async () => {
      const serverErr = new Error('Service Unavailable');
      serverErr.response = { status: 503 };
      jest.spyOn(secureAxios, 'post').mockRejectedValueOnce(serverErr);

      const result = await serviceNowConnector.createTicket(validSNConfig, { title: 'Test' });
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('SERVICENOW_UPSTREAM_SERVER_ERROR');
    });

    test('B-07: Handles connection timeout', async () => {
      const timeoutErr = new Error('timeout of 10000ms exceeded');
      timeoutErr.code = 'ETIMEDOUT';
      jest.spyOn(secureAxios, 'post').mockRejectedValueOnce(timeoutErr);

      const result = await serviceNowConnector.createTicket(validSNConfig, { title: 'Test' });
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('SERVICENOW_TIMEOUT');
    });

    test('B-08: Redacts password from error messages', async () => {
      const leakErr = new Error('Connection failed for user admin with password sn-secure-password!');
      leakErr.response = { status: 400 };
      jest.spyOn(secureAxios, 'post').mockRejectedValueOnce(leakErr);

      const result = await serviceNowConnector.createTicket(validSNConfig, { title: 'Test' });
      expect(result.success).toBe(false);
      expect(result.error.message).not.toContain('sn-secure-password!');
      expect(result.error.message).toContain('••••••••');
    });

    test('B-09: Direct createServiceNowIncident function exports work correctly', async () => {
      jest.spyOn(secureAxios, 'post').mockResolvedValueOnce({
        data: { result: { sys_id: 'sys123', number: 'INC0099' } },
      });

      const result = await createServiceNowIncident(validSNConfig, { title: 'Direct test' });
      expect(result.sysId).toBe('sys123');
      expect(result.number).toBe('INC0099');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // GATE C: PagerDuty Outbound Connector
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Gate C: PagerDuty Outbound Connector', () => {
    const validPDConfig = {
      routingKey: '1234567890abcdef1234567890abcdef',
      serviceId: 'PSVC123',
      organizationId: orgA,
      _id: integrationId,
    };

    test('C-01: Successful incident trigger via Events API v2', async () => {
      jest.spyOn(secureAxios, 'post').mockResolvedValueOnce({
        data: {
          status: 'success',
          message: 'Event processed',
          dedup_key: 'csx-incident-9901',
        },
      });

      const result = await pagerDutyConnector.createTicket(
        validPDConfig,
        { title: 'Critical Ransomware Outbreak', severity: 'CRITICAL', caseId: 'CASE-9901' }
      );

      expect(result.success).toBe(true);
      expect(result.provider).toBe('PAGERDUTY');
      expect(result.externalTicketId).toBe('csx-incident-9901');
      expect(result.externalTicketKey).toBe('csx-incident-9901');
      expect(result.externalUrl).toBe('https://app.pagerduty.com/services/PSVC123');
      expect(result.externalStatus).toBe('triggered');
      expect(result.operation).toBe('CREATE');
    });

    test('C-02: Successful incident resolve via Events API v2', async () => {
      jest.spyOn(secureAxios, 'post').mockResolvedValueOnce({
        data: { status: 'success', message: 'Event processed' },
      });

      const result = await pagerDutyConnector.updateTicket(
        validPDConfig,
        'csx-incident-9901',
        { action: 'resolve' }
      );

      expect(result.success).toBe(true);
      expect(result.provider).toBe('PAGERDUTY');
      expect(result.externalTicketKey).toBe('csx-incident-9901');
      expect(result.externalStatus).toBe('resolved');
      expect(result.operation).toBe('UPDATE');
    });

    test('C-03: Successful incident acknowledge via Events API v2', async () => {
      jest.spyOn(secureAxios, 'post').mockResolvedValueOnce({
        data: { status: 'success', message: 'Event processed' },
      });

      const result = await pagerDutyConnector.updateTicket(
        validPDConfig,
        'csx-incident-9901',
        { action: 'acknowledge' }
      );

      expect(result.success).toBe(true);
      expect(result.externalStatus).toBe('acknowledged');
    });

    test('C-04: Successful connection test with routingKey', async () => {
      const result = await pagerDutyConnector.testConnection(validPDConfig);
      expect(result.success).toBe(true);
      expect(result.externalStatus).toBe('CONNECTED');
    });

    test('C-05: Successful connection test with REST API apiToken', async () => {
      const restConfig = {
        apiToken: 'pd-api-token-test',
        serviceId: 'PSVC123',
        organizationId: orgA,
      };

      jest.spyOn(secureAxios, 'get').mockResolvedValueOnce({
        data: { abilities: ['schedules', 'teams'] },
      });

      const result = await pagerDutyConnector.testConnection(restConfig);
      expect(result.success).toBe(true);
      expect(result.externalStatus).toBe('CONNECTED');
    });

    test('C-06: Rejects configuration missing both routingKey and apiToken', async () => {
      const badConfig = { serviceId: 'PSVC' };
      const result = await pagerDutyConnector.createTicket(badConfig, { title: 'Test' });

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('PAGERDUTY_BAD_REQUEST');
      expect(result.error.message).toContain('missing required routingKey or apiToken');
    });

    test('C-07: Handles upstream 400 bad request (e.g. invalid routing key)', async () => {
      const badReq = new Error('Bad Request: Invalid routing_key');
      badReq.response = { status: 400 };
      jest.spyOn(secureAxios, 'post').mockRejectedValueOnce(badReq);

      const result = await pagerDutyConnector.createTicket(validPDConfig, { title: 'Test' });
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('PAGERDUTY_BAD_REQUEST');
      expect(result.error.statusCode).toBe(400);
    });

    test('C-08: Handles upstream 429 rate limiting', async () => {
      const rateLimitErr = new Error('Too Many Requests');
      rateLimitErr.response = { status: 429 };
      jest.spyOn(secureAxios, 'post').mockRejectedValueOnce(rateLimitErr);

      const result = await pagerDutyConnector.createTicket(validPDConfig, { title: 'Test' });
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('PAGERDUTY_RATE_LIMITED');
      expect(result.error.statusCode).toBe(429);
    });

    test('C-09: Direct triggerPagerDutyIncident export works correctly', async () => {
      jest.spyOn(secureAxios, 'post').mockResolvedValueOnce({
        data: { status: 'success', dedup_key: 'direct-123' },
      });

      const result = await triggerPagerDutyIncident(validPDConfig, { title: 'Direct PD' });
      expect(result.dedupKey).toBe('direct-123');
      expect(result.status).toBe('triggered');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // GATE D: Security & Tenant Isolation
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Gate D: Security & Tenant Isolation', () => {
    test('D-01: Cross-tenant invocation with forged context.organizationId is blocked', async () => {
      const configWithOrgA = {
        baseUrl: 'https://acme.atlassian.net',
        email: 'user@acme.com',
        apiToken: 'token',
        projectKey: 'SEC',
        organizationId: orgA,
      };

      // Attacker attempts to use Org A's integration with Org B's context
      const result = await jiraConnector.createTicket(
        configWithOrgA,
        { title: 'Attack', organizationId: orgB }
      );

      expect(result.success).toBe(false);
      expect(result.error.message).toContain('Tenant mismatch');
    });

    test('D-02: SSRF defense blocks loopback IP (127.0.0.1)', async () => {
      await expect(validateApiUrl('http://127.0.0.1:8080/jira', 'Jira')).rejects.toThrow(
        /private or loopback address/
      );
    });

    test('D-03: SSRF defense blocks private RFC 1918 IP (10.0.0.5)', async () => {
      await expect(validateApiUrl('https://10.0.0.5/api', 'ServiceNow')).rejects.toThrow(
        /private or loopback address/
      );
    });

    test('D-04: SSRF defense blocks cloud metadata (169.254.169.254)', async () => {
      await expect(validateApiUrl('http://169.254.169.254/latest/meta-data', 'Jira')).rejects.toThrow(
        /private or loopback address/
      );
    });

    test('D-05: SSRF defense blocks non-HTTP protocols (file:, ftp:, gopher:)', async () => {
      await expect(validateApiUrl('file:///etc/passwd', 'Jira')).rejects.toThrow(
        /must use http or https/
      );
      await expect(validateApiUrl('gopher://127.0.0.1:70', 'ServiceNow')).rejects.toThrow(
        /must use http or https/
      );
    });

    test('D-06: sanitizeError redacts Bearer tokens and Basic auth headers', () => {
      const err = new Error('HTTP 400 on Authorization: Bearer eyJhbGciOi... and Basic dXNlcjpwYXNz');
      const sanitized = sanitizeError(err, 'TEST');
      expect(sanitized.message).not.toContain('eyJhbGciOi...');
      expect(sanitized.message).not.toContain('dXNlcjpwYXNz');
      expect(sanitized.message).toContain('Bearer ••••••••');
      expect(sanitized.message).toContain('Basic ••••••••');
    });

    test('D-07: formatNormalizedResult produces an immutable object with zero credential leakage', () => {
      const normalized = formatNormalizedResult({
        success: true,
        provider: 'JIRA',
        integrationId: 'int-123',
        organizationId: 'org-456',
        externalTicketId: '10001',
        externalTicketKey: 'SEC-1',
        externalUrl: 'https://jira.com/browse/SEC-1',
        externalStatus: 'Open',
        operation: 'CREATE',
      });

      expect(Object.isFrozen(normalized)).toBe(true);
      expect(normalized).not.toHaveProperty('password');
      expect(normalized).not.toHaveProperty('apiToken');
      expect(normalized).not.toHaveProperty('token');
      expect(normalized).not.toHaveProperty('secret');
      expect(normalized).not.toHaveProperty('headers');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // GATE E: Normalized Result Contract Conformance
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Gate E: Normalized Result Contract Conformance', () => {
    const requiredContractKeys = [
      'success',
      'provider',
      'integrationId',
      'organizationId',
      'externalTicketId',
      'externalTicketKey',
      'externalUrl',
      'externalStatus',
      'operation',
      'timestamp',
      'error',
    ];

    test('E-01: Jira connector conforms to normalized contract keys', async () => {
      jest.spyOn(secureAxios, 'post').mockResolvedValueOnce({
        data: { id: '1', key: 'SEC-1' },
      });

      const result = await jiraConnector.createTicket(
        { baseUrl: 'https://jira.com', email: 'e', apiToken: 't', projectKey: 'P' },
        { title: 'T' }
      );

      requiredContractKeys.forEach(k => {
        expect(result).toHaveProperty(k);
      });
    });

    test('E-02: ServiceNow connector conforms to normalized contract keys', async () => {
      jest.spyOn(secureAxios, 'post').mockResolvedValueOnce({
        data: { result: { sys_id: 's', number: 'INC1' } },
      });

      const result = await serviceNowConnector.createTicket(
        { instanceUrl: 'https://sn.service-now.com', username: 'u', password: 'p' },
        { title: 'T' }
      );

      requiredContractKeys.forEach(k => {
        expect(result).toHaveProperty(k);
      });
    });

    test('E-03: PagerDuty connector conforms to normalized contract keys', async () => {
      jest.spyOn(secureAxios, 'post').mockResolvedValueOnce({
        data: { status: 'success', dedup_key: 'd' },
      });

      const result = await pagerDutyConnector.createTicket(
        { routingKey: 'rk-valid-key-1234567890' },
        { title: 'T' }
      );

      requiredContractKeys.forEach(k => {
        expect(result).toHaveProperty(k);
      });
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // GATE F: Step 2 Boundaries & Anti-Scope-Creep Verification
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Gate F: Step 2 Boundary Verification', () => {
    test('F-01: Outbound connectors do NOT import or mutate queueProvider or worker logic', () => {
      const fs = require('fs');
      const path = require('path');
      const integrationsDir = path.join(__dirname, '..', 'integrations');

      const jiraSrc = fs.readFileSync(path.join(integrationsDir, 'jira.js'), 'utf8');
      const snSrc = fs.readFileSync(path.join(integrationsDir, 'servicenow.js'), 'utf8');
      const pdSrc = fs.readFileSync(path.join(integrationsDir, 'pagerduty.js'), 'utf8');

      [jiraSrc, snSrc, pdSrc].forEach(src => {
        expect(src).not.toContain('queueProvider');
        expect(src).not.toContain('IntegrationWorker');
        expect(src).not.toContain('deadLetterQueue');
        expect(src).not.toContain('exponentialBackoff');
      });
    });

    test('F-02: Zero inbound webhook router files exist for ITSM yet (Step 4/5 boundary)', () => {
      const fs = require('fs');
      const path = require('path');
      const routesDir = path.join(__dirname, '..', 'routes');

      expect(fs.existsSync(path.join(routesDir, 'itsmWebhooks.js'))).toBe(false);
      expect(fs.existsSync(path.join(routesDir, 'itsm.js'))).toBe(false);
    });

    test('F-03: Zero ticket synchronization service files exist yet (Step 5 boundary)', () => {
      const fs = require('fs');
      const path = require('path');
      const servicesDir = path.join(__dirname, '..', 'services');

      expect(fs.existsSync(path.join(servicesDir, 'itsm'))).toBe(false);
    });
  });
});
