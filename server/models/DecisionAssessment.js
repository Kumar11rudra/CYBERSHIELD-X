const mongoose = require('mongoose');

const decisionAssessmentSchema = new mongoose.Schema({
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
      'THREAT_HUNT',
      'DETECTION',
      'GOVERNANCE',
      'AUTOMATION',
      'RELIABILITY'
    ],
    required: true,
    index: true
  },
  subjectId: { type: String, required: true, index: true },
  decisionType: {
    type: String,
    enum: [
      'INCIDENT_TRIAGE',
      'INCIDENT_CONTAINMENT',
      'CASE_INVESTIGATION',
      'ALERT_ESCALATION',
      'ASSET_POSTURE',
      'THREAT_RESPONSE',
      'NEXT_BEST_ACTION',
      'EXECUTIVE_RISK_EVALUATION'
    ],
    required: true,
    index: true
  },
  priority: {
    type: String,
    enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFORMATIONAL'],
    default: 'MEDIUM'
  },
  severity: {
    type: String,
    enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFORMATIONAL'],
    default: 'MEDIUM'
  },
  riskScore: { type: Number, default: null, min: 0, max: 100 },
  determination: {
    type: String,
    enum: [
      'OBSERVED',
      'DERIVED',
      'CORRELATED',
      'INFERRED',
      'UNKNOWN',
      'INSUFFICIENT_EVIDENCE'
    ],
    required: true,
    default: 'DERIVED'
  },
  rationale: { type: String, required: true },
  evidenceReferences: [{ type: String }],
  relatedEntities: [
    {
      entityType: { type: String, required: true },
      entityId: { type: String, required: true },
      relationship: { type: String, default: 'ASSOCIATED_WITH' }
    }
  ],
  recommendedActions: [
    {
      actionType: { type: String, required: true },
      title: { type: String, required: true },
      description: { type: String },
      authorization: {
        type: String,
        enum: ['EXECUTABLE', 'APPROVAL_REQUIRED', 'MANUAL_ONLY', 'NOT_SUPPORTED'],
        default: 'APPROVAL_REQUIRED'
      },
      playbookId: { type: String, default: null },
      prerequisites: [{ type: String }]
    }
  ],
  evaluatedAt: { type: Date, default: Date.now },
  engineVersion: { type: String, default: 'v62.2.0' },
  contentHash: { type: String, required: true }
}, {
  timestamps: true
});

decisionAssessmentSchema.index({ organizationId: 1, subjectType: 1, subjectId: 1, evaluatedAt: -1 });

module.exports = mongoose.models.DecisionAssessment || mongoose.model('DecisionAssessment', decisionAssessmentSchema);
