const mongoose = require('mongoose');

const scanSchema = new mongoose.Schema(
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
    target: {
      type: String,
      required: true,
      trim: true,
    },
    targetType: {
      type: String,
      enum: ['url', 'ip', 'domain', 'hash'],
      required: true,
    },
    threatScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    riskLevel: {
      type: String,
      enum: ['safe', 'low', 'medium', 'dangerous'],
      default: 'safe',
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'completed',
    },
    scanType: {
      type: String,
      default: 'general',
    },
    options: mongoose.Schema.Types.Mixed,
    incidentTier: {
      type: String, // CRITICAL, HIGH, MEDIUM, LOW
      index: true,
    },
    sourceScores: {
      virusTotal: Number,
      abuseIPDB: Number,
      domainIntel: Number,
      hashlookup: Number,
      synthetic: Number,
    },
    breakdown: {
      virusTotal: mongoose.Schema.Types.Mixed,
      abuseIPDB: mongoose.Schema.Types.Mixed,
      domainIntel: mongoose.Schema.Types.Mixed,
      hashlookup: mongoose.Schema.Types.Mixed,
      synthetic: mongoose.Schema.Types.Mixed,
    },
    alertSent: {
      type: Boolean,
      default: false,
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
    location: {
      lat: Number,
      lon: Number,
      country: String,
      city: String,
      countryCode: String,
    },
    tags: [String],
    notes: String,
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
scanSchema.index({ userId: 1, createdAt: -1 });
scanSchema.index({ threatScore: -1 });
scanSchema.index({ riskLevel: 1 });

module.exports = mongoose.model('Scan', scanSchema);
