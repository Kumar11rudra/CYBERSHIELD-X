/**
 * 🛡️ CyberShield X — IntegrationCredentialMetadata Model (Phase 75)
 *
 * Stores metadata and governance attributes for third-party integrations,
 * API connectors, and security webhooks.
 *
 * CRITICAL SECURITY INVARIANT:
 * NEVER persists raw passwords, secrets, or API keys.
 * Only stores public key fingerprints, expiry timestamps, and rotation policies.
 */

const mongoose = require('mongoose');

const integrationCredentialMetadataSchema = new mongoose.Schema(
  {
    integrationId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    organizationId: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      enum: ['SIEM', 'SOAR', 'EDR', 'TICKET', 'CLOUD', 'WEBHOOK', 'IDENTITY'],
      index: true,
    },
    owner: {
      id: { type: String, default: 'system' },
      username: { type: String, default: 'SYSTEM' },
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'EXPIRED', 'ROTATION_REQUIRED', 'DISABLED', 'RETIRED'],
      default: 'ACTIVE',
      index: true,
    },
    keyFingerprint: {
      type: String,
      required: true,
      trim: true,
    },
    keyAlgorithm: {
      type: String,
      default: 'SHA-256',
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    lastRotatedAt: {
      type: Date,
      default: Date.now,
    },
    rotationIntervalDays: {
      type: Number,
      default: 90,
      min: 1,
    },
    endpointUrl: {
      type: String,
      default: '',
      trim: true,
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

integrationCredentialMetadataSchema.index({ organizationId: 1, integrationId: 1 });
integrationCredentialMetadataSchema.index({ organizationId: 1, status: 1 });

module.exports =
  mongoose.models.IntegrationCredentialMetadata ||
  mongoose.model('IntegrationCredentialMetadata', integrationCredentialMetadataSchema);
