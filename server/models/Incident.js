/**
 * 🛡️ CyberShield X — Incident Model (Phase 70)
 *
 * Implements persistent SOC incidents elevated from correlated alerts, findings, and detections.
 * Lifecycle: DETECTED -> TRIAGING -> INVESTIGATING -> CONTAINED -> RECOVERING -> RESOLVED -> CLOSED
 * Maintains an evidence-backed attack-chain graph and timeline.
 */

const mongoose = require('mongoose');

const attackChainNodeSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    label: { type: String, required: true },
    type: {
      type: String,
      enum: ['Asset', 'Service', 'Vulnerability', 'IOC', 'Finding', 'Alert', 'Incident', 'Response'],
      required: true,
    },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { _id: false }
);

const attackChainEdgeSchema = new mongoose.Schema(
  {
    from: { type: String, required: true },
    to: { type: String, required: true },
    relationship: { type: String, default: 'RELATES_TO' },
    reason: { type: String, required: true },
  },
  { _id: false }
);

const incidentTimelineSchema = new mongoose.Schema(
  {
    timestamp: { type: Date, default: Date.now },
    eventType: {
      type: String,
      enum: ['OBSERVED', 'CORRELATED', 'ANALYZED', 'RESPONDED', 'STATUS_CHANGE', 'NOTE_ADDED'],
      default: 'OBSERVED',
    },
    description: { type: String, required: true },
    actor: { type: String, default: 'SYSTEM' },
    evidenceRef: { type: String, default: null },
  },
  { _id: false }
);

const incidentSchema = new mongoose.Schema(
  {
    incidentId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    title: {
      type: String,
      required: [true, 'Incident title is required'],
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    severity: {
      type: String,
      enum: ['INFO', 'INFORMATIONAL', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'MEDIUM',
      index: true,
    },
    priority: {
      level: {
        type: String,
        enum: ['INFO', 'INFORMATIONAL', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
        default: 'MEDIUM',
        index: true,
      },
      factors: {
        assetCriticality: { type: String, default: 'MEDIUM' },
        incidentSeverity: { type: String, default: 'MEDIUM' },
        exploitability: { type: Number, default: 50 },
        confidence: { type: Number, default: 75 },
        businessImpact: { type: String, default: 'MEDIUM' },
        activeCompromise: { type: Boolean, default: false },
      },
      calculatedScore: { type: Number, default: 50 },
    },
    classification: {
      tactic: {
        type: String,
        enum: [
          'INITIAL_ACCESS',
          'EXECUTION',
          'PERSISTENCE',
          'PRIVILEGE_ESCALATION',
          'DEFENSE_EVASION',
          'CREDENTIAL_ACCESS',
          'DISCOVERY',
          'LATERAL_MOVEMENT',
          'COLLECTION',
          'COMMAND_AND_CONTROL',
          'EXFILTRATION',
          'IMPACT',
          'OTHER',
        ],
        default: 'OTHER',
        index: true,
      },
      techniqueId: { type: String, trim: true, index: true },
      techniqueName: { type: String, trim: true },
      incidentType: { type: String, default: 'SECURITY_INCIDENT', index: true },
      attackCategory: { type: String, default: 'UNKNOWN' },
      affectedService: { type: String, default: '' },
      businessUnit: { type: String, default: 'General' },
      environment: { type: String, default: 'Production' },
    },
    mitreAttack: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    techniqueId: {
      type: String,
      trim: true,
      index: true,
    },
    confidence: {
      type: Number,
      min: 0,
      max: 100,
      default: 75,
    },
    status: {
      type: String,
      enum: [
        'DETECTED',
        'TRIAGING',
        'INVESTIGATING',
        'CONTAINMENT_PENDING',
        'CONTAINED',
        'ERADICATION_PENDING',
        'ERADICATING',
        'RECOVERING',
        'VALIDATION',
        'RESOLVED',
        'CLOSED',
        'REOPENED',
        'CANCELLED',
        'FAILED',
      ],
      default: 'DETECTED',
      index: true,
    },
    acknowledgedAt: {
      type: Date,
      default: null,
      index: true,
    },
    resolvedAt: {
      type: Date,
      default: null,
      index: true,
    },
    assignment: {
      primaryAnalyst: {
        id: { type: String, default: null },
        name: { type: String, default: null },
        email: { type: String, default: null },
      },
      backupAnalyst: {
        id: { type: String, default: null },
        name: { type: String, default: null },
      },
      team: { type: String, default: 'SOC-Tier1' },
      escalationOwner: {
        id: { type: String, default: null },
        name: { type: String, default: null },
      },
      assignedAt: { type: Date, default: null },
      assignedBy: {
        id: { type: String, default: null },
        name: { type: String, default: null },
      },
    },
    sla: {
      policyId: { type: String, default: 'DEFAULT_SLA' },
      acknowledgedAt: { type: Date, default: null },
      acknowledgementDeadline: { type: Date, default: null },
      investigationDeadline: { type: Date, default: null },
      containmentDeadline: { type: Date, default: null },
      resolutionDeadline: { type: Date, default: null },
      status: {
        type: String,
        enum: ['ON_TRACK', 'AT_RISK', 'BREACHED', 'PAUSED', 'COMPLETED'],
        default: 'ON_TRACK',
        index: true,
      },
      breachedAt: { type: Date, default: null },
      pausedAt: { type: Date, default: null },
      pausedDurationMs: { type: Number, default: 0 },
    },
    closure: {
      closedAt: { type: Date, default: null },
      closedBy: {
        id: { type: String, default: null },
        name: { type: String, default: null },
      },
      rootCause: { type: String, default: '' },
      impact: { type: String, default: '' },
      containmentSummary: { type: String, default: '' },
      eradicationSummary: { type: String, default: '' },
      recoveryVerification: { type: String, default: '' },
      evidenceSummary: { type: String, default: '' },
      lessonsLearned: { type: String, default: '' },
      detectionGaps: { type: mongoose.Schema.Types.Mixed, default: [] },
      followUpHunts: [{ type: String }],
      followUpTasks: [{ type: String }],
      postIncidentReviewRequired: { type: Boolean, default: false },
      postIncidentReviewCompleted: { type: Boolean, default: false },
    },
    reopenHistory: [
      {
        reopenedAt: { type: Date, default: Date.now },
        reopenedBy: {
          id: { type: String, default: null },
          name: { type: String, default: null },
        },
        reopenReason: { type: String, required: true },
        triggeringEvidenceId: { type: String, default: null },
      },
    ],
    affectedAssets: [{ type: String, trim: true, index: true }],
    correlatedFindings: [{ type: mongoose.Schema.Types.Mixed }],
    correlatedAlerts: [{ type: mongoose.Schema.Types.Mixed }],
    iocs: [
      {
        type: { type: String, required: true },
        value: { type: String, required: true },
        reputation: { type: String, default: 'UNKNOWN' },
        enriched: { type: Boolean, default: false },
      },
    ],
    timeline: [incidentTimelineSchema],
    detectionRules: [{ type: String, trim: true }],
    responseActions: [
      {
        actionId: { type: String, required: true },
        playbookId: { type: String, default: null },
        type: { type: String, required: true },
        target: { type: String, default: '' },
        parameters: { type: mongoose.Schema.Types.Mixed, default: {} },
        riskClass: {
          type: String,
          enum: ['LOW_RISK', 'USER_APPROVED', 'PRIVILEGED'],
          default: 'USER_APPROVED',
        },
        status: {
          type: String,
          enum: [
            'PROPOSED',
            'AWAITING_APPROVAL',
            'APPROVED',
            'EXECUTING',
            'SUCCEEDED',
            'COMPLETED',
            'FAILED',
            'DENIED',
            'CANCELLED',
            'PENDING',
          ],
          default: 'PROPOSED',
        },
        verificationStatus: {
          type: String,
          enum: ['UNVERIFIED', 'PASS', 'FAIL', 'INCONCLUSIVE'],
          default: 'UNVERIFIED',
        },
        verificationDetails: { type: String, default: '' },
        verifiedAt: { type: Date, default: null },
        verifiedBy: { type: String, default: null },
        executionId: { type: String, default: null },
        requestedAt: { type: Date, default: Date.now },
        approvedAt: { type: Date, default: null },
        approvedBy: { type: mongoose.Schema.Types.Mixed, default: null },
        completedAt: { type: Date, default: null },
        result: { type: mongoose.Schema.Types.Mixed, default: null },
      },
    ],
    analystDecisions: [
      {
        timestamp: { type: Date, default: Date.now },
        analystId: { type: String, required: true },
        decision: { type: String, required: true },
        rationale: { type: String, default: '' },
      },
    ],
    aiObservations: [
      {
        timestamp: { type: Date, default: Date.now },
        model: { type: String, default: 'Gemini 2.5 Flash' },
        analysis: { type: String, required: true },
        confidence: { type: Number, default: 0 },
        suggestedPlaybook: { type: String, default: null },
      },
    ],
    riskScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 50,
      index: true,
    },
    riskBreakdown: {
      severityScore: { type: Number, default: 0 },
      assetCriticality: { type: Number, default: 0 },
      exploitability: { type: Number, default: 0 },
      threatIntelConfidence: { type: Number, default: 0 },
      correlatedEventsScore: { type: Number, default: 0 },
      severityWeight: { type: Number, default: 0.35 },
      assetCriticalityWeight: { type: Number, default: 0.20 },
      exploitabilityWeight: { type: Number, default: 0.15 },
      threatIntelWeight: { type: Number, default: 0.15 },
      correlationWeight: { type: Number, default: 0.15 },
    },
    correlationReason: {
      type: String,
      default: '',
    },
    attackChainGraph: {
      nodes: [attackChainNodeSchema],
      edges: [attackChainEdgeSchema],
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

incidentSchema.index({ status: 1, severity: 1 });
incidentSchema.index({ organizationId: 1, status: 1 });
incidentSchema.index({ organizationId: 1, 'priority.level': 1 });
incidentSchema.index({ organizationId: 1, 'assignment.primaryAnalyst.id': 1 });
incidentSchema.index({ organizationId: 1, createdAt: -1 });
incidentSchema.index({ createdAt: -1 });

module.exports = mongoose.models.Incident || mongoose.model('Incident', incidentSchema);
