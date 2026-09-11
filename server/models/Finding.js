const mongoose = require('mongoose');

const findingSchema = new mongoose.Schema(
  {
    findingId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    caseId: {
      type: mongoose.Schema.Types.Mixed,
      index: true,
      default: null,
    },
    title: {
      type: String,
      required: [true, 'Finding title is required'],
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
    asset: {
      type: String,
      trim: true,
      index: true,
      default: '',
    },
    affectedAsset: {
      type: String,
      trim: true,
      index: true,
      default: '',
    },
    sourceTool: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    executionId: {
      type: String,
      index: true,
      trim: true,
      default: null,
    },
    organizationId: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
      index: true,
    },
    // Raw immutable tool output (strictly segregated from human or AI analysis)
    rawEvidence: {
      type: mongoose.Schema.Types.Mixed,
      required: [true, 'Raw tool evidence is required'],
    },
    // Analyst notes (human interpretation)
    analystNotes: {
      type: String,
      default: '',
    },
    // AI interpretation (model-generated analysis)
    aiInterpretation: {
      type: String,
      default: '',
    },
    remediation: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['OPEN', 'IN_PROGRESS', 'CONTAINED', 'RESOLVED', 'FALSE_POSITIVE', 'CLOSED'],
      default: 'OPEN',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

findingSchema.pre('validate', function (next) {
  if (!this.asset && this.affectedAsset) {
    this.asset = this.affectedAsset;
  } else if (!this.affectedAsset && this.asset) {
    this.affectedAsset = this.asset;
  }
  next();
});

findingSchema.index({ caseId: 1, severity: 1 });
findingSchema.index({ asset: 1, sourceTool: 1 });

module.exports = mongoose.models.Finding || mongoose.model('Finding', findingSchema);
