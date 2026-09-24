'use strict';

/**
 * 🛡️ CyberShield X — Jira Outbound Connector (Phase 81 Step 2)
 *
 * Provides Jira Cloud REST API v3 outbound integration:
 * - Issue/incident creation from CyberShield X cases and alerts
 * - Issue updates (status transitions, comments, and field updates)
 * - Connection testing via project retrieval
 * - Socket-level SSRF protection via connectorUtils.secureAxios & validateApiUrl
 * - Authoritative tenant isolation & secret sanitization
 * - Normalized outbound result contract conforming to Phase 81 Step 2
 * - 100% backward-compatible exports for existing callers
 */

const {
  secureAxios,
  validateApiUrl,
  sanitizeError,
  verifyTenantOwnership,
  formatNormalizedResult,
  recordOutboundSyncEvent,
} = require('./connectorUtils');

const JIRA_PRIORITY_MAP = {
  'P1-Critical': 'Highest',
  'P2-High': 'High',
  'P3-Medium': 'Medium',
  'P4-Low': 'Low',
  Critical: 'Highest',
  High: 'High',
  Medium: 'Medium',
  Low: 'Low',
  CRITICAL: 'Highest',
  HIGH: 'High',
  MEDIUM: 'Medium',
  LOW: 'Low',
};

/**
 * Validates Jira configuration object.
 */
function validateJiraConfig(config) {
  const { baseUrl, email, apiToken, projectKey } = config || {};
  if (!baseUrl || !email || !apiToken || !projectKey) {
    throw new Error('Jira integration missing required fields: baseUrl, email, apiToken, projectKey');
  }
}

/**
 * Builds HTTP Basic Auth header for Jira Cloud API.
 */
function getJiraAuthHeader(email, apiToken) {
  return `Basic ${Buffer.from(`${email}:${apiToken}`).toString('base64')}`;
}

/**
 * Normalizes baseUrl by removing trailing slashes.
 */
function normalizeBaseUrl(baseUrl) {
  return baseUrl.replace(/\/+$/, '');
}

/**
 * Legacy: Create Jira ticket (preserved for backward compatibility).
 */
const createJiraTicket = async (config, context = {}) => {
  validateJiraConfig(config);
  await validateApiUrl(config.baseUrl, 'Jira');

  const { baseUrl, email, apiToken, projectKey, issueType = 'Bug' } = config;
  const normalizedBase = normalizeBaseUrl(baseUrl);
  const auth = getJiraAuthHeader(email, apiToken);

  const issueBody = {
    fields: {
      project: { key: projectKey },
      issuetype: { name: issueType },
      summary: `[CyberShield X] ${context.title || context.cve || 'Security Finding'} — ${context.asset || 'Unknown Asset'}`,
      description: {
        version: 1,
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              { type: 'text', text: 'Security finding automatically detected by CyberShield X.\n\n' },
              { type: 'text', text: `CVE: ${context.cve || 'N/A'}\n` },
              { type: 'text', text: `Severity: ${context.severity || 'N/A'}\n` },
              { type: 'text', text: `Asset: ${context.asset || 'N/A'}\n` },
              { type: 'text', text: `SLA Status: ${context.slaStatus || 'N/A'}\n` },
              { type: 'text', text: `Risk Score: ${context.riskScore || 'N/A'}\n\n` },
              { type: 'text', text: context.description || 'Please investigate and remediate.' },
            ],
          },
        ],
      },
      priority: { name: JIRA_PRIORITY_MAP[context.priority] || JIRA_PRIORITY_MAP[context.severity] || 'Medium' },
      labels: ['cybershield', 'security', 'automated'],
    },
  };

  const response = await secureAxios.post(
    `${normalizedBase}/rest/api/3/issue`,
    issueBody,
    {
      headers: {
        Authorization: auth,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    }
  );

  const ticketKey = response.data.key;
  const ticketUrl = `${normalizedBase}/browse/${ticketKey}`;
  return { ticketKey, url: ticketUrl, issueId: response.data.id };
};

/**
 * Legacy: Test Jira connection (preserved for backward compatibility).
 */
const testJiraConnection = async (config) => {
  validateJiraConfig(config);
  await validateApiUrl(config.baseUrl, 'Jira');

  const { baseUrl, email, apiToken, projectKey } = config;
  const normalizedBase = normalizeBaseUrl(baseUrl);
  const auth = getJiraAuthHeader(email, apiToken);

  const response = await secureAxios.get(
    `${normalizedBase}/rest/api/3/project/${projectKey}`,
    {
      headers: { Authorization: auth, Accept: 'application/json' },
    }
  );
  return { project: response.data.name, key: response.data.key };
};

/**
 * Update Jira ticket (status transition, comment, or summary).
 *
 * @param {object} config - IntegrationConfig data
 * @param {string} ticketKey - Jira issue key (e.g. "SEC-104")
 * @param {object} updateData - Update payload (transitionId, comment, fields)
 * @param {object} context - Invocation context
 * @returns {Promise<object>} Result
 */
const updateJiraTicket = async (config, ticketKey, updateData = {}, context = {}) => {
  validateJiraConfig(config);
  if (!ticketKey || typeof ticketKey !== 'string') {
    throw new Error('Jira update missing ticketKey');
  }
  await validateApiUrl(config.baseUrl, 'Jira');

  const { baseUrl, email, apiToken } = config;
  const normalizedBase = normalizeBaseUrl(baseUrl);
  const auth = getJiraAuthHeader(email, apiToken);
  const headers = {
    Authorization: auth,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  let updatedStatus = updateData.externalStatus || null;

  // 1. Status Transition if transitionId provided
  if (updateData.transitionId) {
    await secureAxios.post(
      `${normalizedBase}/rest/api/3/issue/${encodeURIComponent(ticketKey)}/transitions`,
      { transition: { id: updateData.transitionId } },
      { headers }
    );
    updatedStatus = updateData.transitionName || updatedStatus || 'TRANSITIONED';
  }

  // 2. Add comment if provided
  if (updateData.comment) {
    const commentBody = {
      body: {
        version: 1,
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: `[CyberShield X] ${updateData.comment}` }],
          },
        ],
      },
    };
    await secureAxios.post(
      `${normalizedBase}/rest/api/3/issue/${encodeURIComponent(ticketKey)}/comment`,
      commentBody,
      { headers }
    );
  }

  // 3. Update issue fields if provided
  if (updateData.fields) {
    await secureAxios.put(
      `${normalizedBase}/rest/api/3/issue/${encodeURIComponent(ticketKey)}`,
      { fields: updateData.fields },
      { headers }
    );
  }

  const ticketUrl = `${normalizedBase}/browse/${ticketKey}`;
  return {
    ticketKey,
    url: ticketUrl,
    status: updatedStatus || 'UPDATED',
  };
};

// ═══════════════════════════════════════════════════════════════════════════════
// Phase 81 Step 2: Normalized Jira Connector Interface
// ═══════════════════════════════════════════════════════════════════════════════

const jiraConnector = {
  provider: 'JIRA',

  /**
   * Create an external ticket in Jira and return a normalized result.
   */
  async createTicket(config, context = {}, options = {}) {
    let orgId = null;
    const integrationId = config?._id || config?.id || options.integrationId || null;

    try {
      orgId = verifyTenantOwnership(config, context);
      const result = await createJiraTicket(config, context);

      const normalized = formatNormalizedResult({
        success: true,
        provider: 'JIRA',
        integrationId,
        organizationId: orgId,
        externalTicketId: result.issueId,
        externalTicketKey: result.ticketKey,
        externalUrl: result.url,
        externalStatus: 'Open',
        operation: 'CREATE',
      });

      if (options.recordAudit) {
        await recordOutboundSyncEvent({
          organizationId: orgId,
          integrationId,
          provider: 'JIRA',
          eventType: 'TICKET_CREATED',
          targetEntityType: context.targetEntityType || 'CASE',
          targetEntityId: context.caseId || context.incidentId || context.targetEntityId || 'UNKNOWN',
          externalTicketKey: result.ticketKey,
          payload: { ticketKey: result.ticketKey, issueId: result.issueId },
          status: 'SUCCESS',
        });
      }

      return normalized;
    } catch (err) {
      const sanitized = sanitizeError(err, 'JIRA');
      const normalized = formatNormalizedResult({
        success: false,
        provider: 'JIRA',
        integrationId,
        organizationId: orgId,
        operation: 'CREATE',
        error: sanitized,
      });

      if (options.recordAudit) {
        await recordOutboundSyncEvent({
          organizationId: orgId,
          integrationId,
          provider: 'JIRA',
          eventType: 'SYNC_FAILED',
          targetEntityType: context.targetEntityType || 'CASE',
          targetEntityId: context.caseId || context.incidentId || context.targetEntityId || 'UNKNOWN',
          payload: { error: sanitized.message },
          status: 'FAILED',
          errorMessage: sanitized.message,
        });
      }

      return normalized;
    }
  },

  /**
   * Update an external ticket in Jira and return a normalized result.
   */
  async updateTicket(config, ticketKey, updateData = {}, options = {}) {
    let orgId = null;
    const integrationId = config?._id || config?.id || options.integrationId || null;

    try {
      orgId = verifyTenantOwnership(config, options);
      const result = await updateJiraTicket(config, ticketKey, updateData, options);

      const normalized = formatNormalizedResult({
        success: true,
        provider: 'JIRA',
        integrationId,
        organizationId: orgId,
        externalTicketKey: result.ticketKey,
        externalUrl: result.url,
        externalStatus: result.status,
        operation: 'UPDATE',
      });

      if (options.recordAudit) {
        await recordOutboundSyncEvent({
          organizationId: orgId,
          integrationId,
          provider: 'JIRA',
          eventType: 'TICKET_UPDATED',
          targetEntityType: options.targetEntityType || 'CASE',
          targetEntityId: options.caseId || options.incidentId || options.targetEntityId || ticketKey,
          externalTicketKey: result.ticketKey,
          payload: updateData,
          status: 'SUCCESS',
        });
      }

      return normalized;
    } catch (err) {
      const sanitized = sanitizeError(err, 'JIRA');
      return formatNormalizedResult({
        success: false,
        provider: 'JIRA',
        integrationId,
        organizationId: orgId,
        externalTicketKey: ticketKey,
        operation: 'UPDATE',
        error: sanitized,
      });
    }
  },

  /**
   * Test Jira connection and return a normalized result.
   */
  async testConnection(config) {
    try {
      const result = await testJiraConnection(config);
      return formatNormalizedResult({
        success: true,
        provider: 'JIRA',
        integrationId: config._id || config.id || null,
        organizationId: config.organizationId ? String(config.organizationId) : null,
        externalTicketKey: result.key,
        externalStatus: 'CONNECTED',
        operation: 'TEST',
      });
    } catch (err) {
      const sanitized = sanitizeError(err, 'JIRA');
      return formatNormalizedResult({
        success: false,
        provider: 'JIRA',
        integrationId: config._id || config.id || null,
        organizationId: config.organizationId ? String(config.organizationId) : null,
        operation: 'TEST',
        error: sanitized,
      });
    }
  },
};

module.exports = {
  createJiraTicket,
  testJiraConnection,
  updateJiraTicket,
  jiraConnector,
};
