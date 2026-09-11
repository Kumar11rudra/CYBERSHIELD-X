/**
 * 🛡️ CyberShield X — RetentionPolicy Model (Phase 75)
 *
 * Centralizes data lifecycle and retention governance across all operational entities.
 * Supports HOT, ARCHIVE, EXPIRE retention tiers and enforces strict LEGAL_HOLD locks
 * that definitively block destructive lifecycle operations.
 */

const mongoose = require('mongoose');

const retentionPolicySchema = new mongoose.Schema(
  {
    retentionId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    organizationId: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    entityType: {
      type: String,
      required: true,
      enum: [
        'audit_events',
        'reports',
        'evidence_packages',
        'incidents',
        'cases',
        'findings',
        'alerts',
        'threat_hunts',
        'threat_hunt_executions',
        'detection_rules',
        'metric_snapshots',
      ],
      index: true,
    },
    retentionDays: {
      type: Number,
      required: true,
      min: 1,
      default: 90,
    },
    retentionClass: {
      type: String,
      enum: ['HOT', 'ARCHIVE', 'EXPIRE', 'LEGAL_HOLD'],
      default: 'EXPIRE',
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'DISABLED'],
      default: 'ACTIVE',
      index: true,
    },
    legalHoldActive: {
      type: Boolean,
      default: false,
      index: true,
    },
    legalHoldReason: {
      type: String,
      default: '',
    },
    legalHoldAppliedBy: {
      id: { type: String, default: null },
      username: { type: String, default: null },
      role: { type: String, default: null },
    },
    legalHoldAppliedAt: {
      type: Date,
      default: null,
    },
    lastEvaluatedAt: {
      type: Date,
      default: null,
    },
    lastExecutedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

retentionPolicySchema.index({ organizationId: 1, retentionId: 1 });
retentionPolicySchema.index({ organizationId: 1, entityType: 1 });
retentionPolicySchema.index({ organizationId: 1, legalHoldActive: 1 });

module.exports = mongoose.models.RetentionPolicy || mongoose.model('RetentionPolicy', retentionPolicySchema);
