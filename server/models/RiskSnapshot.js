const mongoose = require('mongoose');

const riskSnapshotSchema = new mongoose.Schema({
  snapshotId: { type: String, required: true, unique: true, index: true },
  organizationId: { type: mongoose.Schema.Types.Mixed, default: null, index: true },
  subjectType: {
    type: String,
    enum: [
      'INCIDENT',
      'CASE',
      'ALERT',
      'ASSET',
      'FINDING',
      'IOC',
      'EXECUTIVE',
      'ORGANIZATION',
      'IDENTITY'
    ],
    required: true,
    index: true
  },
  subjectId: { type: String, required: true, index: true },
  calculatedRisk: { type: Number, default: null, min: 0, max: 100 },
  riskBand: {
    type: String,
    enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'UNKNOWN'],
    default: 'UNKNOWN',
    index: true
  },
  factors: [
    {
      factorName: { type: String, required: true },
      contribution: { type: Number, required: true },
      weight: { type: Number, default: 1.0 },
      sourceRecords: [{ type: String }],
      basis: { type: String }
    }
  ],
  evidenceReferences: [{ type: String }],
  engineVersion: { type: String, default: 'v62.2.0' },
  generatedTimestamp: { type: Date, default: Date.now, index: true },
  contentHash: { type: String, required: true },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
}, {
  timestamps: true
});

riskSnapshotSchema.index({ organizationId: 1, subjectType: 1, subjectId: 1, generatedTimestamp: -1 });

module.exports = mongoose.models.RiskSnapshot || mongoose.model('RiskSnapshot', riskSnapshotSchema);
