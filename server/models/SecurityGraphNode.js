const mongoose = require('mongoose');

const securityGraphNodeSchema = new mongoose.Schema({
  nodeId: { type: String, required: true, unique: true, index: true },
  organizationId: { type: mongoose.Schema.Types.Mixed, default: null, index: true },
  entityType: {
    type: String,
    enum: [
      'ASSET',
      'USER',
      'IDENTITY',
      'INCIDENT',
      'CASE',
      'FINDING',
      'ALERT',
      'DETECTION_RULE',
      'DETECTION_GAP',
      'IOC',
      'THREAT_INTEL',
      'THREAT_HUNT',
      'HUNT_EXECUTION',
      'AUTOMATION_EXECUTION',
      'GOVERNANCE_POLICY',
      'COMPLIANCE_EVIDENCE',
      'SERVICE_HEALTH',
      'RELIABILITY_EVENT',
      'AUDIT_EVENT',
      'EVIDENCE_RECORD',
      'TOOL_EXECUTION'
    ],
    required: true,
    index: true
  },
  entityId: { type: String, required: true, index: true },
  displayName: { type: String, required: true },
  classification: {
    type: String,
    enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFORMATIONAL', 'UNKNOWN'],
    default: 'MEDIUM'
  },
  source: { type: String, required: true },
  firstObservedAt: { type: Date, default: Date.now },
  lastObservedAt: { type: Date, default: Date.now },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  status: {
    type: String,
    enum: ['ACTIVE', 'ARCHIVED', 'DELETED'],
    default: 'ACTIVE'
  }
}, {
  timestamps: true
});

securityGraphNodeSchema.index({ organizationId: 1, entityType: 1, entityId: 1 });

module.exports = mongoose.models.SecurityGraphNode || mongoose.model('SecurityGraphNode', securityGraphNodeSchema);
