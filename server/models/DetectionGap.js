/**
 * 🛡️ CyberShield X — DetectionGap Model (Phase 73)
 *
 * Tracks evidence-backed detection gaps discovered through:
 * - Observed ATT&CK techniques with no active tested detection;
 * - Untested detection rules;
 * - High false-positive dismissals;
 * - Incident postmortem detection gaps (Phase 72);
 * - Threat hunting observations with no active rule (Phase 71).
 */

const mongoose = require('mongoose');

const detectionGapSchema = new mongoose.Schema(
  {
    gapId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    techniqueId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    techniqueName: {
      type: String,
      default: '',
      trim: true,
    },
    tactic: {
      type: String,
      default: '',
      trim: true,
    },
    gapType: {
      type: String,
      enum: [
        'NO_DETECTION',
        'UNTESTED_DETECTION',
        'DISABLED_ONLY',
        'HIGH_FALSE_POSITIVE',
        'UNCOVERED_INCIDENT',
        'INCIDENT_UNCOVERED',
        'UNCOVERED_HUNT',
      ],
      default: 'NO_DETECTION',
      index: true,
    },
    severity: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'HIGH',
      index: true,
    },
    status: {
      type: String,
      enum: ['OPEN', 'IN_PROGRESS', 'RULE_DRAFTED', 'RESOLVED', 'ACCEPTED_RISK'],
      default: 'OPEN',
      index: true,
    },
    evidenceIncidents: [{ type: String, trim: true }],
    evidenceReferences: [
      {
        entityType: { type: String, required: true }, // e.g., 'INCIDENT', 'HUNT', 'ALERT', 'FINDING'
        entityId: { type: String, required: true },
        details: { type: String, default: '' },
        timestamp: { type: Date, default: Date.now },
      },
    ],
    candidateRuleDraft: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    candidateRuleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DetectionRule',
      default: null,
    },
    remediationRecommendation: {
      type: String,
      default: '',
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    resolvedBy: {
      type: String,
      default: null,
    },
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

detectionGapSchema.index({ organizationId: 1, status: 1 });
detectionGapSchema.index({ organizationId: 1, techniqueId: 1 });

module.exports =
  mongoose.models.DetectionGap || mongoose.model('DetectionGap', detectionGapSchema);
