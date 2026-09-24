/**
 * 🛡️ CyberShield X — BaseCloudAdapter (Phase 80 Step 4)
 *
 * Base normalization adapter providing shared sanitization, bounded parameter processing,
 * prototype pollution protection, resource truncation, deterministic SHA-256 payload hashing,
 * and safe error encapsulation.
 */

'use strict';

const crypto = require('crypto');

// Bounded limits to prevent memory/CPU exhaustion
const MAX_DEPTH = 4;
const MAX_KEYS_PER_OBJECT = 50;
const MAX_STRING_LENGTH = 1024;
const MAX_RESOURCES_COUNT = 25;
const MAX_RESOURCE_FIELD_LENGTH = 512;

// Sensitive key regex for credential and secret parameter redaction
const SENSITIVE_KEY_REGEX = /(password|secret|token|credential|authorization|private_?key|access_?key|api_?key|shared_?key|auth_?key|bearer|cookie|ssn|cvv)/i;

class BaseCloudAdapter {
  /**
   * Compute deterministic SHA-256 hash of raw provider payload.
   *
   * @param {string|Object} rawPayload - Raw incoming provider payload
   * @returns {string} SHA-256 hexadecimal hash
   */
  static computePayloadHash(rawPayload) {
    if (!rawPayload) {
      return crypto.createHash('sha256').update('').digest('hex');
    }

    let payloadString;
    if (typeof rawPayload === 'string') {
      payloadString = rawPayload;
    } else {
      try {
        payloadString = JSON.stringify(rawPayload);
      } catch {
        payloadString = String(rawPayload);
      }
    }

    return crypto.createHash('sha256').update(payloadString).digest('hex');
  }

  /**
   * Bounded and sanitized parameter extraction.
   * Strips prototype pollution, redacts credential-shaped keys, and bounds depth and string size.
   *
   * @param {*} input - Parameter object from provider
   * @param {number} [depth=0] - Current recursion depth
   * @param {Set} [seen=new Set()] - Cyclic reference tracker
   * @returns {*} Sanitized parameter structure
   */
  static sanitizeParameters(input, depth = 0, seen = new Set()) {
    if (input === null || input === undefined) {
      return null;
    }

    if (typeof input !== 'object') {
      if (typeof input === 'string') {
        return input.length > MAX_STRING_LENGTH ? input.slice(0, MAX_STRING_LENGTH) : input;
      }
      return input;
    }

    if (depth >= MAX_DEPTH) {
      return '[DEPTH_LIMIT_REACHED]';
    }

    if (seen.has(input)) {
      return '[CIRCULAR_REFERENCE]';
    }
    seen.add(input);

    if (Array.isArray(input)) {
      const sanitizedArray = [];
      const len = Math.min(input.length, MAX_KEYS_PER_OBJECT);
      for (let i = 0; i < len; i++) {
        sanitizedArray.push(BaseCloudAdapter.sanitizeParameters(input[i], depth + 1, seen));
      }
      return sanitizedArray;
    }

    const sanitizedObj = {};
    const keys = Object.keys(input).slice(0, MAX_KEYS_PER_OBJECT);

    for (const key of keys) {
      // Prototype pollution defense
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        continue;
      }

      // Credential-shaped key redaction
      if (SENSITIVE_KEY_REGEX.test(key)) {
        sanitizedObj[key] = '[REDACTED]';
        continue;
      }

      sanitizedObj[key] = BaseCloudAdapter.sanitizeParameters(input[key], depth + 1, seen);
    }

    return sanitizedObj;
  }

  /**
   * Normalize and bound resource structures.
   *
   * @param {Array<Object>} resources - Raw resource objects from provider
   * @returns {Array<{ resourceType: string|null, resourceId: string|null, resourceName: string|null }>}
   */
  static boundResources(resources) {
    if (!Array.isArray(resources) || resources.length === 0) {
      return [];
    }

    const bounded = [];
    const limit = Math.min(resources.length, MAX_RESOURCES_COUNT);

    for (let i = 0; i < limit; i++) {
      const r = resources[i];
      if (!r || typeof r !== 'object') continue;

      const safeTruncate = (str) => {
        if (!str || typeof str !== 'string') return null;
        const trimmed = str.trim();
        return trimmed.length > MAX_RESOURCE_FIELD_LENGTH
          ? trimmed.slice(0, MAX_RESOURCE_FIELD_LENGTH)
          : trimmed;
      };

      bounded.push({
        resourceType: safeTruncate(r.resourceType || r.type),
        resourceId: safeTruncate(r.resourceId || r.ARN || r.id || r.resourceName),
        resourceName: safeTruncate(r.resourceName || r.name || r.resourceId || r.ARN),
      });
    }

    return bounded;
  }

  /**
   * Safely validate and parse an event timestamp.
   *
   * @param {string|number|Date} timeInput - Input timestamp
   * @returns {Date|null}
   */
  static parseEventTime(timeInput) {
    if (!timeInput) return null;
    const date = new Date(timeInput);
    if (isNaN(date.getTime())) {
      return null;
    }
    return date;
  }

  /**
   * Normalize outcome to the strict schema enum: SUCCESS | FAILURE | DENIED | UNKNOWN.
   *
   * @param {string} rawOutcome
   * @returns {'SUCCESS'|'FAILURE'|'DENIED'|'UNKNOWN'}
   */
  static normalizeOutcome(rawOutcome) {
    if (!rawOutcome || typeof rawOutcome !== 'string') return 'UNKNOWN';
    const upper = rawOutcome.trim().toUpperCase();

    if (upper === 'SUCCESS' || upper === 'SUCCEEDED' || upper === 'OK' || upper === 'STARTED' || upper === 'ACCEPTED') {
      return 'SUCCESS';
    }
    if (upper === 'DENIED' || upper === 'ACCESSDENIED' || upper === 'UNAUTHORIZED' || upper === 'PERMISSION_DENIED' || upper === 'FORBIDDEN') {
      return 'DENIED';
    }
    if (upper === 'FAILURE' || upper === 'FAILED' || upper === 'ERROR') {
      return 'FAILURE';
    }
    return 'UNKNOWN';
  }

  /**
   * Normalize severity to: CRITICAL | HIGH | MEDIUM | LOW | INFORMATIONAL.
   *
   * @param {string|null} explicitProviderSeverity
   * @param {number} tier
   * @param {'SUCCESS'|'FAILURE'|'DENIED'|'UNKNOWN'} outcome
   * @param {boolean} [isRoot=false]
   * @returns {'CRITICAL'|'HIGH'|'MEDIUM'|'LOW'|'INFORMATIONAL'}
   */
  static normalizeSeverity(explicitProviderSeverity, tier, outcome, isRoot = false) {
    if (isRoot) {
      return 'CRITICAL';
    }

    if (explicitProviderSeverity && typeof explicitProviderSeverity === 'string') {
      const upper = explicitProviderSeverity.trim().toUpperCase();
      if (['CRITICAL', 'EMERGENCY', 'ALERT', 'FATAL'].includes(upper)) return 'CRITICAL';
      if (['HIGH', 'ERROR'].includes(upper)) return 'HIGH';
      if (['MEDIUM', 'WARNING', 'WARN'].includes(upper)) return 'MEDIUM';
      if (['LOW'].includes(upper)) return 'LOW';
      if (['INFORMATIONAL', 'INFO', 'NOTICE', 'DEBUG', 'VERBOSE'].includes(upper)) return 'INFORMATIONAL';
    }

    // Deterministic fallback based on tier and outcome
    if (tier === 1) {
      return outcome === 'DENIED' ? 'HIGH' : 'MEDIUM';
    }
    if (tier === 2) {
      return outcome === 'DENIED' ? 'HIGH' : 'LOW';
    }
    if (tier === 3) {
      return outcome === 'DENIED' ? 'MEDIUM' : 'LOW';
    }
    if (tier === 4) {
      return 'INFORMATIONAL';
    }
    return 'INFORMATIONAL';
  }

  /**
   * Create a structured normalization error response without exposing raw input payloads.
   *
   * @param {string} reasonCode - Safe structured error reason
   * @param {string} message - Diagnostic explanation
   * @returns {{ success: false, reason: string, message: string }}
   */
  static fail(reasonCode, message) {
    return {
      success: false,
      reason: reasonCode,
      message,
    };
  }
}

module.exports = BaseCloudAdapter;
