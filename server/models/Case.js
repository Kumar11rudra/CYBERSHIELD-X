const mongoose = require('mongoose');

const caseSchema = new mongoose.Schema(
  {
    caseId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    title: {
      type: String,
      required: [true, 'Case title is required'],
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    analystId: {
      type: mongoose.Schema.Types.Mixed,
      index: true,
      required: true,
    },
    organizationId: {
      type: mongoose.Schema.Types.Mixed,
      index: true,
      required: false,
    },
    severity: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'MEDIUM',
      index: true,
    },
    status: {
      type: String,
      enum: ['NEW', 'OPEN', 'IN_PROGRESS', 'ESCALATED', 'CONTAINED', 'RESOLVED', 'CLOSED', 'ARCHIVED'],
      default: 'OPEN',
      index: true,
    },
    tags: [{ type: String, trim: true }],
    assets: [{ type: String, trim: true }],
    scans: [{ type: mongoose.Schema.Types.Mixed }],
    executions: [{ type: String, trim: true }],
    findings: [{ type: mongoose.Schema.Types.Mixed }],
    incidents: [{ type: mongoose.Schema.Types.Mixed }],
    alerts: [{ type: mongoose.Schema.Types.Mixed }],
    hunts: [{ type: mongoose.Schema.Types.Mixed }],
    tasks: [{ type: mongoose.Schema.Types.Mixed }],
    approvals: [{ type: mongoose.Schema.Types.Mixed }],
    playbookRuns: [{ type: mongoose.Schema.Types.Mixed }],
    reports: [{ type: mongoose.Schema.Types.Mixed }],
    parentCaseId: {
      type: String,
      default: null,
      index: true,
    },
    childCases: [{ type: String, trim: true }],
    sla: {
      policyId: { type: String, default: 'DEFAULT_CASE_SLA' },
      acknowledgedAt: { type: Date, default: null },
      acknowledgementDeadline: { type: Date, default: null },
      resolutionDeadline: { type: Date, default: null },
      status: {
        type: String,
        enum: ['ON_TRACK', 'AT_RISK', 'BREACHED', 'PAUSED', 'COMPLETED'],
        default: 'ON_TRACK',
        index: true,
      },
    },
    closure: {
      closedAt: { type: Date, default: null },
      closedBy: { type: mongoose.Schema.Types.Mixed, default: null },
      reason: { type: String, default: '' },
      postmortem: { type: mongoose.Schema.Types.Mixed, default: null },
    },
    reopenHistory: [
      {
        reopenedAt: { type: Date, default: Date.now },
        reopenedBy: { type: mongoose.Schema.Types.Mixed, default: null },
        reason: { type: String, default: '' },
        triggeringEvidence: { type: String, default: null },
      },
    ],
    evidence: [
      {
        evidenceId: { type: String, required: true },
        tool: { type: String, required: true },
        executionId: { type: String, default: null },
        rawOutput: { type: String, required: true },
        hash: { type: String, required: true },
        artifactType: { type: String, default: 'RAW_OUTPUT' },
        capturedAt: { type: Date, default: Date.now },
      },
    ],
    aiNotes: [
      {
        noteId: { type: String },
        prompt: { type: String },
        response: { type: String },
        actionProposals: [
          {
            actionType: {
              type: String,
              enum: ['ANALYSIS_ONLY', 'USER_APPROVED_TOOL_ACTION', 'PRIVILEGED_ACTION'],
              default: 'ANALYSIS_ONLY',
            },
            tool: { type: String },
            target: { type: String },
            args: [{ type: String }],
            rationale: { type: String },
            requiresApproval: { type: Boolean, default: false },
            approvalRole: { type: String, default: 'operator' },
          },
        ],
        model: { type: String },
        timestamp: { type: Date, default: Date.now },
      },
    ],
    timeline: [
      {
        action: { type: String, required: true },
        performedBy: { type: mongoose.Schema.Types.Mixed, default: 'system' },
        timestamp: { type: Date, default: Date.now },
        details: { type: String, default: '' },
      },
    ],
    // Phase 81: External ITSM ticket bindings for bidirectional synchronization
    externalTickets: [
      {
        provider: {
          type: String,
          enum: ['JIRA', 'SERVICENOW', 'PAGERDUTY', 'GENERIC'],
          required: true,
        },
        integrationId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'IntegrationConfig',
          required: true,
        },
        ticketId: { type: String, required: true },       // e.g. "10024" or ServiceNow sys_id
        ticketKey: { type: String, required: true },      // e.g. "SEC-104" or "INC001004"
        ticketUrl: { type: String, required: true },      // Direct external browser link
        externalStatus: { type: String, required: true }, // Raw external status (e.g. "In Progress")
        syncStatus: {
          type: String,
          enum: ['IN_SYNC', 'SYNC_PENDING', 'SYNC_FAILED', 'MANUAL_OVERRIDE'],
          default: 'IN_SYNC',
        },
        lastSyncAt: { type: Date, default: Date.now },
        lastError: { type: String, default: null },
        syncDirection: {
          type: String,
          enum: ['BIDIRECTIONAL', 'OUTBOUND_ONLY', 'INBOUND_ONLY'],
          default: 'BIDIRECTIONAL',
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

caseSchema.index({ status: 1, severity: 1 });
caseSchema.index({ organizationId: 1, status: 1 });
caseSchema.index({ organizationId: 1, severity: 1 });
caseSchema.index({ organizationId: 1, createdAt: -1 });
caseSchema.index({ 'assets': 1 });
// Phase 81: Compound indexes for external ticket lookups with tenant isolation
caseSchema.index({ 'externalTickets.ticketKey': 1, organizationId: 1 });
caseSchema.index({ 'externalTickets.ticketId': 1, 'externalTickets.provider': 1 });

module.exports = mongoose.models.Case || mongoose.model('Case', caseSchema);
