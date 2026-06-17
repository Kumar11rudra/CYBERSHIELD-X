const mongoose = require('mongoose');

const iocRecordSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['ip', 'domain', 'hash', 'email', 'url'],
      required: true,
      index: true,
    },
    value: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    reputation: {
      type: Number,
      min: 0,
      max: 100,
      required: true,
    },
    confidence: {
      type: Number,
      min: 0,
      max: 100,
      default: 80,
    },
    source: {
      type: String,
      required: true,
    },
    sourceType: {
      type: String,
      default: 'local-intelligence',
    },
    tags: [String],
    firstSeen: {
      type: Date,
      default: Date.now,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    enrichmentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'completed',
    },
    metadata: mongoose.Schema.Types.Mixed,
  },
  {
    timestamps: true,
  }
);

// Unique compound index
iocRecordSchema.index({ type: 1, value: 1 }, { unique: true });

module.exports = mongoose.model('IOCRecord', iocRecordSchema);
