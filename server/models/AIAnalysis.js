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
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('AIAnalysis', aiAnalysisSchema);
