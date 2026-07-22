const mongoose = require('mongoose');

const assetSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      index: true,
      required: true,
    },
    // Legacy support for older systems assuming userId ownership
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      index: true,
    },
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      index: true,
      required: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    hostname: {
      type: String,
      required: true,
      trim: true,
    },
    ip: {
      type: String,
      trim: true,
    },
    domain: {
      type: String,
      trim: true,
    },
    url: {
      type: String,
      trim: true,
    },
    tags: [String],
    labels: {
      type: Map,
      of: String,
      default: {},
    },
    notes: {
      type: String,
      default: '',
    },
    environment: {
      type: String,
      enum: ['Production', 'Staging', 'Development'],
      default: 'Production',
    },
    owner: { // Legacy human-readable owner, preserving for compat
      type: String,
      default: 'System',
    },
    assetType: {
      type: String,
      enum: ['Server', 'Website', 'Domain', 'API', 'Mobile App', 'Cloud Resource'],
      required: true,
    },
    criticality: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium',
    },
    lastScanAt: Date,
    lastRiskScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    status: {
      type: String,
      enum: ['active', 'archived', 'deleted'],
      default: 'active',
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// New Organization-centric Indexes
assetSchema.index({ organizationId: 1, hostname: 1 }, { unique: true });
assetSchema.index({ organizationId: 1, domain: 1 });
assetSchema.index({ organizationId: 1, ip: 1 });
assetSchema.index({ organizationId: 1, status: 1 });
assetSchema.index({ organizationId: 1, criticality: 1 });
assetSchema.index({ organizationId: 1, tags: 1 });
assetSchema.index({ organizationId: 1, teamId: 1 });
assetSchema.index({ organizationId: 1, ownerId: 1 });

// Full-text search index for generic query
assetSchema.index({ hostname: 'text', ip: 'text', domain: 'text', url: 'text', tags: 'text' });

module.exports = mongoose.model('Asset', assetSchema);
