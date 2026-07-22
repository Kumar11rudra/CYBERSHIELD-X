/**
 * ILogger Interface (Architecture Placeholder)
 * Exposes logging contracts for future implementations (e.g., Winston, Pino).
 * Do NOT implement logic here.
 */
class ILogger {
  info(message, meta = {}) {
    throw new Error('Method not implemented.');
  }

  error(message, error = null, meta = {}) {
    throw new Error('Method not implemented.');
  }

  warn(message, meta = {}) {
    throw new Error('Method not implemented.');
  }

  debug(message, meta = {}) {
    throw new Error('Method not implemented.');
  }
}

module.exports = ILogger;
