/**
 * 🛡️ CyberShield X — PendingApproval Model (Phase 70)
 *
 * Implements the Human-in-the-Loop approval gate for operational and privileged actions.
 * Lifecycle: PROPOSED -> AWAITING_APPROVAL -> APPROVED -> EXECUTING -> COMPLETED / FAILED / DENIED / EXPIRED
 * AI recommendations MUST pass human approval before execution.
 */

const mongoose = require('mongoose');

const pendingApprovalSchema = new mongoose.Schema(
  {
    approvalId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    incidentId: {
      type: String,
      default: null,
      index: true,
    },
    playbookId: {
      type: String,
      default: null,
    },
    actionType: {
      type: String,
      required: true,
      trim: true,
    },
    riskLevel: {
      type: String,
      default: 'USER_APPROVED',
      index: true,
    },
    target: {
      type: String,
      required: true,
      trim: true,
    },
    tool: {
      type: String,
      default: null,
      trim: true,
    },
    parameters: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    requestedBy: {
      userId: { type: String, default: 'AI_ASSISTANT' },
      username: { type: String, default: 'Security Copilot' },
      role: { type: String, default: 'ANALYST' },
    },
    status: {
      type: String,
      enum: ['PROPOSED', 'AWAITING_APPROVAL', 'APPROVED', 'EXECUTING', 'COMPLETED', 'FAILED', 'DENIED', 'EXPIRED'],
      default: 'AWAITING_APPROVAL',
      index: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    evidenceRef: {
      type: String,
      default: null,
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours default
      index: true,
    },
    approvedBy: {
      userId: { type: String, default: null },
      username: { type: String, default: null },
      role: { type: String, default: null },
      timestamp: { type: Date, default: null },
      decisionReason: { type: String, default: '' },
    },
    executionId: {
      type: String,
      default: null,
    },
    decisionReason: {
      type: String,
      default: '',
    },
    executionResult: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    result: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    organizationId: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

pendingApprovalSchema.index({ status: 1, expiresAt: 1 });

module.exports = mongoose.models.PendingApproval || mongoose.model('PendingApproval', pendingApprovalSchema);
