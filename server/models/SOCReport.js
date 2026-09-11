/**
 * 🛡️ CyberShield X — SOCReport Model (Phase 74)
 *
 * Persists versioned, immutable operational and compliance reports.
 * Employs SHA-256 checksums to ensure zero silent data alterations.
 */

const mongoose = require('mongoose');

const socReportSchema = new mongoose.Schema(
  {
    reportId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    reportType: {
      type: String,
      required: true,
      enum: [
        'EXECUTIVE_SUMMARY',
        'SOC_OPERATIONS',
        'INCIDENT_REPORT',
        'CASE_DOSSIER',
        'THREAT_HUNT_REPORT',
        'DETECTION_COVERAGE',
        'THREAT_INTELLIGENCE',
        'COMPLIANCE_EVIDENCE',
        'AUDIT_ACTIVITY',
      ],
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    version: {
      type: Number,
      default: 1,
      min: 1,
    },
    status: {
      type: String,
      enum: ['DRAFT', 'GENERATING', 'GENERATED', 'COMPLETED', 'FAILED'],
      default: 'GENERATED',
      index: true,
    },
    reportingPeriod: {
      startDate: { type: Date },
      endDate: { type: Date },
      label: { type: String, default: 'Custom Period' },
    },
    parameters: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    content: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    contentSnapshot: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    evidenceReferences: [
      {
        type: mongoose.Schema.Types.Mixed,
      },
    ],
    checksum: {
      type: String,
      default: null,
      index: true,
    },
    contentHash: {
      type: String,
      default: null,
      index: true,
    },
    generatorVersion: {
      type: String,
      default: 'v61.7.0',
    },
    fileExports: {
      json: { type: String, default: null },
      csv: { type: String, default: null },
      pdf: { type: String, default: null },
    },
    exports: {
      jsonData: { type: String, default: null },
      csvData: { type: String, default: null },
      pdfData: { type: String, default: null },
    },
    requestedBy: {
      userId: { type: String, default: 'system' },
      username: { type: String, default: 'SYSTEM' },
      role: { type: String, default: 'OPERATOR' },
    },
    organizationId: {
      type: mongoose.Schema.Types.Mixed,
      index: true,
      default: null,
    },
    completedAt: {
      type: Date,
      default: Date.now,
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

socReportSchema.pre('save', function (next) {
  if (!this.contentSnapshot && this.content) {
    this.contentSnapshot = this.content;
  }
  if (!this.content && this.contentSnapshot) {
    this.content = this.contentSnapshot;
  }
  if (!this.contentHash && this.checksum) {
    this.contentHash = this.checksum;
  }
  if (!this.checksum && this.contentHash) {
    this.checksum = this.contentHash;
  }
  if (!this.generatedAt && this.completedAt) {
    this.generatedAt = this.completedAt;
  }
  if (!this.completedAt && this.generatedAt) {
    this.completedAt = this.generatedAt;
  }
  if (this.fileExports && !this.exports) {
    this.exports = {
      jsonData: this.fileExports.json || null,
      csvData: this.fileExports.csv || null,
      pdfData: this.fileExports.pdf || null,
    };
  }
  next();
});

socReportSchema.index({ organizationId: 1, reportId: 1 });
socReportSchema.index({ organizationId: 1, reportType: 1, createdAt: -1 });

module.exports = mongoose.models.SOCReport || mongoose.model('SOCReport', socReportSchema);
