/**
 * 🛡️ CyberShield X — GovernancePolicy Model (Phase 75)
 *
 * Persists organization-level security and operational governance policies.
 * Enforces deterministic lifecycle (DRAFT -> REVIEW -> APPROVED -> ACTIVE -> SUSPENDED -> RETIRED),
 * version tracking, and cryptographic revision-bound approval verification.
 */

const mongoose = require('mongoose');

const governancePolicySchema = new mongoose.Schema(
  {
    policyId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    organizationId: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      index: true,
    },
    policyType: {
      type: String,
      required: true,
      enum: [
        'ACCESS_GOVERNANCE',
        'SESSION_SECURITY',
        'APPROVAL_GOVERNANCE',
        'AUDIT_GOVERNANCE',
        'EVIDENCE_GOVERNANCE',
        'REPORTING_GOVERNANCE',
        'DETECTION_GOVERNANCE',
        'INTEGRATION_GOVERNANCE',
        'DATA_RETENTION',
      ],
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    status: {
      type: String,
      enum: ['DRAFT', 'REVIEW', 'APPROVED', 'ACTIVE', 'SUSPENDED', 'RETIRED', 'REJECTED'],
      default: 'DRAFT',
      index: true,
    },
    currentVersion: {
      type: Number,
      default: 1,
      min: 1,
    },
    effectiveAt: {
      type: Date,
      default: null,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    createdBy: {
      id: { type: String, default: 'system' },
      username: { type: String, default: 'SYSTEM' },
      role: { type: String, default: 'OPERATOR' },
    },
    approvedBy: {
      id: { type: String, default: null },
      username: { type: String, default: null },
      role: { type: String, default: null },
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    approvedRevisionHash: {
      type: String,
      default: null,
    },
    enforcementMode: {
      type: String,
      enum: ['ENFORCE', 'AUDIT_ONLY', 'DISABLED'],
      default: 'ENFORCE',
      index: true,
    },
    configuration: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    checksum: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

governancePolicySchema.index({ organizationId: 1, policyId: 1 });
governancePolicySchema.index({ organizationId: 1, policyType: 1, status: 1 });
governancePolicySchema.index({ organizationId: 1, status: 1 });

module.exports = mongoose.models.GovernancePolicy || mongoose.model('GovernancePolicy', governancePolicySchema);
