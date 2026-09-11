/**
 * 🛡️ CyberShield X — ThreatHuntExecution Model (Phase 71)
 *
 * Implements immutable records of threat hunt execution runs.
 * Stores resolved bounded time horizons, query snapshots, observed evidence items,
 * lineage pointers for promoted findings/incidents, and candidate detection references.
 */

const mongoose = require('mongoose');

const huntEvidenceSchema = new mongoose.Schema(
  {
    evidenceId: { type: String, required: true, trim: true },
    sourceEntity: {
      type: String,
      enum: ['Finding', 'Alert', 'Incident', 'Asset', 'IOCRecord', 'TerminalHistory'],
      required: true,
    },
    sourceId: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    summary: { type: String, default: '' },
    matchDetails: {
      matchedField: { type: String, required: true },
      matchedOperator: { type: String, required: true },
      matchedValue: { type: mongoose.Schema.Types.Mixed },
      targetValue: { type: mongoose.Schema.Types.Mixed },
    },
    rawEvidenceRef: { type: mongoose.Schema.Types.Mixed, default: null },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const promotedArtifactSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, trim: true },
    promotedAt: { type: Date, default: Date.now },
    promotedBy: { type: String, default: 'ANALYST' },
  },
  { _id: false }
);

const threatHuntExecutionSchema = new mongoose.Schema(
  {
    executionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    huntId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    huntName: {
      type: String,
      required: true,
      trim: true,
    },
    organizationId: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
      index: true,
    },
    triggeredBy: {
      type: String,
      default: 'ANALYST',
    },
    triggerType: {
      type: String,
      enum: ['MANUAL', 'SCHEDULED', 'EVENT_TRIGGERED'],
      default: 'MANUAL',
    },
    status: {
      type: String,
      enum: ['RUNNING', 'COMPLETED', 'NO_MATCH', 'MATCHED', 'FAILED', 'CANCELLED'],
      default: 'RUNNING',
      index: true,
    },
    startedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    durationMs: {
      type: Number,
      default: 0,
    },
    resolvedTimeRange: {
      start: { type: Date, required: true },
      end: { type: Date, required: true },
      windowLabel: { type: String, default: 'custom' },
    },
    querySnapshot: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    dataSourcesQueried: {
      type: [String],
      default: [],
    },
    resultCount: {
      type: Number,
      default: 0,
    },
    evidence: [huntEvidenceSchema],
    promotedFindings: [promotedArtifactSchema],
    promotedIncidents: [promotedArtifactSchema],
    detectionCandidateId: {
      type: String,
      default: null,
    },
    error: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    auditRef: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes
threatHuntExecutionSchema.index({ organizationId: 1, executionId: 1 });
threatHuntExecutionSchema.index({ huntId: 1, createdAt: -1 });
threatHuntExecutionSchema.index({ organizationId: 1, status: 1 });
threatHuntExecutionSchema.index({ startedAt: -1 });

module.exports = mongoose.model('ThreatHuntExecution', threatHuntExecutionSchema);
