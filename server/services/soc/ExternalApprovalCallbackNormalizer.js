'use strict';

/**
 * 🛡️ CyberShield X — External Approval Callback Normalizer (Phase 81 Step 6)
 *
 * Normalizes provider-specific authenticated webhook data into a canonical
 * internal structure for external approval callback reconciliation.
 *
 * Supported providers:
 * - JIRA: issue approval / reject webhooks, custom approval events
 * - SERVICENOW: sysapproval_approver state changes, incident approval events
 * - PAGERDUTY: custom actions, incident acknowledgment/resolution callbacks
 * - GENERIC: structured approval callbacks (approvalId, decision, reason, actor)
 *
 * Security & Integrity Guarantees:
 * - Strips raw bodies, cookies, Authorization headers, tokens, and secrets
 * - Computes SHA-256 payloadHash directly from exact raw request bytes where available
 * - Fails closed if approval identity (approvalId or externalReference) is absent
 * - Normalizes decisions strictly to canonical Phase 77 states ('APPROVED' | 'DENIED')
 */

const crypto = require('crypto');
const { hashPayload } = require('../../integrations/connectorUtils');

// Decision mappings
const DECISION_APPROVED_VARIANTS = Object.freeze([
  'approved',
  'approve',
  'accepted',
  'accept',
  'authorized',
  'authorize',
]);

const DECISION_REJECTED_VARIANTS = Object.freeze([
  'rejected',
  'reject',
  'denied',
  'deny',
  'declined',
  'decline',
  'disapproved',
  'disapprove',
]);

class ExternalApprovalCallbackNormalizer {
  /**
   * Deterministically evaluates whether an inbound webhook request represents
   * an external approval callback vs ordinary ticket synchronization.
   *
   * @param {object} req - Express request
   * @param {string} provider - Provider name
   * @returns {boolean} True if the request is an approval callback
   */
  isApprovalCallback(req, provider) {
    if (!req || typeof req !== 'object') return false;

    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const rawProvider = String(provider || '').toUpperCase();
    const canonicalProvider = rawProvider === 'WEBHOOK' ? 'GENERIC' : rawProvider;

    // 1. Direct explicit approval keys in payload
    if (
      body.approvalId ||
      body.approval_id ||
      body.pendingApprovalId ||
      body.approvalDecision ||
      body.approval_decision ||
      body.isApprovalCallback === true
    ) {
      return true;
    }

    // 2. Generic webhook approval indicators
    if (canonicalProvider === 'GENERIC') {
      const eventType = String(body.eventType || body.event || '').toLowerCase();
      if (eventType.includes('approval') || eventType.includes('decision')) {
        return true;
      }
      if (body.decision && (body.id || body.ticketKey || body.correlationId || body.reference)) {
        return true;
      }
    }

    // 3. Jira approval event indicators
    if (canonicalProvider === 'JIRA') {
      const webhookEvent = String(body.webhookEvent || body.issue_event_type_name || '').toLowerCase();
      if (webhookEvent.includes('approval') || webhookEvent.includes('action_executed')) {
        return true;
      }
      if (body.approval || (body.decision && (body.issue || body.id || body.key))) {
        return true;
      }
    }

    // 4. ServiceNow approval event indicators
    if (canonicalProvider === 'SERVICENOW') {
      const table = String(body.table || body.target_table || '').toLowerCase();
      if (table === 'sysapproval_approver' || table === 'sysapproval_group') {
        return true;
      }
      const event = String(body.event || body.eventType || '').toLowerCase();
      if (event.includes('approval') || body.approval_state || body.approval_status) {
        return true;
      }
      if (body.decision && (body.sys_id || body.number || body.document_id)) {
        return true;
      }
    }

    // 5. PagerDuty approval / custom action indicators
    if (canonicalProvider === 'PAGERDUTY') {
      const eventType = String(body.event?.event_type || body.event_type || '').toLowerCase();
      if (eventType.includes('custom_action') || eventType.includes('approval')) {
        return true;
      }
      const actionName = String(body.event?.data?.action_name || body.action || '').toLowerCase();
      if (actionName.includes('approv') || actionName.includes('reject') || actionName.includes('deny')) {
        return true;
      }
      if (body.decision && (body.id || body.incidentId)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Normalizes an authenticated incoming approval callback request.
   *
   * @param {object} req - Express request object
   * @param {string} provider - Provider name ('JIRA', 'SERVICENOW', 'PAGERDUTY', 'GENERIC', etc.)
   * @param {object} [config] - IntegrationConfig document
   * @returns {object} Canonical normalized approval callback or validation error
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
        reason: `Provider '${canonicalProvider}' is not supported for external approval callbacks`,
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
        reason: `Failed to parse ${canonicalProvider} approval payload: ${err.message}`,
      };
    }

    // Identity validation: must have at least approvalId or externalReference
    if (!parsed.approvalId && !parsed.externalReference) {
      return {
        valid: false,
        error: 'MISSING_APPROVAL_IDENTITY',
        reason: `Payload for provider '${canonicalProvider}' does not contain an approvalId or external reference`,
      };
    }

    // Standardize decision string
    const normalizedDecision = this.normalizeDecision(parsed.rawDecision);

    return {
      valid: true,
      provider: canonicalProvider,
      integrationId: config?._id ? String(config._id) : null,
      organizationId: config?.organizationId ? String(config.organizationId) : null,
      approvalId: parsed.approvalId ? String(parsed.approvalId).trim() : null,
      externalReference: parsed.externalReference ? String(parsed.externalReference).trim() : null,
      decision: normalizedDecision, // 'APPROVED' | 'DENIED' | null
      rawDecision: parsed.rawDecision ? String(parsed.rawDecision).trim() : null,
      actor: {
        userId: parsed.actor?.userId ? String(parsed.actor.userId).trim() : 'EXTERNAL_ITSM_USER',
        username: parsed.actor?.username ? String(parsed.actor.username).trim() : 'External Approver',
        role: parsed.actor?.role ? String(parsed.actor.role).trim() : 'EXTERNAL_ITSM',
      },
      decisionReason: parsed.decisionReason ? String(parsed.decisionReason).trim() : '',
      eventType: parsed.eventType || `${canonicalProvider.toLowerCase()}:approval_callback`,
      eventId: parsed.eventId || null,
      occurredAt: parsed.occurredAt instanceof Date && !isNaN(parsed.occurredAt) ? parsed.occurredAt : new Date(),
      payloadHash,
      source: 'EXTERNAL_APPROVAL_CALLBACK',
    };
  }

  /**
   * Normalizes an external decision string into canonical 'APPROVED' or 'DENIED'.
   * Returns null if decision is unrecognized/unsupported.
   *
   * @param {string} rawDecision
   * @returns {string|null}
   */
  normalizeDecision(rawDecision) {
    if (!rawDecision || typeof rawDecision !== 'string') return null;

    const normalized = rawDecision.trim().toLowerCase();

    if (DECISION_APPROVED_VARIANTS.includes(normalized)) {
      return 'APPROVED';
    }

    if (DECISION_REJECTED_VARIANTS.includes(normalized)) {
      return 'DENIED';
    }

    return null;
  }

  /**
   * Normalizes Jira approval callback payloads.
   * @private
   */
  _normalizeJira(body, req) {
    const issue = body.issue && typeof body.issue === 'object' ? body.issue : {};
    const approval = body.approval && typeof body.approval === 'object' ? body.approval : {};

    const approvalId =
      body.approvalId ||
      body.approval_id ||
      approval.id ||
      approval.approvalId ||
      (typeof body.id === 'string' && body.id.startsWith('APPR-') ? body.id : null);

    const externalReference =
      issue.key ||
      issue.id ||
      body.key ||
      body.externalReference ||
      body.ticketKey ||
      body.ticketId ||
      null;

    let rawDecision =
      body.decision ||
      approval.decision ||
      approval.status ||
      null;

    if (!rawDecision && issue.fields && issue.fields.status) {
      const statusName = typeof issue.fields.status === 'string' ? issue.fields.status : issue.fields.status.name;
      if (statusName) {
        const lower = statusName.toLowerCase();
        if (lower.includes('approv')) rawDecision = 'approved';
        else if (lower.includes('reject') || lower.includes('deni')) rawDecision = 'rejected';
      }
    }

    const actor = {
      userId: body.user?.accountId || body.user?.name || approval.approver?.name || null,
      username: body.user?.displayName || body.user?.name || approval.approver?.displayName || null,
      role: 'EXTERNAL_ITSM',
    };

    const decisionReason =
      body.comment?.body ||
      body.reason ||
      body.decisionReason ||
      approval.comment ||
      '';

    const eventType = body.webhookEvent || 'jira:approval_callback';
    const eventId = req?.headers?.['x-atlassian-webhook-identifier'] || (body.timestamp ? String(body.timestamp) : null);

    let occurredAt = null;
    if (body.timestamp) {
      occurredAt = typeof body.timestamp === 'number' ? new Date(body.timestamp) : new Date(String(body.timestamp));
    }

    return {
      approvalId,
      externalReference,
      rawDecision,
      actor,
      decisionReason,
      eventType,
      eventId,
      occurredAt,
    };
  }

  /**
   * Normalizes ServiceNow approval callback payloads.
   * @private
   */
  _normalizeServiceNow(body, req) {
    const approvalId =
      body.approvalId ||
      body.approval_id ||
      body.u_approval_id ||
      (typeof body.sys_id === 'string' && body.sys_id.startsWith('APPR-') ? body.sys_id : null);

    const externalReference =
      body.document_id ||
      body.sysapproval ||
      body.number ||
      body.ticketKey ||
      body.ticketId ||
      (approvalId !== body.sys_id ? body.sys_id : null);

    let rawDecision =
      body.decision ||
      body.state ||
      body.approval_state ||
      body.approval_status ||
      null;

    // ServiceNow sysapproval_approver state codes: 'approved', 'rejected', 'requested', 'not_required'
    if (rawDecision === 'approved' || rawDecision === 'approve') rawDecision = 'approved';
    else if (rawDecision === 'rejected' || rawDecision === 'reject') rawDecision = 'rejected';

    const actor = {
      userId: body.approver || body.sys_updated_by || null,
      username: body.approver_name || body.sys_updated_by || null,
      role: 'EXTERNAL_ITSM',
    };

    const decisionReason = body.comments || body.reason || body.decisionReason || '';
    const eventType = body.event || body.eventType || 'servicenow:approval_callback';
    const eventId = req?.headers?.['x-servicenow-event-id'] || body.sys_id || null;

    let occurredAt = null;
    if (body.sys_updated_on) {
      occurredAt = new Date(body.sys_updated_on);
    }

    return {
      approvalId,
      externalReference,
      rawDecision,
      actor,
      decisionReason,
      eventType,
      eventId,
      occurredAt,
    };
  }

  /**
   * Normalizes PagerDuty approval/custom action callback payloads.
   * @private
   */
  _normalizePagerDuty(body, req) {
    const eventData = body.event?.data || body.data || {};

    const approvalId =
      body.approvalId ||
      body.approval_id ||
      eventData.approvalId ||
      eventData.approval_id ||
      null;

    const externalReference =
      eventData.id ||
      eventData.number ||
      body.id ||
      body.incidentId ||
      null;

    let rawDecision =
      body.decision ||
      eventData.action_name ||
      body.action ||
      null;

    const actor = {
      userId: body.event?.agent?.id || body.agent?.id || null,
      username: body.event?.agent?.summary || body.agent?.summary || null,
      role: 'EXTERNAL_ITSM',
    };

    const decisionReason = body.reason || body.decisionReason || body.notes || '';
    const eventType = body.event?.event_type || body.event_type || 'pagerduty:approval_callback';
    const eventId = body.event?.id || req?.headers?.['x-pagerduty-event-id'] || null;

    let occurredAt = null;
    if (body.event?.occurred_at || body.occurred_at) {
      occurredAt = new Date(body.event?.occurred_at || body.occurred_at);
    }

    return {
      approvalId,
      externalReference,
      rawDecision,
      actor,
      decisionReason,
      eventType,
      eventId,
      occurredAt,
    };
  }

  /**
   * Normalizes Generic approval callback payloads.
   * @private
   */
  _normalizeGeneric(body, req) {
    const approvalId =
      body.approvalId ||
      body.approval_id ||
      body.pendingApprovalId ||
      body.id ||
      null;

    const externalReference =
      body.externalReference ||
      body.ticketKey ||
      body.ticketId ||
      body.correlationId ||
      body.reference ||
      null;

    const rawDecision =
      body.decision ||
      body.approvalDecision ||
      body.status ||
      null;

    const actor = {
      userId: body.actor?.userId || body.userId || body.user || null,
      username: body.actor?.username || body.username || body.userName || null,
      role: body.actor?.role || 'EXTERNAL_ITSM',
    };

    const decisionReason = body.decisionReason || body.reason || body.comment || '';
    const eventType = body.eventType || 'generic:approval_callback';
    const eventId = req?.headers?.['x-webhook-event-id'] || body.eventId || null;

    let occurredAt = null;
    if (body.occurredAt || body.timestamp) {
      occurredAt = new Date(body.occurredAt || body.timestamp);
    }

    return {
      approvalId,
      externalReference,
      rawDecision,
      actor,
      decisionReason,
      eventType,
      eventId,
      occurredAt,
    };
  }
}

module.exports = new ExternalApprovalCallbackNormalizer();
