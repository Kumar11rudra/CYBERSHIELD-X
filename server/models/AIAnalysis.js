const mongoose = require('mongoose');

const aiAnalysisSchema = new mongoose.Schema(
  {
    scanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Scan',
      required: true,
      index: true,
    },
    model: {
      type: String,
      required: true,
      default: 'llama3',
    },
    executiveSummary: {
      type: String,
      required: true,
    },
    findings: {
      type: mongoose.Schema.Types.Mixed, // Array or Object
      default: [],
    },
    recommendations: {
      type: mongoose.Schema.Types.Mixed, // Array or Object
      default: [],
    },
    remediationPlan: {
      type: String,
      required: true,
    },
    durationMs: {
      type: Number,
      default: 0,
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

// Compound index for multi-model scan triage lookups
aiAnalysisSchema.index({ scanId: 1, model: 1 });

module.exports = mongoose.model('AIAnalysis', aiAnalysisSchema);
