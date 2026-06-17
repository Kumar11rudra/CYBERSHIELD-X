const mongoose = require('mongoose');

const actionResultSchema = new mongoose.Schema({
  actionType: { type: String, required: true },
  order: { type: Number, default: 0 },
  success: { type: Boolean, required: true },
  response: { type: mongoose.Schema.Types.Mixed, default: null }, // e.g. { ticketKey: 'SEC-123', url: '...' }
  error: { type: String, default: '' },
  durationMs: { type: Number, default: 0 },
}, { _id: false });

const playbookLogSchema = new mongoose.Schema(
  {
    playbookId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Playbook',
      required: true,
      index: true,
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    triggeredBy: {
      type: String,
      enum: ['vulnerability', 'notification', 'sla_breach', 'scan', 'manual'],
      required: true,
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,   // vulnId / notificationId / scanId
      required: false,
    },
    entityType: {
      type: String,
      enum: ['Vulnerability', 'Notification', 'Scan', 'unknown'],
      default: 'unknown',
    },
    status: {
      type: String,
      enum: ['success', 'partial', 'failed'],
      required: true,
    },
    actionResults: {
      type: [actionResultSchema],
      default: [],
    },
    context: {
      type: mongoose.Schema.Types.Mixed,  // snapshot of the entity at time of trigger
      default: {},
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // logs are immutable
  }
);

playbookLogSchema.index({ playbookId: 1, createdAt: -1 });
playbookLogSchema.index({ organizationId: 1, createdAt: -1 });

module.exports = mongoose.model('PlaybookLog', playbookLogSchema);
