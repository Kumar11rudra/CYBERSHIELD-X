const mongoose = require('mongoose');

const securityGraphEdgeSchema = new mongoose.Schema({
  edgeId: { type: String, required: true, unique: true, index: true },
  organizationId: { type: mongoose.Schema.Types.Mixed, default: null, index: true },
  fromNode: { type: String, required: true, index: true }, // nodeId of source node
  toNode: { type: String, required: true, index: true },   // nodeId of target node
  relationshipType: {
    type: String,
    enum: [
      'AFFECTS',
      'TRIGGERED',
      'DETECTED_BY',
      'CORRELATED_WITH',
      'EXECUTED_ON',
      'ASSOCIATED_WITH',
      'EVIDENCE_FOR',
      'OWNED_BY',
      'GOVERNED_BY',
      'REMEDIATED_BY',
      'ENRICHED_BY',
      'DEPENDS_ON'
    ],
    required: true,
    index: true
  },
  provenanceType: {
    type: String,
    enum: [
      'DIRECT_RECORD_REFERENCE',
      'PERSISTED_FOREIGN_KEY',
      'AUDIT_REFERENCE',
      'EVIDENCE_REFERENCE',
      'DETERMINISTIC_CORRELATION',
      'TEMPORAL_ASSOCIATION'
    ],
    required: true
  },
  provenanceReferences: [{ type: String }],
  confidence: { type: Number, default: 1.0, min: 0.0, max: 1.0 },
  firstObservedAt: { type: Date, default: Date.now },
  lastObservedAt: { type: Date, default: Date.now },
  attributes: { type: mongoose.Schema.Types.Mixed, default: {} },
  checksum: { type: String, required: true }
}, {
  timestamps: true
});

securityGraphEdgeSchema.index({ organizationId: 1, fromNode: 1, toNode: 1, relationshipType: 1 });

module.exports = mongoose.models.SecurityGraphEdge || mongoose.model('SecurityGraphEdge', securityGraphEdgeSchema);
