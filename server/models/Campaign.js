/**
 * 🛡️ CyberShield X — Campaign Model (Phase 71)
 *
 * Implements structured threat intelligence campaigns, tracking
 * temporal activity windows, threat actor linkages, targeted assets, and associated IOCs.
 */

const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema(
  {
    campaignId: {
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
      maxlength: 140,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    threatActorId: {
      type: String,
      default: null,
      index: true,
    },
    threatActorName: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'MONITORED', 'HISTORICAL'],
      default: 'ACTIVE',
      index: true,
    },
    timeframe: {
      firstObserved: { type: Date, default: Date.now },
      lastObserved: { type: Date, default: Date.now },
    },
    targetedAssets: [{ type: String, trim: true }],
    associatedIOCs: [
      {
        type: { type: String, required: true },
        value: { type: String, required: true },
      },
    ],
    mitreTechniques: [
      {
        techniqueId: { type: String, required: true },
        tactic: { type: String, required: true },
        techniqueName: { type: String, required: true },
      },
    ],
    organizationId: {
      type: String,
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

campaignSchema.index({ organizationId: 1, status: 1 });
campaignSchema.index({ organizationId: 1, campaignId: 1 });

module.exports = mongoose.model('Campaign', campaignSchema);
