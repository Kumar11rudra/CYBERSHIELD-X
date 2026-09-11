/**
 * 🛡️ CyberShield X — APIObservabilityService (Phase 76)
 *
 * Deterministic API telemetry collection middleware and metrics aggregation.
 * Enforces strict credential and payload redaction (Authorization, Cookies, Passwords, Tokens).
 * Implements bounded ring buffer and real percentile calculation (p50, p95, p99).
 */

const crypto = require('crypto');
const uuidv4 = () => crypto.randomUUID();
const PlatformMetricSnapshot = require('../../models/PlatformMetricSnapshot');

class APIObservabilityService {
  constructor() {
    this.BUFFER_LIMIT = 2000;
    this.buffer = []; // Ring buffer of recent requests
    this.totalRequests = 0;
    this.totalSuccess = 0;
    this.totalErrors = 0;
    this.statusCodes = new Map(); // code -> count
    this.routeStats = new Map();  // route -> { count, errors, totalLatencyMs }

    // Bind middleware
    this.middleware = this.middleware.bind(this);
  }

  /**
   * Express middleware for request interception and telemetry recording.
   */
  middleware(req, res, next) {
    const startHrTime = process.hrtime();
    const startTime = Date.now();

    res.on('finish', () => {
      const elapsedHr = process.hrtime(startHrTime);
      const latencyMs = Number((elapsedHr[0] * 1000 + elapsedHr[1] / 1e6).toFixed(2));
      const statusCode = res.statusCode;
      const isError = statusCode >= 400;

      // Extract tenant scope safely
      const organizationId = req.user?.organizationId || req.organizationId || null;

      // Normalize route pattern (replace objectIds and UUIDs)
      const rawPath = req.baseUrl ? `${req.baseUrl}${req.path}` : req.path;
      const normalizedRoute = this.normalizeRoute(rawPath);

      // Record sample
      this.recordSample({
        id: uuidv4(),
        method: req.method,
        route: normalizedRoute,
        statusCode,
        isError,
        latencyMs,
        timestamp: startTime,
        organizationId,
      });
    });

    next();
  }

  /**
   * Normalize dynamic IDs in routes to prevent cardinality explosion.
   */
  normalizeRoute(route) {
    if (!route) return '/';
    return route
      .replace(/[0-9a-fA-F]{24}/g, ':id')
      .replace(/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/g, ':uuid')
      .replace(/\/\d+(?=\/|$)/g, '/:numId');
  }

  /**
   * Strict telemetry redaction utility.
   */
  sanitizeTelemetryData(data) {
    if (!data || typeof data !== 'object') return data;
    const sanitized = Array.isArray(data) ? [] : {};
    const SENSITIVE_KEYS = new Set([
      'authorization', 'cookie', 'set-cookie', 'x-api-key', 'token',
      'password', 'secret', 'apikey', 'bearer', 'access_token', 'refresh_token'
    ]);

    for (const [key, value] of Object.entries(data)) {
      if (SENSITIVE_KEYS.has(key.toLowerCase())) {
        sanitized[key] = '[REDACTED_SENSITIVE_TELEMETRY]';
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeTelemetryData(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }

  /**
   * Record an observed request sample into the ring buffer.
   */
  recordSample(sample) {
    this.totalRequests++;
    if (sample.isError) {
      this.totalErrors++;
    } else {
      this.totalSuccess++;
    }

    // Update status code counts
    const currentCodeCount = this.statusCodes.get(sample.statusCode) || 0;
    this.statusCodes.set(sample.statusCode, currentCodeCount + 1);

    // Update route stats
    const routeKey = `${sample.method} ${sample.route}`;
    const stats = this.routeStats.get(routeKey) || { count: 0, errors: 0, totalLatencyMs: 0 };
    stats.count++;
    if (sample.isError) stats.errors++;
    stats.totalLatencyMs += sample.latencyMs;
    this.routeStats.set(routeKey, stats);

    // Add to circular buffer
    this.buffer.push(sample);
    if (this.buffer.length > this.BUFFER_LIMIT) {
      this.buffer.shift();
    }
  }

  /**
   * Compute real percentiles (p50, p95, p99) from recent buffer.
   */
  getLatencyPercentiles(samples) {
    if (!samples || samples.length === 0) {
      return { p50: null, p95: null, p99: null, avg: null };
    }

    const sorted = samples.map((s) => s.latencyMs).sort((a, b) => a - b);
    const count = sorted.length;

    const p50 = sorted[Math.floor(count * 0.5)];
    const p95 = sorted[Math.floor(count * 0.95)];
    const p99 = sorted[Math.floor(count * 0.99)];
    const avg = Number((sorted.reduce((sum, v) => sum + v, 0) / count).toFixed(2));

    return { p50, p95, p99, avg };
  }

  /**
   * Get metrics summary for a specified rolling time window (default: last 15 minutes).
   */
  getMetricsSummary(windowMs = 15 * 60 * 1000, organizationId = null) {
    const cutoff = Date.now() - windowMs;
    let relevantSamples = this.buffer.filter((s) => s.timestamp >= cutoff);

    if (organizationId) {
      relevantSamples = relevantSamples.filter((s) => s.organizationId === organizationId);
    }

    if (relevantSamples.length === 0) {
      return {
        status: 'NO_DATA',
        sampleCount: 0,
        windowMs,
        requests: { total: 0, success: 0, error: 0, errorRate: 0 },
        latency: { p50: null, p95: null, p99: null, avg: null },
        statusCodes: {},
        topRoutes: [],
      };
    }

    const total = relevantSamples.length;
    const errors = relevantSamples.filter((s) => s.isError).length;
    const success = total - errors;
    const errorRate = Number((errors / total).toFixed(4));
    const latency = this.getLatencyPercentiles(relevantSamples);

    const codes = {};
    for (const s of relevantSamples) {
      codes[s.statusCode] = (codes[s.statusCode] || 0) + 1;
    }

    // Top 10 active routes in window
    const routeMap = new Map();
    for (const s of relevantSamples) {
      const key = `${s.method} ${s.route}`;
      const r = routeMap.get(key) || { route: key, count: 0, errors: 0, totalLatency: 0 };
      r.count++;
      if (s.isError) r.errors++;
      r.totalLatency += s.latencyMs;
      routeMap.set(key, r);
    }

    const topRoutes = Array.from(routeMap.values())
      .map((r) => ({
        route: r.route,
        count: r.count,
        errorRate: Number((r.errors / r.count).toFixed(4)),
        avgLatencyMs: Number((r.totalLatency / r.count).toFixed(2)),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      status: 'MEASURED',
      sampleCount: total,
      windowMs,
      requests: { total, success, error: errors, errorRate },
      latency,
      statusCodes: codes,
      topRoutes,
    };
  }

  /**
   * Persist a point-in-time PlatformMetricSnapshot.
   */
  async captureSnapshot(period = '5m', organizationId = null) {
    const summary = this.getMetricsSummary(5 * 60 * 1000, organizationId);
    const mem = process.memoryUsage();

    const snapshot = new PlatformMetricSnapshot({
      snapshotId: uuidv4(),
      period,
      timestamp: new Date(),
      organizationId,
      requests: {
        total: summary.requests.total,
        success: summary.requests.success,
        error: summary.requests.error,
        errorRate: summary.requests.errorRate,
        statusCodes: summary.statusCodes,
        latencyP50Ms: summary.latency.p50,
        latencyP95Ms: summary.latency.p95,
        latencyP99Ms: summary.latency.p99,
        avgLatencyMs: summary.latency.avg,
      },
      system: {
        memoryRssBytes: mem.rss,
        memoryHeapUsedBytes: mem.heapUsed,
        memoryHeapTotalBytes: mem.heapTotal,
        memoryExternalBytes: mem.external,
        uptimeSeconds: Math.floor(process.uptime()),
      },
      evidenceReferences: [
        `BUFFER_SAMPLES_${summary.sampleCount}`,
        `TOTAL_CUMULATIVE_REQUESTS_${this.totalRequests}`
      ],
    });

    await snapshot.save();
    return snapshot;
  }

  /**
   * Reset in-memory buffer (primarily for isolated test fixtures).
   */
  resetBuffer() {
    this.buffer = [];
    this.totalRequests = 0;
    this.totalSuccess = 0;
    this.totalErrors = 0;
    this.statusCodes.clear();
    this.routeStats.clear();
  }
}

module.exports = new APIObservabilityService();
