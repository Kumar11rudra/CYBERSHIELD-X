/**
 * CyberShield X — Performance & Telemetry Test Suite
 * Tests CacheProvider operations, cache hit/miss rates, and health endpoints.
 */

const request = require('supertest');
const mongoose = require('mongoose');
const { app } = require('../index');
const { activeProvider } = require('../utils/cacheProvider');

beforeAll(async () => {
  const testDbUri = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/cybershield-test';
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(testDbUri);
  }
});

afterAll(async () => {
  await mongoose.disconnect();
});

describe('CacheProvider Operations & Metrics', () => {
  beforeEach(() => {
    activeProvider.clear();
  });

  it('should store, retrieve, and delete values successfully', async () => {
    await activeProvider.set('test-key', { foo: 'bar' }, 10);
    const value = await activeProvider.get('test-key');
    expect(value).toEqual({ foo: 'bar' });

    await activeProvider.delete('test-key');
    const deletedValue = await activeProvider.get('test-key');
    expect(deletedValue).toBeNull();
  });

  it('should accurately track cache hits, misses, and sets', async () => {
    // 1 set
    await activeProvider.set('hit-miss-key', 'value', 10);
    expect(activeProvider.getMetrics().sets).toBe(1);

    // 1 hit
    await activeProvider.get('hit-miss-key');
    expect(activeProvider.getMetrics().hits).toBe(1);
    expect(activeProvider.getMetrics().misses).toBe(0);

    // 1 miss
    await activeProvider.get('non-existent-key');
    expect(activeProvider.getMetrics().hits).toBe(1);
    expect(activeProvider.getMetrics().misses).toBe(1);
  });
});

describe('Health & Telemetry API Endpoints', () => {
  it('GET /api/health should return general status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body.timestamp).toBeDefined();
  });

  it('GET /api/health/details should return detailed service telemetry', async () => {
    const res = await request(app).get('/api/health/details');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body.services).toBeDefined();
    expect(res.body.services.database).toBeDefined();
    expect(res.body.services.aiEngine).toBeDefined();
    expect(res.body.services.cache).toBeDefined();
    expect(res.body.services.queues).toBeDefined();
    expect(res.body.services.scanPerformance).toBeDefined();
  });
});
