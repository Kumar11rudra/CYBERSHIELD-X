/**
 * 🛡️ CyberShield X — CloudObservabilityService (Phase 80 Step 8)
 *
 * Production Observability, Health & Telemetry Metrics Service for Multi-Cloud Ingestion:
 * - Metrics counters, gauges, and latency histograms for AWS, GCP, and Azure ingestion pipelines.
 * - Low-cardinality enforcement: strictly bounded dimensions (AWS, GCP, AZURE, UNKNOWN).
 * - Bounded 12-tier reason classification preventing cardinality explosion.
 * - Non-blocking error resilience: metric recording failures never interrupt ingestion or acknowledgments.
 * - Safe health assessment: MongoDB connectivity, graph projection state, reconciliation backlog, provider health.
 * - Zero credentials, tokens, secrets, tenant IDs, account IDs, or raw payloads exposed.
 */

'use strict';

const mongoose = require('mongoose');
const logger = require('../../utils/logger');

// Authoritative low-cardinality provider dimensions
const ALLOWED_PROVIDERS = new Set(['AWS', 'GCP', 'AZURE']);

// Authoritative low-cardinality failure categories
const VALID_REASONS = new Set([
  'AUTHENTICATION_FAILURE',
  'SIGNATURE_FAILURE',
  'TENANT_REJECTION',
  'ACCOUNT_REJECTION',
  'MALFORMED_REQUEST',
  'NORMALIZATION_FAILURE',
  'PERSISTENCE_FAILURE',
  'DUPLICATE',
  'RATE_LIMITED',
  'GRAPH_PROJECTION_FAILURE',
  'RECONCILIATION_FAILURE',
  'INTERNAL_ERROR',
]);

// Sliding window size for latency percentiles
const LATENCY_BUFFER_SIZE = 100;

class BoundedHistogram {
  constructor(name) {
    this.name = name;
    this.count = 0;
    this.sum = 0;
    this.min = Infinity;
    this.max = 0;
    this.samples = [];
  }

  record(durationMs) {
    if (typeof durationMs !== 'number' || isNaN(durationMs) || durationMs < 0) return;
    this.count++;
    this.sum += durationMs;
    if (durationMs < this.min) this.min = durationMs;
    if (durationMs > this.max) this.max = durationMs;

    if (this.samples.length >= LATENCY_BUFFER_SIZE) {
      this.samples.shift();
    }
    this.samples.push(durationMs);
  }

  getStats() {
    if (this.count === 0) {
      return { count: 0, sum: 0, avg: 0, min: 0, max: 0, p50: 0, p95: 0, p99: 0 };
    }

    const sorted = [...this.samples].sort((a, b) => a - b);
    const p50 = sorted[Math.floor(sorted.length * 0.5)] || 0;
    const p95 = sorted[Math.floor(sorted.length * 0.95)] || 0;
    const p99 = sorted[Math.floor(sorted.length * 0.99)] || 0;

    return {
      count: this.count,
      sum: Number(this.sum.toFixed(2)),
      avg: Number((this.sum / this.count).toFixed(2)),
      min: this.min === Infinity ? 0 : Number(this.min.toFixed(2)),
      max: Number(this.max.toFixed(2)),
      p50: Number(p50.toFixed(2)),
      p95: Number(p95.toFixed(2)),
      p99: Number(p99.toFixed(2)),
    };
  }

  reset() {
    this.count = 0;
    this.sum = 0;
    this.min = Infinity;
    this.max = 0;
    this.samples = [];
  }
}

class CloudObservabilityService {
  constructor() {
    this.reset();
  }

  /**
   * Reset all internal state (for testing isolation and maintenance).
   */
  reset() {
    // Ingestion Counters
    this.requestsTotal = new Map(); // provider -> count
    this.acceptedTotal = new Map(); // provider -> count
    this.rejectedTotal = new Map(); // `${provider}:${reason}` -> count
    this.duplicatesTotal = new Map(); // provider -> count
    this.persistenceFailuresTotal = new Map(); // provider -> count
    this.verificationFailuresTotal = new Map(); // `${provider}:${reason}` -> count
    this.rateLimitedTotal = new Map(); // provider -> count

    // Latency Histograms
    this.verificationDuration = new BoundedHistogram('cloud_ingestion_verification_duration');
    this.normalizationDuration = new BoundedHistogram('cloud_ingestion_normalization_duration');
    this.persistenceDuration = new BoundedHistogram('cloud_ingestion_persistence_duration');
    this.totalDuration = new BoundedHistogram('cloud_ingestion_total_duration');
    this.projectionDuration = new BoundedHistogram('cloud_projection_duration');

    // Graph Projection Counters & Gauges
    this.projectionPending = 0;
    this.projectionMaterializedTotal = new Map(); // provider -> count
    this.projectionSkippedReadFilterTotal = new Map(); // provider -> count
    this.projectionRetryTotal = new Map(); // provider -> count
    this.projectionFailedTotal = new Map(); // provider -> count
    this.projectionPoisonFailedTotal = new Map(); // provider -> count

    // Reconciliation Metrics
    this.reconciliationRunsTotal = 0;
    this.reconciliationBatchesTotal = 0;
    this.reconciliationFailuresTotal = 0;
    this.reconciliationBacklog = 0;
    this.reconciliationMaterializedTotal = 0;
    this.reconciliationWorkerActive = false;
    this.lastReconciliationAt = null;

    // Failure timestamps for provider health calculation
    this.recentProviderFailures = new Map(); // provider -> Array<timestamp>
    this._readyStateOverride = null;
  }

  // ─── Low Cardinality Whitelist Helpers ─────────────────────────────────────

  /**
   * Normalize provider dimension to low-cardinality values: AWS, GCP, AZURE, UNKNOWN.
   */
  normalizeProvider(provider) {
    if (!provider || typeof provider !== 'string') return 'UNKNOWN';
    const normalized = provider.trim().toUpperCase();
    return ALLOWED_PROVIDERS.has(normalized) ? normalized : 'UNKNOWN';
  }

  /**
   * Normalize reason dimension to low-cardinality categories.
   */
  normalizeReason(reason) {
    if (!reason || typeof reason !== 'string') return 'INTERNAL_ERROR';
    const cleanReason = reason.trim().toUpperCase();

    if (VALID_REASONS.has(cleanReason)) {
      return cleanReason;
    }

    // Mapping raw error strings to canonical categories
    if (cleanReason.includes('SIGNATURE') || cleanReason.includes('CERT')) return 'SIGNATURE_FAILURE';
    if (cleanReason.includes('AUTH') || cleanReason.includes('TOKEN') || cleanReason.includes('KEY') || cleanReason.includes('SECRET')) return 'AUTHENTICATION_FAILURE';
    if (cleanReason.includes('TENANT')) return 'TENANT_REJECTION';
    if (cleanReason.includes('ACCOUNT')) return 'ACCOUNT_REJECTION';
    if (cleanReason.includes('RATE_LIMIT')) return 'RATE_LIMITED';
    if (cleanReason.includes('DUPLICATE')) return 'DUPLICATE';
    if (cleanReason.includes('NORMALI') || cleanReason.includes('ENVELOPE')) return 'NORMALIZATION_FAILURE';
    if (cleanReason.includes('PERSIST') || cleanReason.includes('MONGO') || cleanReason.includes('DB')) return 'PERSISTENCE_FAILURE';
    if (cleanReason.includes('PROJECTION') || cleanReason.includes('GRAPH')) return 'GRAPH_PROJECTION_FAILURE';
    if (cleanReason.includes('RECONCIL')) return 'RECONCILIATION_FAILURE';
    if (cleanReason.includes('PAYLOAD') || cleanReason.includes('BODY') || cleanReason.includes('SIZE') || cleanReason.includes('MALFORMED')) return 'MALFORMED_REQUEST';

    return 'INTERNAL_ERROR';
  }

  // ─── Ingestion Instrumentation Hooks ──────────────────────────────────────

  recordRequest(rawProvider) {
    try {
      const provider = this.normalizeProvider(rawProvider);
      const count = (this.requestsTotal.get(provider) || 0) + 1;
      this.requestsTotal.set(provider, count);
    } catch (err) {
      // Non-blocking
    }
  }

  recordAccepted(rawProvider) {
    try {
      const provider = this.normalizeProvider(rawProvider);
      const count = (this.acceptedTotal.get(provider) || 0) + 1;
      this.acceptedTotal.set(provider, count);
    } catch (err) {
      // Non-blocking
    }
  }

  recordRejected(rawProvider, rawReason) {
    try {
      const provider = this.normalizeProvider(rawProvider);
      const reason = this.normalizeReason(rawReason);
      const key = `${provider}:${reason}`;
      const count = (this.rejectedTotal.get(key) || 0) + 1;
      this.rejectedTotal.set(key, count);
      this.recordProviderFailure(provider);
    } catch (err) {
      // Non-blocking
    }
  }

  recordDuplicate(rawProvider) {
    try {
      const provider = this.normalizeProvider(rawProvider);
      const count = (this.duplicatesTotal.get(provider) || 0) + 1;
      this.duplicatesTotal.set(provider, count);
    } catch (err) {
      // Non-blocking
    }
  }

  recordPersistenceFailure(rawProvider) {
    try {
      const provider = this.normalizeProvider(rawProvider);
      const count = (this.persistenceFailuresTotal.get(provider) || 0) + 1;
      this.persistenceFailuresTotal.set(provider, count);
      this.recordProviderFailure(provider);
    } catch (err) {
      // Non-blocking
    }
  }

  recordVerificationFailure(rawProvider, rawReason) {
    try {
      const provider = this.normalizeProvider(rawProvider);
      const reason = this.normalizeReason(rawReason);
      const key = `${provider}:${reason}`;
      const count = (this.verificationFailuresTotal.get(key) || 0) + 1;
      this.verificationFailuresTotal.set(key, count);
      this.recordProviderFailure(provider);
    } catch (err) {
      // Non-blocking
    }
  }

  recordRateLimited(rawProvider) {
    try {
      const provider = this.normalizeProvider(rawProvider);
      const count = (this.rateLimitedTotal.get(provider) || 0) + 1;
      this.rateLimitedTotal.set(provider, count);
      this.recordRejected(provider, 'RATE_LIMITED');
    } catch (err) {
      // Non-blocking
    }
  }

  // ─── Latency Trackers ──────────────────────────────────────────────────────

  recordVerificationDuration(durationMs) {
    try {
      this.verificationDuration.record(durationMs);
    } catch (err) {
      // Non-blocking
    }
  }

  recordNormalizationDuration(durationMs) {
    try {
      this.normalizationDuration.record(durationMs);
    } catch (err) {
      // Non-blocking
    }
  }

  recordPersistenceDuration(durationMs) {
    try {
      this.persistenceDuration.record(durationMs);
    } catch (err) {
      // Non-blocking
    }
  }

  recordTotalDuration(durationMs) {
    try {
      this.totalDuration.record(durationMs);
    } catch (err) {
      // Non-blocking
    }
  }

  // ─── Graph Projection Instrumentation Hooks ───────────────────────────────

  setPendingCount(count) {
    try {
      this.projectionPending = Math.max(0, parseInt(count, 10) || 0);
    } catch (err) {
      // Non-blocking
    }
  }

  recordProjectionMaterialized(rawProvider) {
    try {
      const provider = this.normalizeProvider(rawProvider);
      const count = (this.projectionMaterializedTotal.get(provider) || 0) + 1;
      this.projectionMaterializedTotal.set(provider, count);
      if (this.projectionPending > 0) this.projectionPending--;
    } catch (err) {
      // Non-blocking
    }
  }

  recordProjectionSkipped(rawProvider) {
    try {
      const provider = this.normalizeProvider(rawProvider);
      const count = (this.projectionSkippedReadFilterTotal.get(provider) || 0) + 1;
      this.projectionSkippedReadFilterTotal.set(provider, count);
      if (this.projectionPending > 0) this.projectionPending--;
    } catch (err) {
      // Non-blocking
    }
  }

  recordProjectionRetry(rawProvider) {
    try {
      const provider = this.normalizeProvider(rawProvider);
      const count = (this.projectionRetryTotal.get(provider) || 0) + 1;
      this.projectionRetryTotal.set(provider, count);
    } catch (err) {
      // Non-blocking
    }
  }

  recordProjectionFailed(rawProvider) {
    try {
      const provider = this.normalizeProvider(rawProvider);
      const count = (this.projectionFailedTotal.get(provider) || 0) + 1;
      this.projectionFailedTotal.set(provider, count);
    } catch (err) {
      // Non-blocking
    }
  }

  recordProjectionPoison(rawProvider) {
    try {
      const provider = this.normalizeProvider(rawProvider);
      const count = (this.projectionPoisonFailedTotal.get(provider) || 0) + 1;
      this.projectionPoisonFailedTotal.set(provider, count);
      if (this.projectionPending > 0) this.projectionPending--;
    } catch (err) {
      // Non-blocking
    }
  }

  recordProjectionDuration(durationMs) {
    try {
      this.projectionDuration.record(durationMs);
    } catch (err) {
      // Non-blocking
    }
  }

  // ─── Reconciliation Instrumentation Hooks ──────────────────────────────────

  recordReconciliationRun() {
    try {
      this.reconciliationRunsTotal++;
      this.lastReconciliationAt = new Date().toISOString();
    } catch (err) {
      // Non-blocking
    }
  }

  recordReconciliationBatch(batchSize) {
    try {
      this.reconciliationBatchesTotal++;
    } catch (err) {
      // Non-blocking
    }
  }

  recordReconciliationFailure() {
    try {
      this.reconciliationFailuresTotal++;
    } catch (err) {
      // Non-blocking
    }
  }

  recordReconciliationBacklog(backlogCount) {
    try {
      this.reconciliationBacklog = Math.max(0, parseInt(backlogCount, 10) || 0);
      this.projectionPending = this.reconciliationBacklog;
    } catch (err) {
      // Non-blocking
    }
  }

  recordReconciliationMaterialized(count) {
    try {
      const added = Math.max(0, parseInt(count, 10) || 0);
      this.reconciliationMaterializedTotal += added;
    } catch (err) {
      // Non-blocking
    }
  }

  setReconciliationWorkerActive(isActive) {
    try {
      this.reconciliationWorkerActive = Boolean(isActive);
    } catch (err) {
      // Non-blocking
    }
  }

  recordProviderFailure(provider) {
    try {
      if (!this.recentProviderFailures.has(provider)) {
        this.recentProviderFailures.set(provider, []);
      }
      const list = this.recentProviderFailures.get(provider);
      const now = Date.now();
      list.push(now);

      // Keep only failures in the last 5 minutes (300,000 ms)
      const cutoff = now - 300000;
      while (list.length > 0 && list[0] < cutoff) {
        list.shift();
      }
    } catch (err) {
      // Non-blocking
    }
  }

  // ─── Aggregation & Safe Metrics Snapshot ───────────────────────────────────

  getMapTotal(map) {
    let sum = 0;
    for (const val of map.values()) {
      sum += val;
    }
    return sum;
  }

  mapToRecord(map) {
    const record = {};
    for (const [k, v] of map.entries()) {
      record[k] = v;
    }
    return record;
  }

  /**
   * Return complete low-cardinality, sanitized metrics snapshot.
   */
  getMetrics() {
    return {
      ingestion: {
        cloud_ingestion_requests_total: this.getMapTotal(this.requestsTotal),
        cloud_ingestion_accepted_total: this.getMapTotal(this.acceptedTotal),
        cloud_ingestion_rejected_total: this.getMapTotal(this.rejectedTotal),
        cloud_ingestion_duplicates_total: this.getMapTotal(this.duplicatesTotal),
        cloud_ingestion_persistence_failures_total: this.getMapTotal(this.persistenceFailuresTotal),
        cloud_ingestion_verification_failures_total: this.getMapTotal(this.verificationFailuresTotal),
        cloud_ingestion_rate_limited_total: this.getMapTotal(this.rateLimitedTotal),
        by_provider: {
          requests: this.mapToRecord(this.requestsTotal),
          accepted: this.mapToRecord(this.acceptedTotal),
          duplicates: this.mapToRecord(this.duplicatesTotal),
          persistence_failures: this.mapToRecord(this.persistenceFailuresTotal),
          rate_limited: this.mapToRecord(this.rateLimitedTotal),
        },
        rejections_by_reason: this.mapToRecord(this.rejectedTotal),
        verification_failures_by_reason: this.mapToRecord(this.verificationFailuresTotal),
      },
      latency: {
        cloud_ingestion_verification_duration: this.verificationDuration.getStats(),
        cloud_ingestion_normalization_duration: this.normalizationDuration.getStats(),
        cloud_ingestion_persistence_duration: this.persistenceDuration.getStats(),
        cloud_ingestion_total_duration: this.totalDuration.getStats(),
        cloud_projection_duration: this.projectionDuration.getStats(),
      },
      projection: {
        cloud_projection_pending: this.projectionPending,
        cloud_projection_materialized_total: this.getMapTotal(this.projectionMaterializedTotal),
        cloud_projection_skipped_read_filter_total: this.getMapTotal(this.projectionSkippedReadFilterTotal),
        cloud_projection_retry_total: this.getMapTotal(this.projectionRetryTotal),
        cloud_projection_failed_total: this.getMapTotal(this.projectionFailedTotal),
        cloud_projection_poison_failed_total: this.getMapTotal(this.projectionPoisonFailedTotal),
        by_provider: {
          materialized: this.mapToRecord(this.projectionMaterializedTotal),
          skipped: this.mapToRecord(this.projectionSkippedReadFilterTotal),
          retries: this.mapToRecord(this.projectionRetryTotal),
          failed: this.mapToRecord(this.projectionFailedTotal),
          poison: this.mapToRecord(this.projectionPoisonFailedTotal),
        },
      },
      reconciliation: {
        reconciliation_runs_total: this.reconciliationRunsTotal,
        reconciliation_batches_total: this.reconciliationBatchesTotal,
        reconciliation_failures_total: this.reconciliationFailuresTotal,
        reconciliation_backlog: this.reconciliationBacklog,
        reconciliation_events_materialized_total: this.reconciliationMaterializedTotal,
        worker_active: this.reconciliationWorkerActive,
        last_reconciliation_at: this.lastReconciliationAt,
      },
    };
  }

  // ─── Health Assessment ─────────────────────────────────────────────────────

  /**
   * Assess the operational health of the Phase 80 ingestion pipeline.
   * Redacts all sensitive variables, connection strings, keys, and credentials.
   */
  async getHealth() {
    // 1. Persistence Dependency Health
    const readyState = this._readyStateOverride != null ? this._readyStateOverride : mongoose.connection.readyState;
    const isMongoConnected = readyState === 1;
    const persistenceStatus = isMongoConnected ? 'HEALTHY' : 'UNAVAILABLE';

    // 2. Graph Projection & Poison Health
    const totalPoison = this.getMapTotal(this.projectionPoisonFailedTotal);
    const graphDegraded = totalPoison > 0 || this.reconciliationFailuresTotal > 0;
    const graphStatus = graphDegraded ? 'DEGRADED' : 'HEALTHY';

    // 3. Provider Aggregate Health
    const now = Date.now();
    const cutoff = now - 300000; // last 5 minutes
    const providerHealth = {};

    for (const provider of ['AWS', 'GCP', 'AZURE']) {
      const failureList = (this.recentProviderFailures.get(provider) || []).filter((t) => t >= cutoff);
      const totalReq = this.requestsTotal.get(provider) || 0;

      if (!isMongoConnected) {
        providerHealth[provider] = 'DEGRADED';
      } else if (failureList.length > 20) {
        providerHealth[provider] = 'DEGRADED';
      } else {
        providerHealth[provider] = 'OPERATIONAL';
      }
    }

    // 4. Ingestion Subsystem Overall Status
    const overallStatus = isMongoConnected
      ? graphDegraded
        ? 'DEGRADED'
        : 'HEALTHY'
      : 'UNAVAILABLE';

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      dependencies: {
        mongodb_persistence: {
          status: persistenceStatus,
          readyState,
        },
        graph_projection: {
          status: graphStatus,
          pendingBacklog: this.projectionPending,
          poisonFailedEvents: totalPoison,
        },
        reconciliation_worker: {
          status: this.reconciliationWorkerActive ? 'RUNNING' : 'IDLE',
          lastRun: this.lastReconciliationAt,
        },
      },
      providers: providerHealth,
    };
  }
}

// Export singleton instance and class definition
const defaultObservabilityService = new CloudObservabilityService();

module.exports = {
  CloudObservabilityService,
  defaultObservabilityService,
  ALLOWED_PROVIDERS,
  VALID_REASONS,
};
