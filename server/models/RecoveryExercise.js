/**
 * 🛡️ CyberShield X — RecoveryExercise Model (Phase 76)
 *
 * Disaster Recovery exercise workflow and real measurement tracking.
 * Lifecycle: PLANNED → APPROVED → RUNNING → COMPLETED / FAILED → CLOSED.
 * Real observed RTO/RPO values only—zero fictional recovery statistics.
 */

const mongoose = require('mongoose');

const recoveryExerciseSchema = new mongoose.Schema(
  {
    exerciseId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    scope: {
      type: String,
      required: true,
      trim: true,
    },
    targetBackupId: {
      type: String,
      default: null,
      index: true,
    },
    organizationId: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
      index: true,
    },
    status: {
      type: String,
      enum: ['PLANNED', 'APPROVED', 'RUNNING', 'COMPLETED', 'FAILED', 'CLOSED'],
      default: 'PLANNED',
      index: true,
    },
    plannedBy: {
      userId: { type: String, required: true },
      username: { type: String, required: true },
    },
    authorizedBy: {
      userId: { type: String, default: null },
      username: { type: String, default: null },
      authorizedAt: { type: Date, default: null },
    },
    startedAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    observedRTOSeconds: {
      type: Number,
      default: null,
    },
    observedRPOSeconds: {
      type: Number,
      default: null,
    },
    resultSummary: {
      type: String,
      default: '',
    },
    blockers: {
      type: [String],
      default: [],
    },
    auditReferences: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

recoveryExerciseSchema.index({ organizationId: 1, status: 1 });
recoveryExerciseSchema.index({ createdAt: -1 });

module.exports = mongoose.model('RecoveryExercise', recoveryExerciseSchema);
