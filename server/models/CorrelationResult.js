const mongoose = require('mongoose');

const correlationResultSchema = new mongoose.Schema({
  correlationId: { type: String, required: true, unique: true, index: true },
  organizationId: { type: mongoose.Schema.Types.Mixed, default: null, index: true },
  ruleId: { type: String, required: true, index: true },
  sourceEntities: [{
    entityType: String,
    entityId: String
  }],
  matchedEntities: [{
    entityType: String,
    entityId: String
  }],
  relationshipType: { type: String, required: true },
  provenanceReferences: [{ type: String }],
  determination: {
    type: String,
    enum: ['CORRELATED', 'TEMPORALLY_ASSOCIATED', 'INSUFFICIENT_EVIDENCE', 'NO_MATCH'],
    required: true,
    index: true
  },
  createdAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

correlationResultSchema.index({ organizationId: 1, ruleId: 1, determination: 1 });

module.exports = mongoose.models.CorrelationResult || mongoose.model('CorrelationResult', correlationResultSchema);
