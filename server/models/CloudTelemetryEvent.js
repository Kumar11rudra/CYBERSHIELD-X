/**
 * 🛡️ CyberShield X — CloudTelemetryEvent Model (Phase 80)
 *
 * Enterprise Multi-Cloud Normalized Telemetry & Ingestion Schema:
 * - Stores normalized audit events from AWS CloudTrail, Azure Activity Log, and GCP Cloud Audit.
 * - Enforces multi-tenant isolation and duplicate delivery prevention via compound unique indexing:
 *   { organizationId: 1, provider: 1, nativeEventId: 1 } (unique: true)
 * - Governed strictly by Phase 75 DataLifecycleService (entityType: 'cloud_telemetry').
 * - CRITICAL: ZERO native MongoDB TTL indexes permitted to protect records under active legal hold.
 */

const mongoose = require('mongoose');

const cloudTelemetryEventSchema = new mongoose.Schema(
  {
    canonicalEventId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    }, // Format: "CLOUD-{PROVIDER}-{organizationId}-{nativeEventId}"
    organizationId: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      index: true,
    },
    connectorId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    provider: {
      type: String,
      enum: ['AWS', 'AZURE', 'GCP'],
      required: true,
      index: true,
    },
    nativeEventId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    cloudAccountId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    region: {
      type: String,
      default: 'GLOBAL',
      trim: true,
    },
    eventTime: {
      type: Date,
      required: true,
      index: true,
    },
    ingestionTime: {
      type: Date,
      default: Date.now,
    },
    lastObservedAt: {
      type: Date,
      default: Date.now,
    },
    graphMaterialized: {
      type: Boolean,
      default: false,
      index: true,
    },
    projectionRetryCount: {
      type: Number,
      default: 0,
    },
    projectionStatus: {
      type: String,
      enum: ['PENDING', 'MATERIALIZED', 'SKIPPED_READ_FILTER', 'POISON_FAILED'],
      default: 'PENDING',
    },
    lastProjectionError: {
      type: String,
      default: null,
    },
    actor: {
      principalId: { type: String, default: null },
      principalType: { type: String, default: null },
      principalName: { type: String, default: null },
      callerIp: { type: String, default: null },
    },
    action: {
      service: { type: String, default: null },
      operation: { type: String, default: null },
      category: { type: String, default: null },
      tier: { type: Number, enum: [1, 2, 3, 4, 5], default: 5 },
      isMutating: { type: Boolean, default: false },
    },
    resources: [
      {
        resourceType: { type: String, default: null },
        resourceId: { type: String, default: null },
        resourceName: { type: String, default: null },
      },
    ],
    outcome: {
      type: String,
      enum: ['SUCCESS', 'FAILURE', 'DENIED', 'UNKNOWN'],
      default: 'SUCCESS',
    },
    severity: {
      type: String,
      enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFORMATIONAL'],
      default: 'INFORMATIONAL',
    },
    signatureStatus: {
      type: String,
      enum: ['VERIFIED', 'SHARED_SECRET', 'UNSIGNED', 'FAILED'],
      default: 'VERIFIED',
    },
    rawPayloadHash: {
      type: String,
      required: true,
    },
    parameters: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// 1. Compound Unique Index for Multi-Tenant Idempotency (Zero Cross-Tenant or Cross-Provider Collisions)
cloudTelemetryEventSchema.index({ organizationId: 1, provider: 1, nativeEventId: 1 }, { unique: true });

// 2. Operational & Investigation Query Indexes
cloudTelemetryEventSchema.index({ organizationId: 1, eventTime: -1 });
cloudTelemetryEventSchema.index({ organizationId: 1, provider: 1, cloudAccountId: 1 });
cloudTelemetryEventSchema.index({ organizationId: 1, 'actor.callerIp': 1 });

// 3. Recovery & Reconciliation Index (Startup Reconciler)
cloudTelemetryEventSchema.index({ graphMaterialized: 1, projectionRetryCount: 1 });

module.exports =
  mongoose.models.CloudTelemetryEvent ||
  mongoose.model('CloudTelemetryEvent', cloudTelemetryEventSchema);
