/**
 * 🛡️ CyberShield X — ServiceHealthSnapshot Model (Phase 76)
 *
 * Real observed subsystem and dependency health snapshots.
 * Adheres to Permanent Constitution: Zero synthetic observability.
 * A service without telemetry is UNKNOWN, not HEALTHY.
 */

const mongoose = require('mongoose');

const serviceHealthSnapshotSchema = new mongoose.Schema(
  {
    snapshotId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    serviceId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    serviceName: {
      type: String,
      required: true,
      trim: true,
    },
    organizationId: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
      index: true,
    },
    status: {
      type: String,
      enum: ['HEALTHY', 'DEGRADED', 'UNHEALTHY', 'UNKNOWN', 'NOT_CONFIGURED', 'BLOCKED'],
      default: 'UNKNOWN',
      index: true,
    },
    observedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    latencyMs: {
      type: Number,
      default: null,
    },
    errorRate: {
      type: Number,
      default: null,
    },
    dependencyStatus: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
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

serviceHealthSnapshotSchema.index({ serviceId: 1, observedAt: -1 });
serviceHealthSnapshotSchema.index({ organizationId: 1, serviceId: 1, observedAt: -1 });

module.exports = mongoose.model('ServiceHealthSnapshot', serviceHealthSnapshotSchema);
