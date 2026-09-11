/**
 * 🛡️ CyberShield X — ThreatHunt Model (Phase 71)
 *
 * Implements persistent SOC Threat Hunt definitions with structured query ASTs,
 * hypothesis formulation, data source bindings, bounded time horizons, and MITRE ATT&CK mapping.
 *
 * Status: DRAFT -> READY -> RUNNING -> COMPLETED / NO_MATCH / MATCHED / FAILED / CANCELLED
 */

const mongoose = require('mongoose');

const huntConditionSchema = new mongoose.Schema(
  {
    field: { type: String, required: true, trim: true },
    operator: {
      type: String,
      enum: ['equals', 'not_equals', 'contains', 'regex', 'greater_than', 'less_than', 'in'],
      required: true,
    },
    value: { type: mongoose.Schema.Types.Mixed, required: true },
  },
  { _id: false }
);

const structuredQuerySchema = new mongoose.Schema(
  {
    entity: {
      type: String,
      enum: ['asset', 'hostname', 'ip', 'domain', 'url', 'ioc', 'executionId', 'finding', 'alert', 'incident', 'detection'],
      required: true,
      default: 'finding',
    },
    conditions: {
      type: [huntConditionSchema],
      default: [],
    },
    booleanLogic: {
      type: String,
      enum: ['AND', 'OR'],
      default: 'AND',
    },
  },
  { _id: false }
);

const mitreAttackSchema = new mongoose.Schema(
  {
    techniqueId: { type: String, required: true, trim: true }, // e.g. "T1059.001"
    tactic: { type: String, required: true, trim: true },      // e.g. "Execution"
    techniqueName: { type: String, required: true, trim: true }, // e.g. "PowerShell"
    evidenceRefs: [{ type: String, trim: true }],
  },
  { _id: false }
);

const threatHuntSchema = new mongoose.Schema(
  {
    huntId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'Hunt name is required'],
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    hypothesis: {
      type: String,
      required: [true, 'Hunt hypothesis is required'],
      trim: true,
      maxlength: 1000,
    },
    category: {
      type: String,
      enum: [
        'IOC_SWEEP',
        'BEHAVIORAL',
        'DNS_ANOMALY',
        'OUTBOUND_C2',
        'CREDENTIAL_ACCESS',
        'EXECUTION_ANOMALY',
        'CUSTOM',
      ],
      default: 'CUSTOM',
      index: true,
    },
    structuredQuery: {
      type: structuredQuerySchema,
      required: true,
    },
    dataSources: {
      type: [String],
      enum: ['FINDINGS', 'ALERTS', 'INCIDENTS', 'ASSETS', 'IOCS', 'TERMINAL_JOBS'],
      default: ['FINDINGS', 'ALERTS'],
    },
    timeRange: {
      type: {
        type: String,
        enum: ['relative', 'absolute'],
        default: 'relative',
      },
      relativeWindow: {
        type: String,
        enum: ['15m', '1h', '24h', '7d', '30d'],
        default: '24h',
      },
      startDate: { type: Date, default: null },
      endDate: { type: Date, default: null },
    },
    status: {
      type: String,
      enum: ['DRAFT', 'READY', 'RUNNING', 'COMPLETED', 'NO_MATCH', 'MATCHED', 'FAILED', 'CANCELLED'],
      default: 'DRAFT',
      index: true,
    },
    schedule: {
      enabled: { type: Boolean, default: false },
      type: {
        type: String,
        enum: ['MANUAL', 'SCHEDULED', 'EVENT_TRIGGERED'],
        default: 'MANUAL',
      },
      cronExpression: { type: String, default: null },
      lastRun: { type: Date, default: null },
      nextRun: { type: Date, default: null },
      failureCount: { type: Number, default: 0 },
    },
    mitreAttack: [mitreAttackSchema],
    tags: [{ type: String, trim: true }],
    organizationId: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
      index: true,
    },
    createdBy: {
      type: String,
      default: 'ANALYST',
    },
    lastModifiedBy: {
      type: String,
      default: 'ANALYST',
    },
    executionCount: {
      type: Number,
      default: 0,
    },
    lastExecutionId: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for multi-tenant query performance
threatHuntSchema.index({ organizationId: 1, status: 1 });
threatHuntSchema.index({ organizationId: 1, createdAt: -1 });
threatHuntSchema.index({ organizationId: 1, huntId: 1 });
threatHuntSchema.index({ 'schedule.enabled': 1, 'schedule.nextRun': 1 });

module.exports = mongoose.model('ThreatHunt', threatHuntSchema);
