/**
 * Backward-compatible Cache Service wrapper proxying to the new CacheProvider.
 */
const { activeProvider } = require('./cacheProvider');

class CacheService {
  async set(key, value, ttlSeconds = 86400) {
    return activeProvider.set(key, value, ttlSeconds);
  }

  async get(key) {
    return activeProvider.get(key);
  }

  async delete(key) {
    return activeProvider.delete(key);
  }

  // Hook for metrics and health checks
  getProvider() {
    return activeProvider;
  }
}

module.exports = new CacheService();
