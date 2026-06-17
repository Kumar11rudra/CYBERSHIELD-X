/**
 * CacheProvider Interface & Implementations
 * Design conforms to Phase 9 zero-API, multi-instance ready architecture.
 */

class CacheProvider {
  constructor() {
    this.metrics = {
      hits: 0,
      misses: 0,
      sets: 0
    };
  }

  async get(key) {
    throw new Error('Method not implemented');
  }

  async set(key, value, ttlSeconds) {
    throw new Error('Method not implemented');
  }

  async delete(key) {
    throw new Error('Method not implemented');
  }

  getMetrics() {
    return { ...this.metrics };
  }

  resetMetrics() {
    this.metrics = { hits: 0, misses: 0, sets: 0 };
  }
}

class MemoryCache extends CacheProvider {
  constructor() {
    super();
    this.store = new Map();
    this.ttls = new Map();

    // Prevent memory leaks with periodic cleanup
    this.cleanupInterval = setInterval(() => this.cleanupExpired(), 5 * 60 * 1000);
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  cleanupExpired() {
    const now = Date.now();
    for (const [key, expiry] of this.ttls.entries()) {
      if (now > expiry) {
        this.store.delete(key);
        this.ttls.delete(key);
      }
    }
  }

  async get(key) {
    if (!this.store.has(key)) {
      this.metrics.misses++;
      return null;
    }

    const expiry = this.ttls.get(key);
    if (expiry && Date.now() > expiry) {
      this.store.delete(key);
      this.ttls.delete(key);
      this.metrics.misses++;
      return null;
    }

    this.metrics.hits++;
    const value = this.store.get(key);
    try {
      return JSON.parse(value);
    } catch (e) {
      return value;
    }
  }

  async set(key, value, ttlSeconds = 86400) {
    this.metrics.sets++;
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    this.store.set(key, stringValue);
    this.ttls.set(key, Date.now() + (ttlSeconds * 1000));
    return 'OK';
  }

  async delete(key) {
    this.store.delete(key);
    this.ttls.delete(key);
  }

  // Helper for testing
  clear() {
    this.store.clear();
    this.ttls.clear();
    this.resetMetrics();
  }
}

class RedisCache extends CacheProvider {
  constructor() {
    super();
    console.log('ℹ️ [CacheProvider] RedisCache initialized as a future stub.');
  }

  async get(key) {
    this.metrics.misses++;
    return null; // Future implementation
  }

  async set(key, value, ttlSeconds) {
    this.metrics.sets++;
    return 'OK'; // Future implementation
  }

  async delete(key) {
    // Future implementation
  }
}

// Configured cache provider factory/singleton selector
const providerType = process.env.CACHE_PROVIDER || 'memory';
let activeProvider;

if (providerType === 'redis') {
  activeProvider = new RedisCache();
} else {
  activeProvider = new MemoryCache();
}

module.exports = {
  CacheProvider,
  MemoryCache,
  RedisCache,
  activeProvider
};
