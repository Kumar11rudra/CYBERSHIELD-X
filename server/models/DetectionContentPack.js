/**
 * 🛡️ CyberShield X — DetectionContentPack Model (Phase 73)
 *
 * Defines versioned, signed, and validated detection content bundles:
 * Core SOC Pack, Network Detection Pack, Identity Detection Pack, etc.
 */

const mongoose = require('mongoose');

const detectionContentPackSchema = new mongoose.Schema(
  {
    packId: {
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
    description: {
      type: String,
      default: '',
      trim: true,
    },
    version: {
      type: String,
      default: '1.0.0',
      trim: true,
    },
    category: {
      type: String,
      default: 'SOC_CORE',
      index: true,
    },
    author: {
      type: String,
      default: 'CyberShield Detection Engineering Team',
    },
    status: {
      type: String,
      enum: ['DRAFT', 'VALIDATED', 'TESTED', 'APPROVED', 'ACTIVE', 'RETIRED'],
      default: 'ACTIVE',
      index: true,
    },
    rules: [
      {
        ruleId: { type: String, required: true },
        name: { type: String, required: true },
        description: { type: String, default: '' },
        severity: { type: String, default: 'MEDIUM' },
        category: { type: String, default: 'CUSTOM' },
        mitreAttack: [
          {
            tactic: { type: String },
            techniqueId: { type: String },
            techniqueName: { type: String },
          },
        ],
        conditions: { type: Array, default: [] },
        testFixtures: { type: Array, default: [] },
      },
    ],
    mitreAttack: [
      {
        tactic: { type: String },
        techniqueId: { type: String },
        techniqueName: { type: String },
      },
    ],
    compatibility: {
      minEngineVersion: { type: String, default: '1.0.0' },
      requiredDataSources: [{ type: String }],
    },
    releaseNotes: {
      type: String,
      default: '',
    },
    checksum: {
      type: String,
      default: '',
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

detectionContentPackSchema.index({ organizationId: 1, status: 1 });
detectionContentPackSchema.index({ organizationId: 1, category: 1 });

module.exports =
  mongoose.models.DetectionContentPack ||
  mongoose.model('DetectionContentPack', detectionContentPackSchema);
