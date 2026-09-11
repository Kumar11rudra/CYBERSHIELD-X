/**
 * 🛡️ CyberShield X — ComplianceControl Model (Phase 74)
 *
 * Defines compliance framework controls across 9 modular domains.
 * Establishes concrete mapping criteria to actual system evidence records.
 */

const mongoose = require('mongoose');

const complianceControlSchema = new mongoose.Schema(
  {
    controlId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    framework: {
      type: String,
      default: 'CYBERSHIELD_CORE',
      index: true,
    },
    domain: {
      type: String,
      required: true,
      enum: [
        'ACCESS_CONTROL',
        'LOGGING_MONITORING',
        'VULNERABILITY_MANAGEMENT',
        'INCIDENT_RESPONSE',
        'CHANGE_MANAGEMENT',
        'ASSET_MANAGEMENT',
        'DATA_PROTECTION',
        'THREAT_DETECTION',
        'BUSINESS_CONTINUITY',
      ],
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    requirement: {
      type: String,
      default: '',
    },
    requiredEvidenceTypes: [
      {
        type: String,
        trim: true,
      },
    ],
    targetEntities: [
      {
        type: String,
        trim: true,
      },
    ],
    owner: {
      type: String,
      default: 'SOC_COMPLIANCE_LEAD',
    },
    organizationId: {
      type: mongoose.Schema.Types.Mixed,
      index: true,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

complianceControlSchema.index({ organizationId: 1, controlId: 1 });
complianceControlSchema.index({ organizationId: 1, domain: 1 });

module.exports = mongoose.models.ComplianceControl || mongoose.model('ComplianceControl', complianceControlSchema);
