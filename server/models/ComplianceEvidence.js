/**
 * 🛡️ CyberShield X — ComplianceEvidence Model (Phase 74)
 *
 * Persists authentic evidence bundles mapped to compliance controls.
 * Precludes synthetic certification claims by citing real system records and hashes.
 */

const mongoose = require('mongoose');

const complianceEvidenceSchema = new mongoose.Schema(
  {
    evidenceId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    controlId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['EVIDENCE_PRESENT', 'PARTIAL_EVIDENCE', 'NO_EVIDENCE', 'NOT_ASSESSED'],
      default: 'NOT_ASSESSED',
      index: true,
    },
    sourceType: {
      type: String,
      required: true,
      trim: true,
    },
    sourceRecords: [
      {
        entityType: { type: String, required: true },
        entityId: { type: String, required: true },
        hash: { type: String, default: null },
        timestamp: { type: Date, default: Date.now },
        summary: { type: String, default: '' },
      },
    ],
    auditEventRefs: [
      {
        type: String,
        trim: true,
      },
    ],
    summary: {
      type: String,
      default: '',
    },
    verifiedAt: {
      type: Date,
      default: Date.now,
    },
    verifiedBy: {
      type: String,
      default: 'SYSTEM_EVALUATOR',
    },
    packageChecksum: {
      type: String,
      default: null,
      index: true,
    },
    packageHash: {
      type: String,
      default: null,
      index: true,
    },
    packageId: {
      type: String,
      default: null,
      index: true,
    },
    controlDomain: {
      type: String,
      default: '',
    },
    controlTitle: {
      type: String,
      default: '',
    },
    evidenceCount: {
      type: Number,
      default: 0,
    },
    evidenceRecords: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    organizationId: {
      type: mongoose.Schema.Types.Mixed,
      index: true,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

complianceEvidenceSchema.index({ organizationId: 1, evidenceId: 1 });
complianceEvidenceSchema.index({ organizationId: 1, controlId: 1 });

module.exports = mongoose.models.ComplianceEvidence || mongoose.model('ComplianceEvidence', complianceEvidenceSchema);
