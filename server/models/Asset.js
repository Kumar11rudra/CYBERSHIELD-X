const mongoose = require('mongoose');

const assetSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      index: true,
      required: false,
    },
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      index: true,
      required: false,
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
    tags: [String],
    environment: {
      type: String,
      enum: ['Production', 'Staging', 'Development'],
      default: 'Production',
    },
    owner: {
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
      enum: ['active', 'inactive', 'maintenance'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

// Enforce compound uniqueness for assets scoped to each user account
assetSchema.index({ userId: 1, hostname: 1 }, { unique: true });

module.exports = mongoose.model('Asset', assetSchema);
