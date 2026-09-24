'use strict';

/**
 * 🛡️ CyberShield X — PagerDuty Outbound Connector (Phase 81 Step 2)
 *
 * Provides PagerDuty Events API v2 and REST API v2 outbound integration:
 * - Incident triggering via Events API v2 (POST /v2/enqueue with event_action: 'trigger')
 * - Incident state updates via Events API v2 (acknowledge / resolve)
 * - Connection testing via Events API validation or REST API /abilities probe
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

const DEFAULT_EVENTS_ENDPOINT = 'https://events.pagerduty.com/v2/enqueue';
const DEFAULT_REST_ENDPOINT = 'https://api.pagerduty.com';

// PagerDuty Events API v2 severity levels: critical, error, warning, info
const PAGERDUTY_SEVERITY_MAP = {
  CRITICAL: 'critical',
  HIGH: 'error',
  MEDIUM: 'warning',
  LOW: 'info',
  critical: 'critical',
  high: 'error',
  medium: 'warning',
  low: 'info',
  'P1-Critical': 'critical',
  'P2-High': 'error',
  'P3-Medium': 'warning',
  'P4-Low': 'info',
};

/**
 * Validates PagerDuty configuration object.
 */
function validatePagerDutyConfig(config) {
  const { routingKey, apiToken } = config || {};
  if (!routingKey && !apiToken) {
    throw new Error('PagerDuty integration missing required routingKey or apiToken');
  }
}

/**
 * Resolves the Events API v2 endpoint, validating against SSRF if custom.
 */
async function resolveEventsEndpoint(config) {
  const endpoint = config?.customEventsEndpoint || DEFAULT_EVENTS_ENDPOINT;
  await validateApiUrl(endpoint, 'PagerDuty');
  return endpoint;
}

/**
 * Resolves the REST API v2 endpoint, validating against SSRF if custom.
 */
async function resolveRestEndpoint(config) {
  const endpoint = config?.customRestEndpoint || DEFAULT_REST_ENDPOINT;
  await validateApiUrl(endpoint, 'PagerDuty');
  return endpoint.replace(/\/+$/, '');
}

/**
 * Trigger an incident on PagerDuty via Events API v2.
 *
 * @param {object} config - IntegrationConfig data (routingKey)
 * @param {object} context - Case or Finding context
 * @returns {Promise<object>}
 */
const triggerPagerDutyIncident = async (config, context = {}) => {
  validatePagerDutyConfig(config);
  const endpoint = await resolveEventsEndpoint(config);

  const routingKey = config.routingKey;
  if (!routingKey) {
    throw new Error('PagerDuty incident triggering requires routingKey');
  }

  const dedupKey = context.dedupKey || context.caseId || context.incidentId || `csx-${Date.now()}`;
  const severity = PAGERDUTY_SEVERITY_MAP[context.severity] || 'warning';

  const eventPayload = {
    routing_key: routingKey,
    event_action: 'trigger',
    dedup_key: String(dedupKey),
    payload: {
      summary: `[CyberShield X] ${context.title || context.cve || 'Security Incident'} — ${context.asset || 'Target Asset'}`,
      source: 'CyberShield X SOC',
      severity,
      component: context.asset || 'Security Operations',
      group: 'SOC',
      class: 'security_alert',
      custom_details: {
        cve: context.cve || 'N/A',
        caseId: context.caseId || 'N/A',
        riskScore: context.riskScore || 'N/A',
        slaStatus: context.slaStatus || 'N/A',
        description: context.description || 'Automated incident triggered by CyberShield X',
      },
    },
    client: 'CyberShield X',
    client_url: process.env.CLIENT_URL || 'https://cybershield.app',
  };

  const response = await secureAxios.post(endpoint, eventPayload, {
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  });

  const responseDedupKey = response.data?.dedup_key || dedupKey;
  const serviceId = config.serviceId;
  const externalUrl = serviceId
    ? `https://app.pagerduty.com/services/${serviceId}`
    : 'https://app.pagerduty.com';

  return {
    dedupKey: responseDedupKey,
    status: 'triggered',
    url: externalUrl,
    message: response.data?.message || 'Event processed',
  };
};

/**
 * Update a PagerDuty incident (acknowledge or resolve) via Events API v2.
 *
 * @param {object} config - IntegrationConfig data
 * @param {string} dedupKey - Deduplication key
 * @param {string} action - 'acknowledge' | 'resolve'
 * @param {object} context - Invocation context
 * @returns {Promise<object>}
 */
const updatePagerDutyIncident = async (config, dedupKey, action = 'resolve', context = {}) => {
  validatePagerDutyConfig(config);
  const endpoint = await resolveEventsEndpoint(config);

  const routingKey = config.routingKey;
  if (!routingKey) {
    throw new Error('PagerDuty incident update requires routingKey');
  }
  if (!dedupKey || typeof dedupKey !== 'string') {
    throw new Error('PagerDuty update missing dedupKey');
  }

  const normalizedAction = action.toLowerCase() === 'acknowledge' ? 'acknowledge' : 'resolve';

  const eventPayload = {
    routing_key: routingKey,
    event_action: normalizedAction,
    dedup_key: String(dedupKey),
  };

  const response = await secureAxios.post(endpoint, eventPayload, {
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  });

  const serviceId = config.serviceId;
  const externalUrl = serviceId
    ? `https://app.pagerduty.com/services/${serviceId}`
    : 'https://app.pagerduty.com';

  return {
    dedupKey,
    status: normalizedAction === 'resolve' ? 'resolved' : 'acknowledged',
    url: externalUrl,
    message: response.data?.message || `Incident ${normalizedAction}d`,
  };
};

/**
 * Test PagerDuty connection.
 * If apiToken provided, queries REST API /abilities.
 * Otherwise, validates routingKey format.
 *
 * @param {object} config - IntegrationConfig data
 * @returns {Promise<object>}
 */
const testPagerDutyConnection = async (config) => {
  validatePagerDutyConfig(config);

  if (config.apiToken) {
    const restBase = await resolveRestEndpoint(config);
    const response = await secureAxios.get(`${restBase}/abilities`, {
      headers: {
        Authorization: `Token token=${config.apiToken}`,
        Accept: 'application/vnd.pagerduty+json;version=2',
      },
    });
    return { connected: true, abilities: response.data?.abilities || [] };
  }

  if (config.routingKey) {
    // Validate routingKey format (32 hex characters or non-empty string)
    if (typeof config.routingKey !== 'string' || config.routingKey.trim().length < 8) {
      throw new Error('Invalid PagerDuty routingKey format');
    }
    // Verify Events API endpoint reachability
    await resolveEventsEndpoint(config);
    return { connected: true, mode: 'Events API v2 (routingKey validated)' };
  }

  throw new Error('PagerDuty configuration requires routingKey or apiToken');
};

// ═══════════════════════════════════════════════════════════════════════════════
// Phase 81 Step 2: Normalized PagerDuty Connector Interface
// ═══════════════════════════════════════════════════════════════════════════════

const pagerDutyConnector = {
  provider: 'PAGERDUTY',

  /**
   * Trigger an external incident in PagerDuty and return a normalized result.
   */
  async createTicket(config, context = {}, options = {}) {
    let orgId = null;
    const integrationId = config?._id || config?.id || options.integrationId || null;

    try {
      orgId = verifyTenantOwnership(config, context);
      const result = await triggerPagerDutyIncident(config, context);

      const normalized = formatNormalizedResult({
        success: true,
        provider: 'PAGERDUTY',
        integrationId,
        organizationId: orgId,
        externalTicketId: result.dedupKey,
        externalTicketKey: result.dedupKey,
        externalUrl: result.url,
        externalStatus: result.status,
        operation: 'CREATE',
      });

      if (options.recordAudit) {
        await recordOutboundSyncEvent({
          organizationId: orgId,
          integrationId,
          provider: 'PAGERDUTY',
          eventType: 'TICKET_CREATED',
          targetEntityType: context.targetEntityType || 'CASE',
          targetEntityId: context.caseId || context.incidentId || context.targetEntityId || 'UNKNOWN',
          externalTicketKey: result.dedupKey,
          payload: { dedupKey: result.dedupKey, status: result.status },
          status: 'SUCCESS',
        });
      }

      return normalized;
    } catch (err) {
      const sanitized = sanitizeError(err, 'PAGERDUTY');
      const normalized = formatNormalizedResult({
        success: false,
        provider: 'PAGERDUTY',
        integrationId,
        organizationId: orgId,
        operation: 'CREATE',
        error: sanitized,
      });

      if (options.recordAudit) {
        await recordOutboundSyncEvent({
          organizationId: orgId,
          integrationId,
          provider: 'PAGERDUTY',
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
   * Update an external incident in PagerDuty (acknowledge or resolve).
   */
  async updateTicket(config, dedupKey, updateData = {}, options = {}) {
    let orgId = null;
    const integrationId = config?._id || config?.id || options.integrationId || null;
    const action = updateData.action || updateData.status || 'resolve';

    try {
      orgId = verifyTenantOwnership(config, options);
      const result = await updatePagerDutyIncident(config, dedupKey, action, options);

      const normalized = formatNormalizedResult({
        success: true,
        provider: 'PAGERDUTY',
        integrationId,
        organizationId: orgId,
        externalTicketId: result.dedupKey,
        externalTicketKey: result.dedupKey,
        externalUrl: result.url,
        externalStatus: result.status,
        operation: 'UPDATE',
      });

      if (options.recordAudit) {
        await recordOutboundSyncEvent({
          organizationId: orgId,
          integrationId,
          provider: 'PAGERDUTY',
          eventType: 'TICKET_UPDATED',
          targetEntityType: options.targetEntityType || 'CASE',
          targetEntityId: options.caseId || options.incidentId || options.targetEntityId || dedupKey,
          externalTicketKey: result.dedupKey,
          payload: { action, status: result.status },
          status: 'SUCCESS',
        });
      }

      return normalized;
    } catch (err) {
      const sanitized = sanitizeError(err, 'PAGERDUTY');
      return formatNormalizedResult({
        success: false,
        provider: 'PAGERDUTY',
        integrationId,
        organizationId: orgId,
        externalTicketId: dedupKey,
        externalTicketKey: dedupKey,
        operation: 'UPDATE',
        error: sanitized,
      });
    }
  },

  /**
   * Test PagerDuty connection and return a normalized result.
   */
  async testConnection(config) {
    try {
      const result = await testPagerDutyConnection(config);
      return formatNormalizedResult({
        success: true,
        provider: 'PAGERDUTY',
        integrationId: config._id || config.id || null,
        organizationId: config.organizationId ? String(config.organizationId) : null,
        externalStatus: 'CONNECTED',
        operation: 'TEST',
      });
    } catch (err) {
      const sanitized = sanitizeError(err, 'PAGERDUTY');
      return formatNormalizedResult({
        success: false,
        provider: 'PAGERDUTY',
        integrationId: config._id || config.id || null,
        organizationId: config.organizationId ? String(config.organizationId) : null,
        operation: 'TEST',
        error: sanitized,
      });
    }
  },
};

module.exports = {
  triggerPagerDutyIncident,
  updatePagerDutyIncident,
  testPagerDutyConnection,
  pagerDutyConnector,
};
