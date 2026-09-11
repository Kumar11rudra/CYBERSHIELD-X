const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema(
  {
    alertId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    title: {
      type: String,
      required: [true, 'Alert title is required'],
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    severity: {
      type: String,
      enum: ['INFO', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'MEDIUM',
      index: true,
    },
    category: {
      type: String,
      default: 'SECURITY_EVENT',
      index: true,
    },
    source: {
      type: String,
      required: true,
      trim: true,
    },
    asset: {
      type: String,
      trim: true,
      default: '',
      index: true,
    },
    affectedAsset: {
      type: String,
      trim: true,
      default: '',
      index: true,
    },
    executionId: {
      type: String,
      trim: true,
      default: null,
    },
    findingId: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
      index: true,
    },
    ruleId: {
      type: String,
      default: null,
      index: true,
    },
    dedupKey: {
      type: String,
      default: null,
      index: true,
    },
    occurrenceCount: {
      type: Number,
      default: 1,
    },
    firstSeen: {
      type: Date,
      default: Date.now,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['NEW', 'ACKNOWLEDGED', 'INVESTIGATING', 'RESOLVED', 'CLOSED'],
      default: 'NEW',
      index: true,
    },
    acknowledgedBy: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    acknowledgedAt: {
      type: Date,
      default: null,
    },
    resolvedBy: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    resolutionNotes: {
      type: String,
      default: '',
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    organizationId: {
      type: mongoose.Schema.Types.Mixed,
      index: true,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

alertSchema.pre('validate', function (next) {
  if (!this.asset && this.affectedAsset) {
    this.asset = this.affectedAsset;
  } else if (!this.affectedAsset && this.asset) {
    this.affectedAsset = this.asset;
  }
  next();
});

alertSchema.index({ organizationId: 1, createdAt: -1 });
alertSchema.index({ status: 1, severity: 1 });
alertSchema.index({ category: 1, createdAt: -1 });

module.exports = mongoose.models.Alert || mongoose.model('Alert', alertSchema);
