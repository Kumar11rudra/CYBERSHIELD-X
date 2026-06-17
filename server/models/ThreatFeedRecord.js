const mongoose = require('mongoose');

const threatFeedRecordSchema = new mongoose.Schema(
  {
    source: {
      type: String,
      enum: ['URLHaus', 'OpenPhish', 'FeodoTracker', 'CISA-KEV'],
      required: true,
      index: true,
    },
    indicator: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    indicatorType: {
      type: String,
      enum: ['ip', 'domain', 'url', 'cve'],
      required: true,
    },
    firstSeen: {
      type: Date,
      default: Date.now,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    confidence: {
      type: Number,
      min: 0,
      max: 100,
      default: 80,
    },
    severity: {
      type: String,
      enum: ['Informational', 'Low', 'Medium', 'High', 'Critical'],
      default: 'Medium',
    },
    rawData: {
      type: mongoose.Schema.Types.Mixed,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to guarantee uniqueness of indicators scoped per threat source feed
threatFeedRecordSchema.index({ source: 1, indicator: 1 }, { unique: true });

module.exports = mongoose.model('ThreatFeedRecord', threatFeedRecordSchema);
