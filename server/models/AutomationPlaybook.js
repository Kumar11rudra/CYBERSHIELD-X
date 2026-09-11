const mongoose = require('mongoose');

const automationStepSchema = new mongoose.Schema({
  stepId: { type: String, required: true },
  name: { type: String, required: true },
  actionType: {
    type: String,
    enum: [
      'ENABLE_DETECTION_RULE_REVISION',
      'RESTORE_GOVERNANCE_POLICY',
      'REVOKE_EXPIRED_INTEGRATION',
      'RESTART_SAFE_INTERNAL_JOB',
      'APPLY_RETENTION_HOLD',
      'TRIGGER_RELIABILITY_HEALTH_CHECK',
      'NOTIFY_OPERATOR'
    ],
    required: true
  },
  targetEntity: { type: String, required: true },
  parameters: { type: mongoose.Schema.Types.Mixed, default: {} },
  onFailure: { type: String, enum: ['STOP', 'CONTINUE', 'ROLLBACK'], default: 'STOP' }
}, { _id: false });

const automationPlaybookSchema = new mongoose.Schema({
  playbookId: { type: String, required: true, unique: true, index: true },
  organizationId: { type: mongoose.Schema.Types.Mixed, default: null, index: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  category: {
    type: String,
    enum: ['GOVERNANCE_DRIFT', 'DETECTION_TUNING', 'INCIDENT_RESPONSE', 'RELIABILITY_RECOVERY', 'INTEGRATION_MAINTENANCE'],
    required: true
  },
  status: {
    type: String,
    enum: ['DRAFT', 'REVIEW', 'APPROVED', 'ACTIVE', 'DISABLED', 'RETIRED'],
    default: 'DRAFT',
    index: true
  },
  version: { type: Number, default: 1 },
  steps: [automationStepSchema],
  requiredRole: {
    type: String,
    enum: ['ANALYST', 'OPERATOR', 'ADMIN'],
    default: 'ADMIN'
  },
  approvalRequired: { type: Boolean, default: true },
  timeoutSeconds: { type: Number, default: 60 },
  maxConcurrent: { type: Number, default: 5 },
  checksum: { type: String, required: true },
  approvedRevisionHash: { type: String, default: null },
  createdBy: {
    userId: String,
    username: String,
    role: String
  },
  approvedBy: {
    userId: String,
    username: String,
    role: String,
    approvedAt: Date
  }
}, {
  timestamps: true
});

automationPlaybookSchema.index({ organizationId: 1, category: 1, status: 1 });

module.exports = mongoose.models.AutomationPlaybook || mongoose.model('AutomationPlaybook', automationPlaybookSchema);
