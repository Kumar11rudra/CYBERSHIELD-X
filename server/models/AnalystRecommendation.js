const mongoose = require('mongoose');

const analystRecommendationSchema = new mongoose.Schema({
  recommendationId: { type: String, required: true, unique: true, index: true },
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
      'DETECTION',
      'THREAT_HUNT',
      'GOVERNANCE',
      'RELIABILITY'
    ],
    required: true,
    index: true
  },
  subjectId: { type: String, required: true, index: true },
  recommendationType: {
    type: String,
    enum: [
      'INVESTIGATION_STEP',
      'REMEDIATION_ACTION',
      'DETECTION_TUNING',
      'THREAT_HUNT',
      'CONTAINMENT',
      'EVIDENCE_COLLECTION',
      'GOVERNANCE_REVIEW',
      'RELIABILITY_HEALTH_CHECK'
    ],
    required: true,
    index: true
  },
  priority: {
    type: String,
    enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'],
    default: 'MEDIUM'
  },
  title: { type: String, required: true },
  rationale: { type: String, required: true },
  evidenceReferences: [{ type: String }],
  prerequisites: [{ type: String }],
  authorization: {
    type: String,
    enum: ['EXECUTABLE', 'APPROVAL_REQUIRED', 'MANUAL_ONLY', 'NOT_SUPPORTED'],
    default: 'MANUAL_ONLY'
  },
  status: {
    type: String,
    enum: [
      'PROPOSED',
      'ACCEPTED',
      'REJECTED',
      'EXECUTION_PENDING',
      'EXECUTED',
      'FAILED',
      'EXPIRED'
    ],
    default: 'PROPOSED',
    index: true
  },
  automationPlaybookId: { type: String, default: null },
  resolvedAt: { type: Date, default: null },
  resolvedBy: { type: String, default: null },
  feedbackNotes: { type: String, default: null }
}, {
  timestamps: true
});

analystRecommendationSchema.index({ organizationId: 1, status: 1, priority: 1, createdAt: -1 });

module.exports = mongoose.models.AnalystRecommendation || mongoose.model('AnalystRecommendation', analystRecommendationSchema);
