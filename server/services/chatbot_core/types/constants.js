/**
 * Shared constants and types for the AI Security Copilot architecture.
 */

const RISK_LEVELS = Object.freeze({
  GREEN: 'GREEN',   // Safe, read-only or low impact actions
  YELLOW: 'YELLOW', // Moderate risk, might require verification
  RED: 'RED'        // High risk, destructive or highly sensitive actions
});

const USER_ROLES = Object.freeze({
  ADMIN: 'admin',
  USER: 'user',
  GUEST: 'guest'
});

const AI_RESPONSE_STATUS = Object.freeze({
  SUCCESS: 'success',
  ERROR: 'error',
  PENDING_PERMISSION: 'pending_permission',
  BLOCKED: 'blocked'
});

const PERMISSION_STATUS = Object.freeze({
  GRANTED: 'granted',
  DENIED: 'denied',
  REQUIRES_APPROVAL: 'requires_approval'
});

const ACTION_TYPES = Object.freeze({
  READ: 'read',
  EXECUTE_SCAN: 'execute_scan',
  MODIFY_CONFIG: 'modify_config',
  DELETE_DATA: 'delete_data'
});

const EVENT_CATEGORIES = Object.freeze({
  SYSTEM_HEALTH: 'system_health',
  USER_ACTIVITY: 'user_activity',
  SECURITY_ALERT: 'security_alert',
  API_FAILURE: 'api_failure',
  UI_EVENT: 'ui_event'
});

const SEVERITY_LEVELS = Object.freeze({
  INFO: 'INFO',
  WARNING: 'WARNING',
  CRITICAL: 'CRITICAL',
  FATAL: 'FATAL'
});

module.exports = {
  RISK_LEVELS,
  USER_ROLES,
  AI_RESPONSE_STATUS,
  PERMISSION_STATUS,
  ACTION_TYPES,
  EVENT_CATEGORIES,
  SEVERITY_LEVELS
};
