/**
 * QueueProvider Interface & Implementations
 * Conforms to Phase 9 zero-API, multi-instance ready architecture.
 */

class QueueProvider {
  constructor(name, options = {}) {
    this.name = name;
    this.options = options;
  }

  enqueue(data) {
    throw new Error('Method not implemented');
  }

  process(handler) {
    throw new Error('Method not implemented');
  }

  getMetrics() {
    throw new Error('Method not implemented');
  }
}

class MemoryQueue extends QueueProvider {
  constructor(name, options = {}) {
    super(name, options);
    this.concurrency = options.concurrency || 1;
    this.maxRetries = options.maxRetries || 3;
    this.queue = [];
    this.activeWorkers = 0;
    this.handler = null;
    this.dlq = [];
    this.metrics = {
      enqueued: 0,
      completed: 0,
      failed: 0,
      totalLatencyMs: 0
    };
  }

  enqueue(data) {
    const job = {
      id: Math.random().toString(36).substring(7),
      data,
      attempts: 0,
      enqueuedAt: Date.now(),
      startedAt: null,
      completedAt: null
    };
    this.queue.push(job);
    this.metrics.enqueued++;
    this._processNext();
    return job;
  }

  process(handler) {
    this.handler = handler;
    this._processNext();
  }

  async _processNext() {
    if (!this.handler || this.queue.length === 0 || this.activeWorkers >= this.concurrency) {
      return;
    }

    const job = this.queue.shift();
    this.activeWorkers++;
    job.startedAt = Date.now();
    job.attempts++;

    // Run execution inside an async block so we don't hold the stack
    setImmediate(async () => {
      try {
        await this.handler(job.data);
        job.completedAt = Date.now();
        this.metrics.completed++;
        const latency = job.completedAt - job.startedAt;
        this.metrics.totalLatencyMs += latency;
      } catch (err) {
        console.error(`⚠️ [Queue:${this.name}] Job ${job.id} failed (attempt ${job.attempts}):`, err.message);
        if (job.attempts < this.maxRetries) {
          // Put back in queue to retry
          this.queue.push(job);
        } else {
          // Push to DLQ
          job.error = err.message;
          job.failedAt = Date.now();
          this.dlq.push(job);
          this.metrics.failed++;
          console.error(`❌ [Queue:${this.name}] Job ${job.id} moved to Dead-Letter Queue (DLQ).`);
        }
      } finally {
        this.activeWorkers--;
        this._processNext();
      }
    });
  }

  getMetrics() {
    const active = this.activeWorkers;
    const size = this.queue.length;
    const completed = this.metrics.completed;
    const failed = this.metrics.failed;
    const avgLatencyMs = completed > 0 ? Math.round(this.metrics.totalLatencyMs / completed) : 0;
    return {
      size,
      active,
      completed,
      failed,
      dlqSize: this.dlq.length,
      avgLatencyMs
    };
  }

  clear() {
    this.queue = [];
    this.dlq = [];
    this.activeWorkers = 0;
    this.metrics = { enqueued: 0, completed: 0, failed: 0, totalLatencyMs: 0 };
  }
}

class BullMQQueue extends QueueProvider {
  constructor(name, options = {}) {
    super(name, options);
    console.log(`ℹ️ [QueueProvider] BullMQQueue initialized as a stub for queue: ${name}`);
  }

  enqueue(data) {
    return { id: 'mock-bullmq-id', data };
  }

  process(handler) {
    this.handler = handler;
  }

  getMetrics() {
    return {
      size: 0,
      active: 0,
      completed: 0,
      failed: 0,
      dlqSize: 0,
      avgLatencyMs: 0
    };
  }
}

// Configured queue type selector
const queueType = process.env.QUEUE_PROVIDER || 'memory';
const createQueue = (name, options = {}) => {
  if (queueType === 'bullmq') {
    return new BullMQQueue(name, options);
  }
  return new MemoryQueue(name, options);
};

// Expose standard queues for background jobs
const scanQueue = createQueue('scan', { concurrency: 2, maxRetries: 3 });
const aiQueue = createQueue('ai', { concurrency: 2, maxRetries: 3 });
const notificationQueue = createQueue('notification', { concurrency: 5, maxRetries: 3 });
const integrationQueue = createQueue('integration', { concurrency: 3, maxRetries: 3 });

module.exports = {
  QueueProvider,
  MemoryQueue,
  BullMQQueue,
  scanQueue,
  aiQueue,
  notificationQueue,
  integrationQueue
};

// Auto-register workers to attach queue listeners
require('./ScanWorker');
require('./AIWorker');
require('./NotificationWorker');
require('./IntegrationWorker');

