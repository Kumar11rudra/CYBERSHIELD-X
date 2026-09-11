const mongoose = require('mongoose');

const stepExecutionSchema = new mongoose.Schema({
  stepId: { type: String, required: true },
  name: { type: String, required: true },
  actionType: { type: String, required: true },
  status: {
    type: String,
    enum: ['PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'SKIPPED', 'ROLLED_BACK'],
    default: 'PENDING'
  },
  durationMs: { type: Number, default: 0 },
  output: { type: mongoose.Schema.Types.Mixed, default: {} },
  verificationResult: { type: String, enum: ['PASS', 'FAIL', 'SKIPPED', 'UNVERIFIED'], default: 'UNVERIFIED' },
  error: { type: String, default: null }
}, { _id: false });

const automationExecutionSchema = new mongoose.Schema({
  executionId: { type: String, required: true, unique: true, index: true },
  organizationId: { type: mongoose.Schema.Types.Mixed, default: null, index: true },
  playbookId: { type: String, required: true, index: true },
  playbookVersion: { type: Number, required: true },
  triggerType: {
    type: String,
    enum: ['MANUAL', 'ALERT_TRIGGER', 'DRIFT_REMEDIATION', 'SCHEDULED'],
    default: 'MANUAL'
  },
  requestedBy: {
    userId: String,
    username: String,
    role: String
  },
  approvedBy: {
    userId: String,
    username: String,
    role: String,
    approvedAt: Date,
    approvedRevisionHash: String
  },
  status: {
    type: String,
    enum: ['REQUESTED', 'PENDING_APPROVAL', 'APPROVED', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED', 'ROLLED_BACK', 'BLOCKED'],
    default: 'REQUESTED',
    index: true
  },
  startedAt: { type: Date, default: null },
  completedAt: { type: Date, default: null },
  steps: [stepExecutionSchema],
  resultSummary: { type: String, default: '' },
  failureReason: { type: String, default: null },
  evidenceReferences: [{ type: String }],
  auditReferences: [{ type: String }],
  idempotencyKey: { type: String, required: true, index: true }
}, {
  timestamps: true
});

automationExecutionSchema.index({ organizationId: 1, idempotencyKey: 1 });
automationExecutionSchema.index({ organizationId: 1, playbookId: 1, status: 1 });

module.exports = mongoose.models.AutomationExecution || mongoose.model('AutomationExecution', automationExecutionSchema);
