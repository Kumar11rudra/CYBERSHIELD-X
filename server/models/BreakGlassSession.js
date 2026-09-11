/**
 * 🛡️ CyberShield X — BreakGlassSession Model (Phase 75)
 *
 * Emergency access governance model.
 * Enforces narrow scope constraints, administrator approval gates,
 * automatic time-bounded expiration, and immutable activity recording.
 * Break-glass DOES NOT grant blanket admin authority—actions are checked against approved scope.
 */

const mongoose = require('mongoose');

const breakGlassSessionSchema = new mongoose.Schema(
  {
    sessionId: {
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
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    requester: {
      id: { type: String, required: true },
      username: { type: String, required: true },
      role: { type: String, required: true },
      email: { type: String, default: '' },
    },
    approver: {
      id: { type: String, default: null },
      username: { type: String, default: null },
      role: { type: String, default: null },
      email: { type: String, default: '' },
    },
    status: {
      type: String,
      enum: ['REQUESTED', 'ACTIVE', 'EXPIRED', 'REVOKED'],
      default: 'REQUESTED',
      index: true,
    },
    startedAt: {
      type: Date,
      default: null,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    revokedAt: {
      type: Date,
      default: null,
    },
    durationMinutes: {
      type: Number,
      default: 60,
      min: 5,
      max: 240,
    },
    scope: [
      {
        type: String,
        trim: true,
      },
    ],
    actionsTaken: [
      {
        action: { type: String, required: true },
        target: { type: String, default: '' },
        timestamp: { type: Date, default: Date.now },
        auditEventId: { type: String, default: null },
        outcome: { type: String, enum: ['SUCCESS', 'DENIED', 'FAILED'], default: 'SUCCESS' },
      },
    ],
    auditReferences: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

breakGlassSessionSchema.index({ organizationId: 1, sessionId: 1 });
breakGlassSessionSchema.index({ organizationId: 1, status: 1 });
breakGlassSessionSchema.index({ expiresAt: 1 });

module.exports = mongoose.models.BreakGlassSession || mongoose.model('BreakGlassSession', breakGlassSessionSchema);
