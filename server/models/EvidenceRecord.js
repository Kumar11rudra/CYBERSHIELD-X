/**
 * 🛡️ CyberShield X — EvidenceRecord Model (Phase 72)
 *
 * Implements immutable evidence records with cryptographic SHA-256 hashing,
 * tamper detection verification, and audit-grade chain of custody.
 */

const mongoose = require('mongoose');

const chainOfCustodyEntrySchema = new mongoose.Schema(
  {
    action: {
      type: String,
      enum: ['COLLECTED', 'ACCESSED', 'VERIFIED', 'TRANSFERRED', 'ATTACHED_TO_CASE', 'ATTACHED_TO_INCIDENT', 'NOTE_ADDED'],
      required: true,
    },
    actor: {
      id: { type: String, default: null },
      name: { type: String, default: 'SYSTEM' },
      email: { type: String, default: null },
    },
    timestamp: { type: Date, default: Date.now },
    verificationHash: { type: String, default: null },
    notes: { type: String, default: '' },
  },
  { _id: false }
);

const evidenceRecordSchema = new mongoose.Schema(
  {
    evidenceId: {
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
      trim: true,
    },
    caseId: {
      type: String,
      default: null,
      index: true,
      trim: true,
    },
    sourceEntity: {
      type: String,
      enum: ['HOST', 'CONTAINER', 'NETWORK', 'LOG', 'TERMINAL_JOB', 'HUNT', 'ALERT', 'MANUAL_UPLOAD', 'CANONICAL_TOOL'],
      required: true,
    },
    sourceId: {
      type: String,
      default: null,
      trim: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    collector: {
      id: { type: String, default: null },
      name: { type: String, default: 'SYSTEM' },
      tool: { type: String, default: 'native-collector' },
    },
    hash: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    integrityStatus: {
      type: String,
      enum: ['VALID', 'TAMPER_DETECTED', 'UNAVAILABLE', 'PENDING_VERIFICATION'],
      default: 'PENDING_VERIFICATION',
      index: true,
    },
    rawEvidence: {
      type: String,
      required: true,
    },
    artifactType: {
      type: String,
      default: 'TEXT',
    },
    chainOfCustody: [chainOfCustodyEntrySchema],
    analystNotes: [
      {
        noteId: { type: String, required: true },
        author: {
          id: { type: String, default: null },
          name: { type: String, default: 'ANALYST' },
        },
        content: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
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

evidenceRecordSchema.index({ organizationId: 1, integrityStatus: 1 });
evidenceRecordSchema.index({ organizationId: 1, incidentId: 1 });
evidenceRecordSchema.index({ organizationId: 1, caseId: 1 });
evidenceRecordSchema.index({ organizationId: 1, createdAt: -1 });

module.exports = mongoose.models.EvidenceRecord || mongoose.model('EvidenceRecord', evidenceRecordSchema);
