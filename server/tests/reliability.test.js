/**
 * CyberShield X — Reliability & Queue Worker Test Suite
 * Tests QueueProvider, worker retry logic, DLQ routing, and AI engine fallback health checks.
 */

const mongoose = require('mongoose');
const { MemoryQueue } = require('../workers/queueProvider');
const { checkOllamaStatus, getDetailedHealth } = require('../services/healthService');

beforeAll(async () => {
  const testDbUri = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/cybershield-test';
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(testDbUri);
  }
});

afterAll(async () => {
  await mongoose.disconnect();
});

describe('QueueProvider Workers, Retries & DLQ', () => {
  let testQueue;

  beforeEach(() => {
    testQueue = new MemoryQueue('test-reliability-queue', { concurrency: 1, maxRetries: 3 });
  });

  afterEach(() => {
    testQueue.clear();
  });

  it('should process enqueued jobs successfully', (done) => {
    testQueue.process(async (data) => {
      expect(data).toEqual({ test: 'job-data' });
      const metrics = testQueue.getMetrics();
      expect(metrics.active).toBe(1);
      
      // Let it finish
      setTimeout(() => {
        const afterMetrics = testQueue.getMetrics();
        expect(afterMetrics.completed).toBe(1);
        expect(afterMetrics.active).toBe(0);
        done();
      }, 50);
    });

    testQueue.enqueue({ test: 'job-data' });
  });

  it('should retry failed jobs up to maxRetries before moving to DLQ', (done) => {
    let attemptsCount = 0;
    
    testQueue.process(async (data) => {
      attemptsCount++;
      throw new Error('Simulation of job failure');
    });

    testQueue.enqueue({ test: 'bad-data' });

    // Wait for retries to complete. Concurrency is 1, maxRetries is 3.
    setTimeout(() => {
      const metrics = testQueue.getMetrics();
      // Should attempt 3 times (initial + 2 retries)
      expect(attemptsCount).toBe(3);
      // Completed should be 0
      expect(metrics.completed).toBe(0);
      // DLQ size should be 1
      expect(metrics.dlqSize).toBe(1);
      expect(testQueue.dlq[0].error).toBe('Simulation of job failure');
      done();
    }, 200);
  });
});

describe('AI Fallback & Platform Health Integrity', () => {
  it('Ollama connection failure should not degrade system health status', async () => {
    // Override OLLAMA_URL to a non-existent port to simulate connection failure
    process.env.OLLAMA_URL = 'http://127.0.0.1:9999';

    const aiStatus = await checkOllamaStatus();
    expect(aiStatus.online).toBe(false);
    expect(aiStatus.mode).toBe('Template Engine Active');

    const health = await getDetailedHealth();
    // System status must remain healthy because the database is online
    expect(health.status).toBe('healthy');
    expect(health.services.aiEngine.status).toBe('healthy');
    expect(health.services.aiEngine.mode).toBe('Template Engine Active');
  });
});
