/**
 * 🛡️ CyberShield X — GovernancePolicyRevision Model (Phase 75)
 *
 * Immutable append-only audit trail preserving exact configuration snapshots
 * for every policy change, update, and rollback.
 * Uses SHA-256 content hashes to guarantee zero silent modification.
 */

const mongoose = require('mongoose');

const governancePolicyRevisionSchema = new mongoose.Schema(
  {
    policyId: {
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
    version: {
      type: Number,
      required: true,
      min: 1,
    },
    configurationSnapshot: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    changeSummary: {
      type: String,
      default: '',
      trim: true,
    },
    changedBy: {
      id: { type: String, default: 'system' },
      username: { type: String, default: 'SYSTEM' },
      role: { type: String, default: 'OPERATOR' },
    },
    contentHash: {
      type: String,
      required: true,
      index: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      immutable: true,
    },
  },
  {
    timestamps: false,
    versionKey: false,
  }
);

governancePolicyRevisionSchema.index({ organizationId: 1, policyId: 1, version: 1 }, { unique: true });
governancePolicyRevisionSchema.index({ organizationId: 1, contentHash: 1 });

module.exports =
  mongoose.models.GovernancePolicyRevision ||
  mongoose.model('GovernancePolicyRevision', governancePolicyRevisionSchema);
