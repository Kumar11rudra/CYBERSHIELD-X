const mongoose = require('mongoose');

const VaultAssetSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['email', 'phone', 'device', 'key'],
    required: true
  },
  label: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  value: {
    type: String,
    required: true
  },
  valueHash: {
    type: String,
    index: true
  },
  isLocked: {
    type: Boolean,
    default: false
  },
  riskScore: {
    type: Number,
    default: 0, // 0-100
    min: 0,
    max: 100
  },
  lastMonitored: {
    type: Date,
    default: Date.now
  },
  threatIntelligence: {
    mentionsInDarkWeb: { type: Number, default: 0 },
    activeTargeting: { type: Boolean, default: false },
    marketValueEstimate: { type: String, default: '$0.00' }
  }
}, { timestamps: true });

VaultAssetSchema.index({ userId: 1, type: 1, valueHash: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('VaultAsset', VaultAssetSchema);
