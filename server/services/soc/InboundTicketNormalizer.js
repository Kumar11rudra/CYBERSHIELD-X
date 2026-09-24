'use strict';

/**
 * 🛡️ CyberShield X — Inbound Ticket Normalizer (Phase 81 Step 5)
 *
 * Normalizes provider-specific authenticated webhook data into a deterministic,
 * canonical structure for inbound ticket reconciliation.
 *
 * Supported providers:
 * - JIRA: issue.id, issue.key, status, webhookEvent, timestamp
 * - SERVICENOW: sys_id, number, state, event, sys_updated_on
 * - PAGERDUTY: event.data.id, event.data.number, status, event_type, occurred_at
 * - GENERIC: ticketId, ticketKey, status, eventType, timestamp
 *
 * Security guarantees:
 * - Strips raw bodies, cookies, Authorization headers, tokens, and secrets
 * - Computes SHA-256 payloadHash from exact raw request bytes where available
 * - Fails closed if ticket identity is absent
 */

const crypto = require('crypto');
const { hashPayload } = require('../../integrations/connectorUtils');

// ServiceNow standard Incident state numeric codes to labels
const SERVICENOW_STATE_MAP = {
  '1': 'New',
  '2': 'In Progress',
  '3': 'On Hold',
  '6': 'Resolved',
  '7': 'Closed',
  '8': 'Canceled',
};

class InboundTicketNormalizer {
  /**
   * Normalizes an authenticated incoming webhook request.
   *
   * @param {object} req - Express request object
   * @param {string} provider - Provider name ('JIRA', 'SERVICENOW', 'PAGERDUTY', 'GENERIC', etc.)
   * @param {object} [config] - IntegrationConfig document
   * @returns {object} Canonical normalized event or validation error
   */
  normalize(req, provider, config = {}) {
    if (!req || typeof req !== 'object') {
      return { valid: false, error: 'INVALID_REQUEST', reason: 'Request object is required' };
    }

    const rawProvider = String(provider || config?.type || '').toUpperCase();
    const canonicalProvider = rawProvider === 'WEBHOOK' ? 'GENERIC' : rawProvider;

    if (!['JIRA', 'SERVICENOW', 'PAGERDUTY', 'GENERIC'].includes(canonicalProvider)) {
      return {
        valid: false,
        error: 'UNSUPPORTED_PROVIDER',
        reason: `Provider '${canonicalProvider}' is not supported for inbound reconciliation`,
      };
    }

    const body = req.body && typeof req.body === 'object' ? req.body : {};

    // Calculate deterministic SHA-256 payload hash
    const rawBodyBuffer =
      Buffer.isBuffer(req.rawBody) ? req.rawBody :
      typeof req.rawBody === 'string' ? Buffer.from(req.rawBody, 'utf8') : null;

    const payloadHash = rawBodyBuffer && rawBodyBuffer.length > 0
      ? crypto.createHash('sha256').update(rawBodyBuffer).digest('hex')
      : hashPayload(body);

    let parsed;
    try {
      switch (canonicalProvider) {
        case 'JIRA':
          parsed = this._normalizeJira(body, req);
          break;
        case 'SERVICENOW':
          parsed = this._normalizeServiceNow(body, req);
          break;
        case 'PAGERDUTY':
          parsed = this._normalizePagerDuty(body, req);
          break;
        case 'GENERIC':
          parsed = this._normalizeGeneric(body, req);
          break;
        default:
          return { valid: false, error: 'UNSUPPORTED_PROVIDER' };
      }
    } catch (err) {
      return {
        valid: false,
        error: 'MALFORMED_PAYLOAD',
        reason: `Failed to parse ${canonicalProvider} payload: ${err.message}`,
      };
    }

    // Identity validation: must have at least externalTicketId or externalTicketKey
    if (!parsed.externalTicketId && !parsed.externalTicketKey) {
      return {
        valid: false,
        error: 'MISSING_TICKET_IDENTITY',
        reason: `Payload for provider '${canonicalProvider}' does not contain an external ticket ID or key`,
      };
    }

    return {
      valid: true,
      provider: canonicalProvider,
      integrationId: config?._id ? String(config._id) : null,
      organizationId: config?.organizationId ? String(config.organizationId) : null,
      externalTicketId: parsed.externalTicketId ? String(parsed.externalTicketId).trim() : null,
      externalTicketKey: parsed.externalTicketKey ? String(parsed.externalTicketKey).trim() : null,
      externalStatus: parsed.externalStatus ? String(parsed.externalStatus).trim() : null,
      eventType: parsed.eventType || `${canonicalProvider.toLowerCase()}:event`,
      eventId: parsed.eventId || null,
      occurredAt: parsed.occurredAt instanceof Date && !isNaN(parsed.occurredAt) ? parsed.occurredAt : new Date(),
      payloadHash,
      source: 'INBOUND_WEBHOOK',
    };
  }

  /**
   * Normalizes Jira webhook payloads.
   * Expected structures:
   * - body.issue: { id, key, fields: { status: { name }, updated } }
   * - body.webhookEvent: 'jira:issue_updated', 'jira:issue_created', etc.
   *
   * @private
   */
  _normalizeJira(body, req) {
    const issue = body.issue && typeof body.issue === 'object' ? body.issue : {};

    const externalTicketId = issue.id || body.id || null;
    const externalTicketKey = issue.key || body.key || null;

    let externalStatus = null;
    if (issue.fields && typeof issue.fields === 'object') {
      if (issue.fields.status && issue.fields.status.name) {
        externalStatus = issue.fields.status.name;
      } else if (issue.fields.resolution && issue.fields.resolution.name) {
        externalStatus = issue.fields.resolution.name;
      }
    }
    if (!externalStatus && body.status) {
      externalStatus = typeof body.status === 'string' ? body.status : body.status.name || null;
    }

    const eventType = body.webhookEvent || body.issue_event_type_name || 'jira:issue_updated';
    const eventId =
      req?.headers?.['x-atlassian-webhook-identifier'] ||
      (body.timestamp ? String(body.timestamp) : null);

    let occurredAt = new Date();
    if (body.timestamp) {
      const num = Number(body.timestamp);
      if (!isNaN(num)) occurredAt = new Date(num < 10000000000 ? num * 1000 : num);
    } else if (issue?.fields?.updated) {
      const d = new Date(issue.fields.updated);
      if (!isNaN(d.getTime())) occurredAt = d;
    }

    return {
      externalTicketId,
      externalTicketKey,
      externalStatus,
      eventType,
      eventId,
      occurredAt,
    };
  }

  /**
   * Normalizes ServiceNow webhook payloads.
   * Expected structures:
   * - body: { sys_id, number, state, incident_state, sys_updated_on }
   * - or nested inside body.result or body.record
   *
   * @private
   */
  _normalizeServiceNow(body, req) {
    const record =
      body.result && typeof body.result === 'object' ? body.result :
      body.record && typeof body.record === 'object' ? body.record :
      body;

    const externalTicketId = record.sys_id || record.id || null;
    const externalTicketKey = record.number || externalTicketId || null;

    let externalStatus = null;
    const rawState = record.state !== undefined ? record.state : record.incident_state;
    if (rawState !== undefined && rawState !== null) {
      const stateStr = String(rawState).trim();
      externalStatus = SERVICENOW_STATE_MAP[stateStr] || stateStr;
    } else if (record.stage) {
      externalStatus = String(record.stage).trim();
    } else if (record.status) {
      externalStatus = String(record.status).trim();
    }

    const eventType = body.event || body.action || record.event || 'servicenow:incident_updated';
    const eventId = req?.headers?.['x-request-id'] || externalTicketId || null;

    let occurredAt = new Date();
    if (record.sys_updated_on) {
      const d = new Date(record.sys_updated_on);
      if (!isNaN(d.getTime())) occurredAt = d;
    }

    return {
      externalTicketId,
      externalTicketKey,
      externalStatus,
      eventType,
      eventId,
      occurredAt,
    };
  }

  /**
   * Normalizes PagerDuty webhook payloads (v3 Event API & v2 legacy).
   * Expected structures:
   * - body.event: { id, event_type, occurred_at, data: { id, number, status } }
   * - body.messages[0].incident: { id, incident_number, status }
   *
   * @private
   */
  _normalizePagerDuty(body, req) {
    let data = {};
    let eventWrapper = null;

    if (body.event && typeof body.event === 'object') {
      eventWrapper = body.event;
      data = eventWrapper.data && typeof eventWrapper.data === 'object' ? eventWrapper.data : {};
    } else if (Array.isArray(body.messages) && body.messages[0]?.incident) {
      data = body.messages[0].incident;
      eventWrapper = body.messages[0];
    } else if (body.incident && typeof body.incident === 'object') {
      data = body.incident;
    } else {
      data = body;
    }

    const externalTicketId = data.id || data.dedup_key || body.dedup_key || null;
    const externalTicketKey =
      data.number !== undefined ? String(data.number) :
      data.incident_number !== undefined ? String(data.incident_number) :
      (data.id || externalTicketId || null);

    const externalStatus = data.status || eventWrapper?.event_type || body.status || null;
    const eventType = eventWrapper?.event_type || 'pagerduty:incident_updated';
    const eventId = eventWrapper?.id || req?.headers?.['x-pagerduty-webhook-id'] || null;

    let occurredAt = new Date();
    if (eventWrapper?.occurred_at) {
      const d = new Date(eventWrapper.occurred_at);
      if (!isNaN(d.getTime())) occurredAt = d;
    }

    return {
      externalTicketId,
      externalTicketKey,
      externalStatus,
      eventType,
      eventId,
      occurredAt,
    };
  }

  /**
   * Normalizes Generic / Webhook payloads.
   * Expected structures:
   * - body: { ticketId, ticketKey, status, eventType, timestamp }
   *
   * @private
   */
  _normalizeGeneric(body, req) {
    const externalTicketId = body.ticketId || body.id || body.ticket_id || null;
    const externalTicketKey = body.ticketKey || body.key || body.ticket_key || externalTicketId || null;
    const externalStatus = body.status || body.externalStatus || body.state || null;
    const eventType = body.eventType || body.event || 'generic:webhook';
    const eventId = body.eventId || req?.headers?.['x-webhook-id'] || null;

    let occurredAt = new Date();
    if (body.timestamp) {
      const d = new Date(body.timestamp);
      if (!isNaN(d.getTime())) occurredAt = d;
    }

    return {
      externalTicketId,
      externalTicketKey,
      externalStatus,
      eventType,
      eventId,
      occurredAt,
    };
  }
}

module.exports = new InboundTicketNormalizer();
