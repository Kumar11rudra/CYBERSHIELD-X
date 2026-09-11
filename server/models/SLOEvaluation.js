/**
 * 🛡️ CyberShield X — SLOEvaluation Model (Phase 76)
 *
 * Persists evaluated SLO compliance over distinct observation windows with raw evidence.
 */

const mongoose = require('mongoose');

const sloEvaluationSchema = new mongoose.Schema(
  {
    evaluationId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    sloId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    service: {
      type: String,
      required: true,
      index: true,
    },
    organizationId: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
      index: true,
    },
    windowStart: {
      type: Date,
      required: true,
    },
    windowEnd: {
      type: Date,
      required: true,
    },
    totalEvents: {
      type: Number,
      default: 0,
    },
    goodEvents: {
      type: Number,
      default: 0,
    },
    badEvents: {
      type: Number,
      default: 0,
    },
    observedPercent: {
      type: Number,
      default: null,
    },
    targetPercent: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['MEETING', 'AT_RISK', 'BREACHED', 'INSUFFICIENT_DATA', 'NOT_MEASURED'],
      required: true,
      index: true,
    },
    errorBudgetRemainingPercent: {
      type: Number,
      default: null,
    },
    evaluatedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    evidenceReferences: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

sloEvaluationSchema.index({ sloId: 1, evaluatedAt: -1 });

module.exports = mongoose.model('SLOEvaluation', sloEvaluationSchema);
