/**
 * Redis Cache Service (Architecture Concept A)
 * Seamlessly falls back to in-memory Map if Redis server is unavailable.
 */
const { createClient } = require('redis');

class CacheService {
  constructor() {
    this.memoryCache = new Map();
    this.memoryTtls = new Map();
    this.useRedis = false;
    
    // Connect to Redis
    this.redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://127.0.0.1:6379'
    });

    this.redisClient.on('error', (err) => {
      if (this.useRedis) {
        console.warn('⚠️ [REDIS ERROR] Connection lost. Falling back to in-memory cache.');
        this.useRedis = false;
      }
    });

    this.redisClient.on('connect', () => {
      console.log('✅ [REDIS] Connected successfully. Using Redis for caching/sessions.');
      this.useRedis = true;
    });

    // Try to connect, but don't block app startup if it fails
    this.redisClient.connect().catch(() => {
      console.warn('⚠️ [REDIS WARNING] Could not connect to Redis. Using in-memory fallback.');
      this.useRedis = false;
    });

    // In-memory memory leak prevention
    setInterval(() => this.cleanupMemory(), 10 * 60 * 1000).unref();
  }

  cleanupMemory() {
    const now = Date.now();
    for (const [key, expiry] of this.memoryTtls.entries()) {
      if (now > expiry) {
        this.memoryCache.delete(key);
        this.memoryTtls.delete(key);
      }
    }
  }

  /**
   * Set a value in cache with a TTL (Time To Live) in seconds
   */
  async set(key, value, ttlSeconds = 86400) { // Default 24 hours
    const stringValue = JSON.stringify(value);
    
    if (this.useRedis) {
      try {
        await this.redisClient.setEx(key, ttlSeconds, stringValue);
        return 'OK';
      } catch (err) {
        // Fallback to memory if redis fails mid-request
      }
    }

    this.memoryCache.set(key, stringValue);
    this.memoryTtls.set(key, Date.now() + (ttlSeconds * 1000));
    return 'OK';
  }

  /**
   * Get a value from cache
   */
  async get(key) {
    if (this.useRedis) {
      try {
        const val = await this.redisClient.get(key);
        return val ? JSON.parse(val) : null;
      } catch (err) {
        // Fallback to memory
      }
    }

    if (!this.memoryCache.has(key)) return null;
    const expiry = this.memoryTtls.get(key);
    if (Date.now() > expiry) {
      this.delete(key);
      return null;
    }

    return JSON.parse(this.memoryCache.get(key));
  }

  /**
   * Delete a key from cache
   */
  async delete(key) {
    if (this.useRedis) {
      try {
        await this.redisClient.del(key);
      } catch (err) {}
    }
    this.memoryCache.delete(key);
    this.memoryTtls.delete(key);
  }
}

// Singleton instance
module.exports = new CacheService();
