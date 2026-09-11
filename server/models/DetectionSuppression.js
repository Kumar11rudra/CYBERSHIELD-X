/**
 * 🛡️ CyberShield X — DetectionSuppression Model (Phase 70)
 *
 * Enforces temporary, audited rule suppressions with mandatory expiration dates.
 * Expired suppressions automatically stop matching (zero permanent silent suppression).
 */

const mongoose = require('mongoose');

const detectionSuppressionSchema = new mongoose.Schema(
  {
    suppressionId: {
      type: String,
      default: () => `SUPP-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      unique: true,
      index: true,
      trim: true,
    },
    ruleId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    pattern: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    reason: {
      type: String,
      required: [true, 'Suppression justification reason is mandatory'],
      trim: true,
      maxlength: 500,
    },
    actor: {
      userId: { type: String, default: 'operator' },
      username: { type: String, default: 'operator' },
      role: { type: String, default: 'OPERATOR' },
    },
    scope: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    startTime: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      required: [true, 'Suppression expiration date is mandatory'],
      index: true,
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
    organizationId: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

detectionSuppressionSchema.index({ ruleId: 1, active: 1, expiresAt: 1 });

module.exports = mongoose.models.DetectionSuppression || mongoose.model('DetectionSuppression', detectionSuppressionSchema);
