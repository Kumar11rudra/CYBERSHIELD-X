const mongoose = require('mongoose');

const auditEventSchema = new mongoose.Schema(
  {
    eventId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    actor: {
      userId: { type: String, default: 'system' },
      username: { type: String, default: 'anonymous' },
      email: { type: String, default: 'system@cybershield.local' },
      role: { type: String, default: 'USER' },
      ip: { type: String, default: '127.0.0.1' },
    },
    action: {
      type: String,
      required: true,
      index: true,
    },
    resource: {
      resourceType: { type: String, default: 'SYSTEM' },
      resourceId: { type: String, default: 'GLOBAL' },
      type: { type: String, default: 'SYSTEM' },
      id: { type: String, default: 'GLOBAL' },
    },
    outcome: {
      type: String,
      default: 'SUCCESS',
      index: true,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    organizationId: {
      type: mongoose.Schema.Types.Mixed,
      index: true,
      default: null,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
      immutable: true,
    },
  },
  {
    timestamps: false,
    versionKey: false,
  }
);

auditEventSchema.index({ organizationId: 1, action: 1, timestamp: -1 });
auditEventSchema.index({ 'actor.userId': 1, timestamp: -1 });
auditEventSchema.index({ action: 1, timestamp: -1 });

module.exports = mongoose.models.AuditEvent || mongoose.model('AuditEvent', auditEventSchema);
