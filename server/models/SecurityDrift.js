const mongoose = require('mongoose');

const securityDriftSchema = new mongoose.Schema({
  driftId: { type: String, required: true, unique: true, index: true },
  organizationId: { type: mongoose.Schema.Types.Mixed, default: null, index: true },
  driftType: {
    type: String,
    enum: [
      'GOVERNANCE_POLICY_DRIFT',
      'DETECTION_RULE_DRIFT',
      'INTEGRATION_METADATA_DRIFT',
      'RETENTION_POLICY_DRIFT',
      'RELIABILITY_THRESHOLD_DRIFT'
    ],
    required: true,
    index: true
  },
  sourceRecord: { type: String, required: true },
  baselineReference: { type: String, required: true },
  observedState: { type: mongoose.Schema.Types.Mixed, required: true },
  expectedState: { type: mongoose.Schema.Types.Mixed, required: true },
  severity: {
    type: String,
    enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'],
    default: 'MEDIUM'
  },
  status: {
    type: String,
    enum: ['OPEN', 'ACKNOWLEDGED', 'REMEDIATION_PENDING', 'REMEDIATED', 'ACCEPTED_RISK', 'CLOSED', 'BLOCKED'],
    default: 'OPEN',
    index: true
  },
  detectedAt: { type: Date, default: Date.now },
  remediatedAt: { type: Date, default: null },
  evidenceReferences: [{ type: String }],
  resolutionReference: { type: String, default: null }
}, {
  timestamps: true
});

securityDriftSchema.index({ organizationId: 1, driftType: 1, status: 1 });

module.exports = mongoose.models.SecurityDrift || mongoose.model('SecurityDrift', securityDriftSchema);
