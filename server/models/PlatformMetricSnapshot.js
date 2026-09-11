/**
 * 🛡️ CyberShield X — PlatformMetricSnapshot Model (Phase 76)
 *
 * Real observed platform metric snapshots across API, DB, Jobs, Events, and Resources.
 * Strictly avoids synthetic trend fabrication.
 */

const mongoose = require('mongoose');

const platformMetricSnapshotSchema = new mongoose.Schema(
  {
    snapshotId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    period: {
      type: String,
      enum: ['1m', '5m', '15m', '1h', '24h', 'REALTIME'],
      default: '5m',
      index: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    organizationId: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
      index: true,
    },
    requests: {
      total: { type: Number, default: 0 },
      success: { type: Number, default: 0 },
      error: { type: Number, default: 0 },
      errorRate: { type: Number, default: 0 },
      statusCodes: { type: mongoose.Schema.Types.Mixed, default: {} },
      latencyP50Ms: { type: Number, default: null },
      latencyP95Ms: { type: Number, default: null },
      latencyP99Ms: { type: Number, default: null },
      avgLatencyMs: { type: Number, default: null },
    },
    database: {
      connectionState: { type: String, default: 'UNKNOWN' },
      pingLatencyMs: { type: Number, default: null },
      activeConnections: { type: Number, default: null },
      availableConnections: { type: Number, default: null },
      operationFailures: { type: Number, default: 0 },
    },
    jobs: {
      queued: { type: Number, default: 0 },
      running: { type: Number, default: 0 },
      completed: { type: Number, default: 0 },
      failed: { type: Number, default: 0 },
      cancelled: { type: Number, default: 0 },
      stuckCount: { type: Number, default: 0 },
      oldestPendingAgeMs: { type: Number, default: null },
    },
    events: {
      connectedClients: { type: Number, default: 0 },
      totalEmitted: { type: Number, default: 0 },
      failedEmissions: { type: Number, default: 0 },
      eventBacklog: { type: Number, default: 0 },
    },
    system: {
      memoryRssBytes: { type: Number, default: null },
      memoryHeapUsedBytes: { type: Number, default: null },
      memoryHeapTotalBytes: { type: Number, default: null },
      memoryExternalBytes: { type: Number, default: null },
      uptimeSeconds: { type: Number, default: null },
      eventLoopLagMs: { type: Number, default: null },
    },
    evidenceReferences: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

platformMetricSnapshotSchema.index({ timestamp: -1 });
platformMetricSnapshotSchema.index({ organizationId: 1, timestamp: -1 });

module.exports = mongoose.model('PlatformMetricSnapshot', platformMetricSnapshotSchema);
