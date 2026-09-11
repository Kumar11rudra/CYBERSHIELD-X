/**
 * 🛡️ CyberShield X — SLODefinition Model (Phase 76)
 *
 * Defines Service Level Objectives for core platform services.
 * Governs thresholds, objectives, and measurement windows without fabricated baselines.
 */

const mongoose = require('mongoose');

const sloDefinitionSchema = new mongoose.Schema(
  {
    sloId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    service: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    metricType: {
      type: String,
      enum: [
        'API_AVAILABILITY',
        'API_LATENCY',
        'DB_AVAILABILITY',
        'JOB_COMPLETION_RATE',
        'REPORT_GENERATION_SUCCESS',
        'THREAT_HUNT_RELIABILITY',
        'EVENT_DELIVERY_SUCCESS',
        'TOOL_RUNTIME_AVAILABILITY',
      ],
      required: true,
      index: true,
    },
    targetPercent: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    thresholdMs: {
      type: Number,
      default: null,
    },
    windowDays: {
      type: Number,
      default: 7,
      min: 1,
    },
    status: {
      type: String,
      enum: ['MEETING', 'AT_RISK', 'BREACHED', 'INSUFFICIENT_DATA', 'NOT_MEASURED'],
      default: 'NOT_MEASURED',
      index: true,
    },
    currentAttainmentPercent: {
      type: Number,
      default: null,
    },
    errorBudgetPercent: {
      type: Number,
      default: null,
    },
    errorBudgetRemainingPercent: {
      type: Number,
      default: null,
    },
    lastEvaluatedAt: {
      type: Date,
      default: null,
    },
    organizationId: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
      index: true,
    },
    createdBy: {
      type: String,
      default: 'SYSTEM',
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

sloDefinitionSchema.index({ organizationId: 1, service: 1, status: 1 });

module.exports = mongoose.model('SLODefinition', sloDefinitionSchema);
