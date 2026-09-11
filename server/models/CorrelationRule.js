const mongoose = require('mongoose');

const correlationRuleSchema = new mongoose.Schema({
  ruleId: { type: String, required: true, unique: true, index: true },
  organizationId: { type: mongoose.Schema.Types.Mixed, default: null, index: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  entityTypes: [{ type: String, required: true }],
  relationshipType: { type: String, required: true },
  matchCriteria: { type: mongoose.Schema.Types.Mixed, required: true },
  timeWindowMinutes: { type: Number, default: 60 },
  status: {
    type: String,
    enum: ['DRAFT', 'ACTIVE', 'DISABLED', 'RETIRED'],
    default: 'DRAFT',
    index: true
  },
  version: { type: Number, default: 1 },
  checksum: { type: String, required: true },
  createdBy: {
    userId: String,
    username: String,
    role: String
  }
}, {
  timestamps: true
});

correlationRuleSchema.index({ organizationId: 1, status: 1 });

module.exports = mongoose.models.CorrelationRule || mongoose.model('CorrelationRule', correlationRuleSchema);
