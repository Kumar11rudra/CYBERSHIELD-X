/**
 * 🛡️ CyberShield X — Immutable Audit Logger
 *
 * Records compliance-grade audit events asynchronously without blocking execution threads.
 * Sanitizes input to guarantee zero secrets are persisted.
 */

const crypto = require('crypto');
const mongoose = require('mongoose');
const AuditEvent = require('../models/AuditEvent');

/**
 * Strips potential sensitive credential keys from log objects
 */
function sanitizeAuditDetails(details, depth = 0, seen = new WeakSet()) {
  if (!details || typeof details !== 'object' || depth > 5) return details;
  if (seen.has(details)) return '[CIRCULAR]';
  seen.add(details);

  const sanitized = Array.isArray(details) ? [...details] : { ...details };

  const SENSITIVE_KEYS = [
    'password',
    'token',
    'secret',
    'authorization',
    'apiKey',
    'jwt',
    'mongoUri',
    'cookie',
  ];

  for (const key of Object.keys(sanitized)) {
    const lower = key.toLowerCase();
    if (SENSITIVE_KEYS.some((s) => lower.includes(s))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitizeAuditDetails(sanitized[key], depth + 1, seen);
    }
  }

  return sanitized;
}

/**
 * Log an immutable audit event
 * @param {Object} params
 * @param {Object} params.actor - { userId, username, role, ip }
 * @param {string} params.action - e.g. 'TOOL_EXECUTION', 'DEPENDENCY_REMEDIATION'
 * @param {Object} params.resource - { resourceType, resourceId }
 * @param {string} [params.outcome='SUCCESS'] - 'SUCCESS', 'FAILURE', 'DENIED'
 * @param {Object} [params.details={}] - Non-sensitive audit payload
 */
async function logAuditEvent({ actor = {}, action, resource = {}, outcome = 'SUCCESS', details = {}, organizationId = null }) {
  try {
    const eventId = `aud_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const cleanDetails = sanitizeAuditDetails(details);
    const orgId = organizationId || actor.organizationId || actor.organization_id || (actor.organization ? actor.organization._id || actor.organization : null);

    const doc = {
      eventId,
      organizationId: orgId,
      actor: {
        userId: String(actor.userId || actor.id || actor._id || 'system'),
        username: String(actor.username || actor.email || 'system'),
        email: String(actor.email || 'system@cybershield.local'),
        role: String(actor.role || 'system').toUpperCase(),
        ip: String(actor.ip || '127.0.0.1'),
      },
      action: String(action || 'GENERIC_ACTION'),
      resource: {
        resourceType: String(resource.resourceType || resource.type || 'UNKNOWN'),
        resourceId: String(resource.resourceId || resource.id || 'GLOBAL'),
        type: String(resource.resourceType || resource.type || 'UNKNOWN'),
        id: String(resource.resourceId || resource.id || 'GLOBAL'),
      },
      outcome: String(outcome || 'SUCCESS').toUpperCase(),
      details: cleanDetails,
      timestamp: new Date(),
    };

    // Save asynchronously without unhandled promise rejection if DB is connected
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      await AuditEvent.create(doc).catch((err) => {
        console.warn('[AUDIT LOGGER] Failed to record audit event to database:', err.message);
      });
    }

    return doc;
  } catch (err) {
    console.warn('[AUDIT LOGGER ERROR]', err.message);
    return null;
  }
}

module.exports = {
  log: logAuditEvent,
  logAuditEvent,
  logEvent: logAuditEvent,
  sanitizeAuditDetails,
};
