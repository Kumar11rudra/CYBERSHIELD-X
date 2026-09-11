/**
 * 🛡️ CyberShield X — DetectionRule Model (Phase 70)
 *
 * Defines deterministic detection rules with lifecycle management:
 * DRAFT -> TESTING -> APPROVED -> ACTIVE / DISABLED
 * AI-generated rules remain DRAFT until tested and explicitly approved.
 */

const mongoose = require('mongoose');

const conditionSchema = new mongoose.Schema(
  {
    field: { type: String, required: true, trim: true },
    operator: {
      type: String,
      required: true,
      set: (v) => (v ? String(v).toLowerCase() : 'equals'),
      enum: ['equals', 'not_equals', 'contains', 'regex', 'greater_than', 'less_than', 'in'],
      default: 'equals',
    },
    value: { type: mongoose.Schema.Types.Mixed, required: true },
  },
  { _id: false }
);

const detectionRuleSchema = new mongoose.Schema(
  {
    ruleId: {
      type: String,
      required: true,
      index: true,
      trim: true,
      default: function () {
        return this.contentId || 'RULE-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8);
      },
    },
    name: {
      type: String,
      required: [true, 'Detection rule name is required'],
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
      enum: ['INFO', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'MEDIUM',
      index: true,
    },
    category: {
      type: String,
      default: 'general_threat',
      index: true,
    },
    status: {
      type: String,
      enum: ['DRAFT', 'TESTING', 'REVIEW', 'APPROVED', 'ACTIVE', 'DISABLED', 'RETIRED'],
      default: 'ACTIVE',
      index: true,
    },
    enabled: {
      type: Boolean,
      default: true,
      index: true,
    },
    version: {
      type: Number,
      default: 1,
    },
    contentId: {
      type: String,
      trim: true,
      index: true,
    },
    ruleVersion: {
      type: String,
      default: '1.0.0',
      trim: true,
    },
    revision: {
      type: Number,
      default: 1,
    },
    confidence: {
      type: mongoose.Schema.Types.Mixed,
      default: 'HIGH',
      index: true,
    },
    dataSources: [{ type: String, trim: true }],
    queryDefinition: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    mitreAttack: {
      type: [
        {
          tactic: { type: String, trim: true },
          techniqueId: { type: String, trim: true, index: true },
          techniqueName: { type: String, trim: true },
          subTechniqueId: { type: String, trim: true },
        },
      ],
      set: (v) => (Array.isArray(v) ? v : v ? [v] : []),
      default: [],
    },
    references: [{ type: String, trim: true }],
    falsePositiveGuidance: {
      type: String,
      default: '',
      trim: true,
    },
    responseGuidance: {
      type: String,
      default: '',
      trim: true,
    },
    testFixtures: [
      {
        fixtureId: {
          type: String,
          default: () => 'FIX-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        },
        name: { type: String, default: 'Fixture' },
        description: { type: String, default: '' },
        input: { type: mongoose.Schema.Types.Mixed, default: {} },
        eventPayload: { type: mongoose.Schema.Types.Mixed },
        payload: { type: mongoose.Schema.Types.Mixed },
        expectedResult: { type: String, enum: ['MATCH', 'NO_MATCH'], required: true },
        lastRunAt: { type: Date, default: null },
        lastResult: { type: String, enum: ['PASS', 'FAIL', 'NOT_RUN'], default: 'NOT_RUN' },
        actualMatch: { type: Boolean, default: null },
        executionDurationMs: { type: Number, default: 0 },
        error: { type: String, default: null },
      },
    ],
    testSummary: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    changeReason: {
      type: String,
      default: 'Initial revision',
      trim: true,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    approvedBy: {
      type: String,
      default: null,
    },
    activatedAt: {
      type: Date,
      default: null,
    },
    disabledAt: {
      type: Date,
      default: null,
    },
    retiredAt: {
      type: Date,
      default: null,
    },
    dependencies: {
      dataSources: [{ type: String, trim: true }],
      requiredCapabilities: [{ type: String, trim: true }],
      iocSources: [{ type: String, trim: true }],
    },
    healthStatus: {
      type: String,
      enum: ['HEALTHY', 'NEEDS_TEST', 'FAILING_TESTS', 'NO_ACTIVITY', 'DISABLED', 'EXPIRED_DEPENDENCY', 'UNSUPPORTED'],
      default: 'NEEDS_TEST',
      index: true,
    },
    reviewHistory: [
      {
        reviewer: { type: String, required: true },
        decision: { type: String, enum: ['APPROVE', 'REJECT', 'REQUEST_CHANGES'], required: true },
        decisionReason: { type: String, default: '' },
        reviewedVersion: { type: String, default: '1.0.0' },
        reviewedRevision: { type: Number, default: 1 },
        testSummary: { type: mongoose.Schema.Types.Mixed, default: {} },
        risk: { type: String, default: 'LOW' },
        timestamp: { type: Date, default: Date.now },
      },
    ],
    packId: {
      type: String,
      default: null,
      index: true,
    },
    author: {
      type: mongoose.Schema.Types.Mixed,
      default: 'SYSTEM',
    },
    isAiGenerated: {
      type: Boolean,
      default: false,
    },
    aiDraft: {
      type: Boolean,
      default: false,
    },
    aiMetadata: {
      rationale: { type: String, default: '' },
      proposedConditions: { type: Array, default: [] },
      expectedFalsePositives: { type: String, default: '' },
      confidence: { type: Number, default: 0 },
    },
    conditions: {
      type: [conditionSchema],
      set: (v) => (Array.isArray(v) ? v : v ? [v] : []),
      default: [],
    },
    requiredEvidenceFields: [{ type: String, trim: true }],
    affectedEntityTypes: [{ type: String, trim: true }],
    tags: [{ type: String, trim: true }],
    responsePolicy: {
      actionType: { type: String, default: 'ALERT' },
      requiresApproval: { type: Boolean, default: true },
      playbookId: { type: String, default: null },
      autoRemediate: { type: Boolean, default: false },
    },
    matchCount: {
      type: Number,
      default: 0,
    },
    lastTriggeredAt: {
      type: Date,
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

detectionRuleSchema.pre('validate', function (next) {
  if (Array.isArray(this.testFixtures)) {
    for (const f of this.testFixtures) {
      if ((!f.input || (typeof f.input === 'object' && Object.keys(f.input).length === 0)) && f.eventPayload) {
        f.input = f.eventPayload;
      }
    }
  }
  next();
});

detectionRuleSchema.pre('save', function (next) {
  if (!this.contentId && this.ruleId) {
    this.contentId = `DET-${this.ruleId}`;
  }
  next();
});

detectionRuleSchema.index({ organizationId: 1, status: 1 });
detectionRuleSchema.index({ organizationId: 1, contentId: 1 });
detectionRuleSchema.index({ organizationId: 1, 'mitreAttack.techniqueId': 1 });
detectionRuleSchema.index({ organizationId: 1, category: 1 });
detectionRuleSchema.index({ organizationId: 1, healthStatus: 1 });
detectionRuleSchema.index({ status: 1, enabled: 1 });
detectionRuleSchema.index({ category: 1, severity: 1 });

module.exports = mongoose.models.DetectionRule || mongoose.model('DetectionRule', detectionRuleSchema);
