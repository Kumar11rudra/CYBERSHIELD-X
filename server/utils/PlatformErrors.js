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

module.exports = {
  PlatformError,
  DashboardError,
  VaultError,
  ReportGenerationError,
  BreachProviderError,
  AnalyticsError
};
