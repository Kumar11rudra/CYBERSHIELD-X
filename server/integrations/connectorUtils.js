'use strict';

/**
 * 🛡️ CyberShield X — ITSM Outbound Connector Utilities (Phase 81 Step 2)
 *
 * Shared utilities for Jira, ServiceNow, and PagerDuty outbound connectors:
 * - Socket-level SSRF validation with isPrivateOrLoopback
 * - Pre-configured secureAxios HTTP client
 * - Uniform error sanitization (zero credential/token leakage)
 * - Normalized result contract builder
 * - Tenant ownership verification
 * - Safe IntegrationSyncEvent audit recorder
 */

const axios = require('axios');
const crypto = require('crypto');
const { secureHttpAgent, secureHttpsAgent, isPrivateOrLoopback } = require('../utils/ssrfValidator');
const logger = require('../utils/logger');

// Pre-configured secure Axios client with SSRF agents, timeout, and bounded response body
const secureAxios = axios.create({
  httpAgent: secureHttpAgent,
  httpsAgent: secureHttpsAgent,
  timeout: 10000,
  maxContentLength: 2 * 1024 * 1024, // 2MB max response
  maxBodyLength: 2 * 1024 * 1024,
});

/**
 * Validates that an external API base/instance URL does not target a private or loopback host.
 * Throws if the URL is invalid, uses an unsupported protocol, or resolves to a private IP.
 *
 * @param {string} url - Target URL to validate
 * @param {string} label - Provider name for error reporting (e.g. 'Jira', 'ServiceNow')
 * @returns {Promise<URL>} Parsed URL object
 */
async function validateApiUrl(url, label = 'Connector') {
  if (!url || typeof url !== 'string') {
    throw new Error(`${label}: URL is required and must be a string`);
  }

  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(`${label}: invalid URL format`);
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error(`${label}: URL must use http or https`);
  }

  // Strip IPv6 brackets from hostname (e.g. [::1] -> ::1) before SSRF check
  const bareHost = parsed.hostname.replace(/^\[|\]$/g, '');
  if (await isPrivateOrLoopback(bareHost)) {
    throw new Error(`${label}: URL resolves to a private or loopback address (SSRF prevention)`);
  }

  return parsed;
}

/**
 * Strips secrets, tokens, passwords, and authorization headers from error messages and objects.
 * Guarantees zero credential leakage through error reporting.
 *
 * @param {Error|any} err - Caught error
 * @param {string} provider - Provider name ('JIRA', 'SERVICENOW', 'PAGERDUTY')
 * @returns {{ code: string, message: string, statusCode: number|null }}
 */
function sanitizeError(err, provider = 'GENERIC') {
  const statusCode = err.response?.status || (err.status ? Number(err.status) : null);
  let rawMessage = err.message || 'Unknown upstream connector error';

  // Redact potential secret patterns in error text
  rawMessage = rawMessage
    .replace(/(Bearer\s+)[^\s,;'"]+/gi, '$1••••••••')
    .replace(/(Basic\s+)[^\s,;'"]+/gi, '$1••••••••')
    .replace(/((?:password|api[_-]?token|secret|webhookSecret)\s*[:=\s]\s*)[^\s,;'"]+/gi, '$1••••••••')
    .replace(/((?:routing[_-]?key|api[_-]?key|key|token)\s*[:=]\s*)[^\s,;'"]+/gi, '$1••••••••')
    .replace(/(password['"]?\s*:\s*['"])[^'"]+(['"])/gi, '$1••••••••$2')
    .replace(/(token['"]?\s*:\s*['"])[^'"]+(['"])/gi, '$1••••••••$2')
    .replace(/(secret['"]?\s*:\s*['"])[^'"]+(['"])/gi, '$1••••••••$2');

  let code = 'UPSTREAM_ERROR';
  if (rawMessage.includes('Tenant mismatch')) {
    code = 'TENANT_MISMATCH';
  } else if (err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT' || rawMessage.includes('timeout')) {
    code = 'TIMEOUT';
  } else if (statusCode === 401 || statusCode === 403) {
    code = 'AUTHENTICATION_FAILED';
  } else if (statusCode === 404) {
    code = 'RESOURCE_NOT_FOUND';
  } else if (statusCode === 429) {
    code = 'RATE_LIMITED';
  } else if (statusCode >= 500) {
    code = 'UPSTREAM_SERVER_ERROR';
  } else if (statusCode >= 400 || rawMessage.includes('missing required') || rawMessage.toLowerCase().includes('invalid')) {
    code = 'BAD_REQUEST';
  } else if (rawMessage.includes('SSRF')) {
    code = 'SSRF_BLOCKED';
  }

  return {
    code: `${provider}_${code}`,
    message: rawMessage,
    statusCode,
  };
}

/**
 * Verifies that context.organizationId matches config.organizationId if both are present.
 * Prevents cross-tenant forged organization IDs.
 *
 * @param {object} config - IntegrationConfig data
 * @param {object} context - Invocation context
 */
function verifyTenantOwnership(config, context) {
  const configOrg = config.organizationId ? config.organizationId.toString() : null;
  const contextOrg = context.organizationId ? context.organizationId.toString() : null;

  if (configOrg && contextOrg && configOrg !== contextOrg) {
    throw new Error('Tenant mismatch: context.organizationId does not match integrationConfig.organizationId');
  }

  return configOrg || contextOrg || null;
}

/**
 * Computes a SHA-256 hash of a payload object for audit tracking.
 *
 * @param {any} data - Data to hash
 * @returns {string} Hex SHA-256 digest
 */
function hashPayload(data) {
  try {
    const serialized = typeof data === 'string' ? data : JSON.stringify(data || {});
    return crypto.createHash('sha256').update(serialized).digest('hex');
  } catch {
    return crypto.createHash('sha256').update('{}').digest('hex');
  }
}

/**
 * Builds a frozen normalized connector result object conforming to Phase 81 Step 2 specification.
 * Never leaks raw secrets, auth headers, or whole upstream responses.
 *
 * @param {object} params
 * @returns {object} Normalized result
 */
function formatNormalizedResult({
  success,
  provider,
  integrationId = null,
  organizationId = null,
  externalTicketId = null,
  externalTicketKey = null,
  externalUrl = null,
  externalStatus = null,
  operation = 'CREATE',
  error = null,
}) {
  const result = {
    success: Boolean(success),
    provider: String(provider).toUpperCase(),
    integrationId: integrationId ? String(integrationId) : null,
    organizationId: organizationId ? String(organizationId) : null,
    externalTicketId: externalTicketId ? String(externalTicketId) : null,
    externalTicketKey: externalTicketKey ? String(externalTicketKey) : null,
    externalUrl: externalUrl ? String(externalUrl) : null,
    externalStatus: externalStatus ? String(externalStatus) : null,
    operation: String(operation).toUpperCase(),
    timestamp: new Date().toISOString(),
    error: error ? {
      code: error.code || 'UNKNOWN_ERROR',
      message: error.message || 'Operation failed',
      ...(error.statusCode !== undefined ? { statusCode: error.statusCode } : {}),
    } : null,
  };

  return Object.freeze(result);
}

/**
 * Safely records an outbound audit event to IntegrationSyncEvent if available.
 * Never throws — failures are logged to prevent blocking the primary connector flow.
 *
 * @param {object} eventParams
 * @returns {Promise<object|null>}
 */
async function recordOutboundSyncEvent({
  organizationId,
  integrationId,
  provider,
  eventType,
  targetEntityType = 'CASE',
  targetEntityId = 'UNKNOWN',
  externalTicketKey = null,
  payload = {},
  status = 'SUCCESS',
  errorMessage = null,
  durationMs = 0,
}) {
  try {
    const IntegrationSyncEvent = require('../models/IntegrationSyncEvent');
    const syncId = crypto.randomUUID();
    const payloadHash = hashPayload(payload);

    const doc = await IntegrationSyncEvent.create({
      syncId,
      organizationId,
      integrationId,
      provider: String(provider).toUpperCase(),
      direction: 'OUTBOUND',
      eventType,
      targetEntityType,
      targetEntityId: String(targetEntityId),
      externalTicketKey,
      payloadHash,
      status,
      errorMessage,
      durationMs,
      processedAt: new Date(),
    });

    return doc;
  } catch (err) {
    logger.warn(`[CONNECTOR-AUDIT] Could not record IntegrationSyncEvent: ${err.message}`);
    return null;
  }
}

module.exports = {
  secureAxios,
  validateApiUrl,
  sanitizeError,
  verifyTenantOwnership,
  hashPayload,
  formatNormalizedResult,
  recordOutboundSyncEvent,
};
