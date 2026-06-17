const mongoose = require('mongoose');

const scheduledScanSchema = new mongoose.Schema(
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
      enum: ['url', 'ip', 'domain'],
      required: true,
    },
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly'],
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastRun: Date,
    nextRun: {
      type: Date,
      required: true,
      index: true,
    },
    tools: {
      type: [String],
      default: ['nmap', 'ssl'],
    },
    scanMode: {
      type: String,
      default: 'quick',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('ScheduledScan', scheduledScanSchema);
