'use strict';

/**
 * 🛡️ CyberShield X — ServiceNow Outbound Connector (Phase 81 Step 2)
 *
 * Provides ServiceNow Table API outbound integration:
 * - Incident/case creation via Table API (POST /api/now/table/{tableName})
 * - Incident updates (PATCH /api/now/table/{tableName}/{sys_id})
 * - Connection testing via Table query (GET /api/now/table/{tableName}?sysparm_limit=1)
 * - Socket-level SSRF protection via connectorUtils.secureAxios & validateApiUrl
 * - Authoritative tenant isolation & secret sanitization
 * - Normalized outbound result contract conforming to Phase 81 Step 2
 */

const {
  secureAxios,
  validateApiUrl,
  sanitizeError,
  verifyTenantOwnership,
  formatNormalizedResult,
  recordOutboundSyncEvent,
} = require('./connectorUtils');

// ServiceNow standard Incident state numeric codes to labels
const SERVICENOW_STATE_MAP = {
  '1': 'New',
  '2': 'In Progress',
  '3': 'On Hold',
  '6': 'Resolved',
  '7': 'Closed',
  '8': 'Canceled',
  New: '1',
  'In Progress': '2',
  'On Hold': '3',
  Resolved: '6',
  Closed: '7',
  Canceled: '8',
};

// Urgency and Impact mappings from platform severity
const SEVERITY_TO_IMPACT_URGENCY = {
  CRITICAL: { impact: '1', urgency: '1' },
  HIGH: { impact: '1', urgency: '2' },
  MEDIUM: { impact: '2', urgency: '2' },
  LOW: { impact: '3', urgency: '3' },
  critical: { impact: '1', urgency: '1' },
  high: { impact: '1', urgency: '2' },
  medium: { impact: '2', urgency: '2' },
  low: { impact: '3', urgency: '3' },
};

/**
 * Validates ServiceNow configuration object.
 */
function validateServiceNowConfig(config) {
  const { instanceUrl, username, password } = config || {};
  if (!instanceUrl || !username || !password) {
    throw new Error('ServiceNow integration missing required fields: instanceUrl, username, password');
  }
}

/**
 * Builds HTTP Basic Auth header for ServiceNow Table API.
 */
function getServiceNowAuthHeader(username, password) {
  return `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;
}

/**
 * Normalizes instanceUrl by removing trailing slashes.
 */
function normalizeInstanceUrl(instanceUrl) {
  return instanceUrl.replace(/\/+$/, '');
}

/**
 * Resolves Table name, defaulting to 'incident'.
 */
function resolveTableName(config) {
  return config.defaultTable || 'incident';
}

/**
 * Create a ServiceNow incident via Table API.
 *
 * @param {object} config - IntegrationConfig data
 * @param {object} context - Case or Incident context
 * @returns {Promise<object>}
 */
const createServiceNowIncident = async (config, context = {}) => {
  validateServiceNowConfig(config);
  await validateApiUrl(config.instanceUrl, 'ServiceNow');

  const { instanceUrl, username, password, callerId } = config;
  const normalizedBase = normalizeInstanceUrl(instanceUrl);
  const auth = getServiceNowAuthHeader(username, password);
  const tableName = resolveTableName(config);

  const severityMapping = SEVERITY_TO_IMPACT_URGENCY[context.severity] || { impact: '2', urgency: '2' };

  const incidentBody = {
    short_description: `[CyberShield X] ${context.title || context.cve || 'Security Finding'} — ${context.asset || 'Target Asset'}`,
    description: [
      `Security finding automatically created by CyberShield X SOC platform.`,
      `CVE: ${context.cve || 'N/A'}`,
      `Severity: ${context.severity || 'N/A'}`,
      `Asset: ${context.asset || 'N/A'}`,
      `Case ID: ${context.caseId || 'N/A'}`,
      `SLA: ${context.slaStatus || 'N/A'}`,
      `Risk Score: ${context.riskScore || 'N/A'}`,
      `Details: ${context.description || 'Immediate analyst attention requested.'}`,
    ].join('\n'),
    impact: severityMapping.impact,
    urgency: severityMapping.urgency,
    category: 'Security',
    correlation_id: context.caseId || context.incidentId || undefined,
    ...(callerId ? { caller_id: callerId } : {}),
    ...(context.additionalFields || {}),
  };

  const response = await secureAxios.post(
    `${normalizedBase}/api/now/table/${encodeURIComponent(tableName)}`,
    incidentBody,
    {
      headers: {
        Authorization: auth,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    }
  );

  const result = response.data.result || response.data;
  const sysId = result.sys_id;
  const number = result.number || sysId;
  const directUrl = `${normalizedBase}/nav_to.do?uri=${encodeURIComponent(tableName)}.do?sys_id=${sysId}`;
  const stateLabel = SERVICENOW_STATE_MAP[result.state] || result.state || 'New';

  return {
    sysId,
    number,
    url: directUrl,
    state: stateLabel,
    rawState: result.state,
  };
};

/**
 * Update a ServiceNow incident via Table API (PATCH).
 *
 * @param {object} config - IntegrationConfig data
 * @param {string} sysId - ServiceNow sys_id
 * @param {object} updateData - Fields to update (work_notes, state, etc.)
 * @param {object} context - Invocation context
 * @returns {Promise<object>}
 */
const updateServiceNowIncident = async (config, sysId, updateData = {}, context = {}) => {
  validateServiceNowConfig(config);
  if (!sysId || typeof sysId !== 'string') {
    throw new Error('ServiceNow update missing sysId');
  }
  await validateApiUrl(config.instanceUrl, 'ServiceNow');

  const { instanceUrl, username, password } = config;
  const normalizedBase = normalizeInstanceUrl(instanceUrl);
  const auth = getServiceNowAuthHeader(username, password);
  const tableName = resolveTableName(config);

  const patchBody = {};
  if (updateData.workNotes || updateData.comment) {
    patchBody.work_notes = `[CyberShield X] ${updateData.workNotes || updateData.comment}`;
  }
  if (updateData.state) {
    patchBody.state = SERVICENOW_STATE_MAP[updateData.state] || updateData.state;
  }
  if (updateData.closeNotes) {
    patchBody.close_notes = updateData.closeNotes;
  }
  if (updateData.closeCode) {
    patchBody.close_code = updateData.closeCode;
  }
  if (updateData.fields && typeof updateData.fields === 'object') {
    Object.assign(patchBody, updateData.fields);
  }

  const response = await secureAxios.patch(
    `${normalizedBase}/api/now/table/${encodeURIComponent(tableName)}/${encodeURIComponent(sysId)}`,
    patchBody,
    {
      headers: {
        Authorization: auth,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    }
  );

  const result = response.data.result || response.data;
  const number = result.number || sysId;
  const directUrl = `${normalizedBase}/nav_to.do?uri=${encodeURIComponent(tableName)}.do?sys_id=${sysId}`;
  const stateLabel = SERVICENOW_STATE_MAP[result.state] || result.state || 'Updated';

  return {
    sysId,
    number,
    url: directUrl,
    state: stateLabel,
  };
};

/**
 * Test ServiceNow connection by querying 1 record from table.
 *
 * @param {object} config - IntegrationConfig data
 * @returns {Promise<object>}
 */
const testServiceNowConnection = async (config) => {
  validateServiceNowConfig(config);
  await validateApiUrl(config.instanceUrl, 'ServiceNow');

  const { instanceUrl, username, password } = config;
  const normalizedBase = normalizeInstanceUrl(instanceUrl);
  const auth = getServiceNowAuthHeader(username, password);
  const tableName = resolveTableName(config);

  const response = await secureAxios.get(
    `${normalizedBase}/api/now/table/${encodeURIComponent(tableName)}?sysparm_limit=1`,
    {
      headers: { Authorization: auth, Accept: 'application/json' },
    }
  );

  const recordCount = Array.isArray(response.data.result) ? response.data.result.length : 0;
  return { connected: true, table: tableName, sampleRecordsFound: recordCount };
};

// ═══════════════════════════════════════════════════════════════════════════════
// Phase 81 Step 2: Normalized ServiceNow Connector Interface
// ═══════════════════════════════════════════════════════════════════════════════

const serviceNowConnector = {
  provider: 'SERVICENOW',

  /**
   * Create an external ticket in ServiceNow and return a normalized result.
   */
  async createTicket(config, context = {}, options = {}) {
    let orgId = null;
    const integrationId = config?._id || config?.id || options.integrationId || null;

    try {
      orgId = verifyTenantOwnership(config, context);
      const result = await createServiceNowIncident(config, context);

      const normalized = formatNormalizedResult({
        success: true,
        provider: 'SERVICENOW',
        integrationId,
        organizationId: orgId,
        externalTicketId: result.sysId,
        externalTicketKey: result.number,
        externalUrl: result.url,
        externalStatus: result.state,
        operation: 'CREATE',
      });

      if (options.recordAudit) {
        await recordOutboundSyncEvent({
          organizationId: orgId,
          integrationId,
          provider: 'SERVICENOW',
          eventType: 'TICKET_CREATED',
          targetEntityType: context.targetEntityType || 'CASE',
          targetEntityId: context.caseId || context.incidentId || context.targetEntityId || 'UNKNOWN',
          externalTicketKey: result.number,
          payload: { sysId: result.sysId, number: result.number },
          status: 'SUCCESS',
        });
      }

      return normalized;
    } catch (err) {
      const sanitized = sanitizeError(err, 'SERVICENOW');
      const normalized = formatNormalizedResult({
        success: false,
        provider: 'SERVICENOW',
        integrationId,
        organizationId: orgId,
        operation: 'CREATE',
        error: sanitized,
      });

      if (options.recordAudit) {
        await recordOutboundSyncEvent({
          organizationId: orgId,
          integrationId,
          provider: 'SERVICENOW',
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
   * Update an external ticket in ServiceNow and return a normalized result.
   */
  async updateTicket(config, sysId, updateData = {}, options = {}) {
    let orgId = null;
    const integrationId = config?._id || config?.id || options.integrationId || null;

    try {
      orgId = verifyTenantOwnership(config, options);
      const result = await updateServiceNowIncident(config, sysId, updateData, options);

      const normalized = formatNormalizedResult({
        success: true,
        provider: 'SERVICENOW',
        integrationId,
        organizationId: orgId,
        externalTicketId: result.sysId,
        externalTicketKey: result.number,
        externalUrl: result.url,
        externalStatus: result.state,
        operation: 'UPDATE',
      });

      if (options.recordAudit) {
        await recordOutboundSyncEvent({
          organizationId: orgId,
          integrationId,
          provider: 'SERVICENOW',
          eventType: 'TICKET_UPDATED',
          targetEntityType: options.targetEntityType || 'CASE',
          targetEntityId: options.caseId || options.incidentId || options.targetEntityId || sysId,
          externalTicketKey: result.number,
          payload: updateData,
          status: 'SUCCESS',
        });
      }

      return normalized;
    } catch (err) {
      const sanitized = sanitizeError(err, 'SERVICENOW');
      return formatNormalizedResult({
        success: false,
        provider: 'SERVICENOW',
        integrationId,
        organizationId: orgId,
        externalTicketId: sysId,
        operation: 'UPDATE',
        error: sanitized,
      });
    }
  },

  /**
   * Test ServiceNow connection and return a normalized result.
   */
  async testConnection(config) {
    try {
      const result = await testServiceNowConnection(config);
      return formatNormalizedResult({
        success: true,
        provider: 'SERVICENOW',
        integrationId: config._id || config.id || null,
        organizationId: config.organizationId ? String(config.organizationId) : null,
        externalStatus: 'CONNECTED',
        operation: 'TEST',
      });
    } catch (err) {
      const sanitized = sanitizeError(err, 'SERVICENOW');
      return formatNormalizedResult({
        success: false,
        provider: 'SERVICENOW',
        integrationId: config._id || config.id || null,
        organizationId: config.organizationId ? String(config.organizationId) : null,
        operation: 'TEST',
        error: sanitized,
      });
    }
  },
};

module.exports = {
  createServiceNowIncident,
  updateServiceNowIncident,
  testServiceNowConnection,
  serviceNowConnector,
};
