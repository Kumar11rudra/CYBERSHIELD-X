const mongoose = require('mongoose');

const investigationHypothesisSchema = new mongoose.Schema({
  hypothesisId: { type: String, required: true, unique: true, index: true },
  organizationId: { type: mongoose.Schema.Types.Mixed, default: null, index: true },
  title: { type: String, required: true },
  statement: { type: String, required: true },
  status: {
    type: String,
    enum: ['OPEN', 'SUPPORTED', 'REFUTED', 'INCONCLUSIVE', 'CLOSED'],
    default: 'OPEN',
    index: true
  },
  supportingEvidence: [
    {
      evidenceId: { type: String, required: true },
      description: { type: String },
      source: { type: String },
      addedAt: { type: Date, default: Date.now }
    }
  ],
  contradictingEvidence: [
    {
      evidenceId: { type: String, required: true },
      description: { type: String },
      source: { type: String },
      addedAt: { type: Date, default: Date.now }
    }
  ],
  relatedEntities: [
    {
      entityType: { type: String, required: true },
      entityId: { type: String, required: true },
      role: { type: String, default: 'INVOLVED' }
    }
  ],
  createdBy: { type: String, default: 'ANALYST' },
  reviewedBy: { type: String, default: null },
  resolutionNotes: { type: String, default: null },
  closedAt: { type: Date, default: null }
}, {
  timestamps: true
});

investigationHypothesisSchema.index({ organizationId: 1, status: 1, createdAt: -1 });

module.exports = mongoose.models.InvestigationHypothesis || mongoose.model('InvestigationHypothesis', investigationHypothesisSchema);
