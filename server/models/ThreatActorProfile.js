/**
 * 🛡️ CyberShield X — ThreatActorProfile Model (Phase 71)
 *
 * Stores structured threat actor profiles, aliases, attribution status,
 * targeted industry sectors, and associated MITRE ATT&CK techniques.
 */

const mongoose = require('mongoose');

const threatActorProfileSchema = new mongoose.Schema(
  {
    actorId: {
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
      maxlength: 120,
    },
    aliases: [{ type: String, trim: true }],
    origin: {
      type: String,
      trim: true,
      default: 'Unknown',
    },
    motivation: {
      type: String,
      enum: ['Espionage', 'Financial', 'Sabotage', 'Hacktivism', 'Unknown'],
      default: 'Unknown',
    },
    attributionStatus: {
      type: String,
      enum: ['OBSERVED', 'REPORTED', 'ANALYST_ASSESSMENT', 'UNCONFIRMED'],
      default: 'REPORTED',
      index: true,
    },
    targetedSectors: [{ type: String, trim: true }],
    associatedTechniques: [
      {
        techniqueId: { type: String, required: true },
        tactic: { type: String, required: true },
        techniqueName: { type: String, required: true },
      },
    ],
    knownIOCs: [
      {
        type: { type: String, required: true },
        value: { type: String, required: true },
      },
    ],
    references: [
      {
        source: { type: String, required: true },
        url: { type: String, default: '' },
      },
    ],
    organizationId: {
      type: String,
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

threatActorProfileSchema.index({ organizationId: 1, name: 1 });

module.exports = mongoose.model('ThreatActorProfile', threatActorProfileSchema);
