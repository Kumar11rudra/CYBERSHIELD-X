/**
 * 🛡️ CyberShield X — DetectionRuleRevision Model (Phase 73)
 *
 * Provides immutable revision tracking and rollback points for detection rules.
 * Production rules are never silently overwritten; every tuning or edit
 * creates an immutable revision with diff, author, and test status.
 */

const mongoose = require('mongoose');

const detectionRuleRevisionSchema = new mongoose.Schema(
  {
    revisionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    ruleId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    contentId: {
      type: String,
      trim: true,
      index: true,
    },
    revision: {
      type: Number,
      required: true,
      index: true,
    },
    revisionNumber: {
      type: Number,
      index: true,
    },
    version: {
      type: String,
      default: '1.0.0',
      trim: true,
    },
    author: {
      type: String,
      default: 'OPERATOR',
    },
    changeReason: {
      type: String,
      default: '',
      trim: true,
    },
    changeSummary: {
      type: String,
      default: '',
      trim: true,
    },
    diff: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    ruleSnapshot: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    testSummary: {
      total: { type: Number, default: 0 },
      passed: { type: Number, default: 0 },
      failed: { type: Number, default: 0 },
      lastRunAt: { type: Date, default: null },
    },
    status: {
      type: String,
      default: 'DRAFT',
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    approvedBy: {
      type: String,
      default: null,
    },
    activatedAt: {
      type: Date,
      default: null,
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

detectionRuleRevisionSchema.pre('validate', function (next) {
  if (this.revision != null && this.revisionNumber == null) {
    this.revisionNumber = this.revision;
  } else if (this.revisionNumber != null && this.revision == null) {
    this.revision = this.revisionNumber;
  }
  if (!this.changeSummary && this.changeReason) {
    this.changeSummary = this.changeReason;
  } else if (!this.changeReason && this.changeSummary) {
    this.changeReason = this.changeSummary;
  }
  next();
});

detectionRuleRevisionSchema.index({ organizationId: 1, ruleId: 1, revision: -1 });
detectionRuleRevisionSchema.index({ organizationId: 1, contentId: 1 });

module.exports =
  mongoose.models.DetectionRuleRevision ||
  mongoose.model('DetectionRuleRevision', detectionRuleRevisionSchema);
