const mongoose = require('mongoose');

const riskAssessmentSchema = new mongoose.Schema({
  assessmentId: { type: String, required: true, unique: true, index: true },
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
      'IDENTITY',
      'DETECTION',
      'THREAT_HUNT'
    ],
    required: true,
    index: true
  },
  subjectId: { type: String, required: true, index: true },
  riskScore: { type: Number, default: null, min: 0, max: 100 },
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
      rawValue: { type: mongoose.Schema.Types.Mixed },
      sourceRecords: [{ type: String }],
      basis: { type: String, required: true }
    }
  ],
  positiveEvidence: [
    {
      factorName: { type: String },
      mitigationDescription: { type: String },
      sourceRecords: [{ type: String }]
    }
  ],
  negativeEvidence: [
    {
      factorName: { type: String },
      threatDescription: { type: String },
      sourceRecords: [{ type: String }]
    }
  ],
  evidenceReferences: [{ type: String }],
  calculatedAt: { type: Date, default: Date.now, index: true },
  algorithmVersion: { type: String, default: 'v62.2.0' }
}, {
  timestamps: true
});

riskAssessmentSchema.index({ organizationId: 1, subjectType: 1, subjectId: 1, calculatedAt: -1 });

module.exports = mongoose.models.RiskAssessment || mongoose.model('RiskAssessment', riskAssessmentSchema);
