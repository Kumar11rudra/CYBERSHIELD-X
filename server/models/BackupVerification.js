/**
 * 🛡️ CyberShield X — BackupVerification Model (Phase 76)
 *
 * Real backup discovery, integrity verification, and non-destructive restore testing records.
 * Never claims a backup exists unless an actual source is discovered/configured.
 */

const mongoose = require('mongoose');

const backupVerificationSchema = new mongoose.Schema(
  {
    backupId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    source: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    location: {
      type: String,
      default: '',
      trim: true,
    },
    organizationId: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
      index: true,
    },
    status: {
      type: String,
      enum: ['VERIFIED', 'UNVERIFIED', 'FAILED', 'NOT_CONFIGURED', 'UNKNOWN'],
      default: 'UNKNOWN',
      index: true,
    },
    backupTimestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
    checksum: {
      type: String,
      default: null,
    },
    sizeBytes: {
      type: Number,
      default: 0,
    },
    integrityVerified: {
      type: Boolean,
      default: false,
    },
    restoreTested: {
      type: Boolean,
      default: false,
    },
    restoreResult: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    evidenceReferences: {
      type: [String],
      default: [],
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

backupVerificationSchema.index({ organizationId: 1, status: 1 });
backupVerificationSchema.index({ backupTimestamp: -1 });

module.exports = mongoose.model('BackupVerification', backupVerificationSchema);
