class PlatformError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

class DashboardError extends PlatformError {
  constructor(message) {
    super(message, 500);
  }
}

class VaultError extends PlatformError {
  constructor(message) {
    super(message, 400);
  }
}

class ReportGenerationError extends PlatformError {
  constructor(message) {
    super(message, 500);
  }
}

class BreachProviderError extends PlatformError {
  constructor(message) {
    super(message, 502);
  }
}

class AnalyticsError extends PlatformError {
  constructor(message) {
    super(message, 500);
  }
}

/**
 * Standard Normalized Error Codes across CyberShield X
 */
const ERROR_CODES = Object.freeze({
  DEPENDENCY_MISSING: 'DEPENDENCY_MISSING',
  TARGET_UNAVAILABLE: 'TARGET_UNAVAILABLE',
  TIMEOUT: 'TIMEOUT',
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  RATE_LIMITED: 'RATE_LIMITED',
  INVALID_INPUT: 'INVALID_INPUT',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  EXECUTION_FAILED: 'EXECUTION_FAILED',
  EXTERNAL_SERVICE_UNAVAILABLE: 'EXTERNAL_SERVICE_UNAVAILABLE',
  SSRF_BLOCKED: 'SSRF_BLOCKED',
  CANCELLED: 'CANCELLED'
});

/**
 * Factory for creating standard normalized errors across API, Terminal, and Toolkit
 */
function createNormalizedError({
  code = ERROR_CODES.EXECUTION_FAILED,
  category = 'EXECUTION',
  message,
  userMessage = null,
  retryable = false,
  target = null,
  toolId = null,
  requestId = null
}) {
  return {
    code,
    category,
    message: message || 'An error occurred during tool execution.',
    userMessage: userMessage || message || 'Execution could not be completed.',
    retryable,
    target: target || null,
    toolId: toolId || null,
    timestamp: new Date().toISOString(),
    requestId: requestId || ('req_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6))
  };
}

module.exports = {
  PlatformError,
  DashboardError,
  VaultError,
  ReportGenerationError,
  BreachProviderError,
  AnalyticsError,
  ERROR_CODES,
  createNormalizedError
};
