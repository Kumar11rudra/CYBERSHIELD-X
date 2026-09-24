/**
 * 🛡️ CyberShield X — IntegrationSyncEvent Model (Phase 81)
 *
 * Durable, immutable audit trail for all inbound webhook deliveries
 * and outbound ITSM ticket dispatch attempts.
 *
 * Key design decisions (ADR 81-03):
 * - syncId is the unique, application-generated primary identifier
 * - organizationId is the authoritative tenant key (never from payload)
 * - payloadHash stores SHA-256 digest for integrity verification
 * - Zero native MongoDB TTL index — retention governed exclusively
 *   by Phase 75 DataLifecycleService (category: 'integration_audit')
 * - Bound to Phase 75 LegalHoldRecord for compliance preservation
 *
 * PHASE BOUNDARY:
 * - Phase 80 (Cloud Telemetry): FROZEN — zero interference
 * - Phase 79 (Decision Intelligence): FROZEN — zero writes
 * - Phase 78 (Security Data Fabric): no graph projections from this model
 */

const mongoose = require('mongoose');

const integrationSyncEventSchema = new mongoose.Schema(
  {
    syncId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    organizationId: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      index: true,
    },
    integrationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'IntegrationConfig',
      required: true,
    },
    provider: {
      type: String,
      enum: ['JIRA', 'SERVICENOW', 'PAGERDUTY', 'GENERIC'],
      required: true,
      index: true,
    },
    direction: {
      type: String,
      enum: ['INBOUND', 'OUTBOUND'],
      required: true,
      index: true,
    },
    eventType: {
      type: String,
      required: true,
      trim: true,
    }, // e.g. "TICKET_CREATED", "STATUS_UPDATED", "APPROVAL_CALLBACK"
    targetEntityType: {
      type: String,
      enum: ['CASE', 'INCIDENT', 'APPROVAL'],
      required: true,
    },
    targetEntityId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    }, // caseId, incidentId, or approvalId
    externalTicketKey: {
      type: String,
      default: null,
      trim: true,
    },
    payloadHash: {
      type: String,
      required: true,
      trim: true,
    }, // SHA-256 hash of payload
    status: {
      type: String,
      enum: ['SUCCESS', 'DUPLICATE', 'FAILED', 'REJECTED'],
      required: true,
    },
    errorMessage: {
      type: String,
      default: null,
    },
    attempt: {
      type: Number,
      default: 1,
      min: 1,
    },
    durationMs: {
      type: Number,
      default: 0,
      min: 0,
    },
    processedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Compound indexes for efficient tenant-scoped queries
integrationSyncEventSchema.index({ organizationId: 1, processedAt: -1 });
integrationSyncEventSchema.index({ organizationId: 1, provider: 1, processedAt: -1 });
integrationSyncEventSchema.index({ organizationId: 1, targetEntityId: 1 });

module.exports =
  mongoose.models.IntegrationSyncEvent ||
  mongoose.model('IntegrationSyncEvent', integrationSyncEventSchema);
