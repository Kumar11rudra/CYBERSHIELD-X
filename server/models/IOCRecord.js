/**
 * 🛡️ CyberShield X — IOCRecord Model (Phase 70)
 *
 * Stores normalized Indicators of Compromise (IOCs) alongside raw inputs and truthful enrichment history.
 * Never synthesizes external enrichment data.
 */

const mongoose = require('mongoose');

const iocEnrichmentSchema = new mongoose.Schema(
  {
    provider: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ['SUCCESS', 'NOT_FOUND', 'EXTERNAL_SERVICE_UNAVAILABLE', 'FAILED', 'completed', 'pending', 'failed'],
      required: true,
    },
    rawEvidence: { type: mongoose.Schema.Types.Mixed, default: null },
    normalizedResult: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { _id: false }
);

const iocRecordSchema = new mongoose.Schema(
  {
    indicator: {
      type: String,
      index: true,
      trim: true,
    },
    value: {
      type: String,
      index: true,
      trim: true,
    },
    rawIndicator: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      enum: [
        'ip',
        'ipv4',
        'ipv6',
        'domain',
        'hostname',
        'url',
        'hash',
        'hash_md5',
        'hash_sha1',
        'hash_sha256',
        'email',
        'cve',
        'cert_fingerprint',
      ],
      index: true,
    },
    reputation: {
      type: mongoose.Schema.Types.Mixed,
      default: 'UNKNOWN',
      index: true,
    },
    confidence: {
      type: Number,
      min: 0,
      max: 100,
      default: 80,
    },
    source: {
      type: String,
      default: 'local-intelligence',
    },
    sourceType: {
      type: String,
      default: 'local-intelligence',
    },
    description: {
      type: String,
    },
    enrichmentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'completed',
    },
    metadata: mongoose.Schema.Types.Mixed,
    enrichment: [iocEnrichmentSchema],
    firstSeen: {
      type: Date,
      default: Date.now,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    occurrenceCount: {
      type: Number,
      default: 1,
    },
    affectedAssets: [{ type: String, trim: true, index: true }],
    tags: [{ type: String, trim: true }],
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

// Pre-validate hook to ensure bidirectional compatibility between value, indicator, rawIndicator
iocRecordSchema.pre('validate', function (next) {
  if (this.value && !this.indicator) {
    this.indicator = this.value;
  }
  if (this.indicator && !this.value) {
    this.value = this.indicator;
  }
  if (!this.rawIndicator) {
    this.rawIndicator = this.value || this.indicator || '';
  }
  if (!this.indicator) {
    this.indicator = this.rawIndicator || this.value || '';
  }
  if (!this.value) {
    this.value = this.indicator || this.rawIndicator || '';
  }
  next();
});

// Indexes
iocRecordSchema.index({ indicator: 1, organizationId: 1 });
iocRecordSchema.index({ value: 1, organizationId: 1 });
iocRecordSchema.index({ type: 1, reputation: 1 });

module.exports = mongoose.models.IOCRecord || mongoose.model('IOCRecord', iocRecordSchema);

