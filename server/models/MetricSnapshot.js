/**
 * 🛡️ CyberShield X — MetricSnapshot Model (Phase 74)
 *
 * Persists historical operational and performance metric snapshots.
 * Guarantees zero synthetic trend extrapolation by capturing point-in-time facts.
 */

const mongoose = require('mongoose');

const metricSnapshotSchema = new mongoose.Schema(
  {
    snapshotId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    period: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    kpis: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    mtta: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    mttr: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    sla: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    trends: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    organizationId: {
      type: mongoose.Schema.Types.Mixed,
      index: true,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

metricSnapshotSchema.index({ organizationId: 1, snapshotId: 1 });
metricSnapshotSchema.index({ organizationId: 1, timestamp: -1 });

module.exports = mongoose.models.MetricSnapshot || mongoose.model('MetricSnapshot', metricSnapshotSchema);
