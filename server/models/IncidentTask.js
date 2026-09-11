/**
 * 🛡️ CyberShield X — IncidentTask Model (Phase 72)
 *
 * Implements structured investigation tasks attached to active security incidents and cases.
 * Scoped by organizationId with status, priority, assignees, checklists, and dependencies.
 */

const mongoose = require('mongoose');

const incidentTaskSchema = new mongoose.Schema(
  {
    taskId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    incidentId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    caseId: {
      type: String,
      default: null,
      index: true,
      trim: true,
    },
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      maxlength: 250,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    status: {
      type: String,
      enum: ['TODO', 'IN_PROGRESS', 'BLOCKED', 'DONE', 'CANCELLED'],
      default: 'TODO',
      index: true,
    },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'MEDIUM',
      index: true,
    },
    assignee: {
      id: { type: String, default: null },
      name: { type: String, default: null },
    },
    dueAt: {
      type: Date,
      default: null,
    },
    evidenceReferences: [
      {
        evidenceId: { type: String, required: true },
        description: { type: String, default: '' },
      },
    ],
    dependencies: [{ type: String, trim: true }],
    checklist: [
      {
        item: { type: String, required: true },
        done: { type: Boolean, default: false },
        completedAt: { type: Date, default: null },
      },
    ],
    createdBy: {
      id: { type: String, default: 'system' },
      name: { type: String, default: 'System' },
    },
    completedBy: {
      id: { type: String, default: null },
      name: { type: String, default: null },
    },
    completedAt: {
      type: Date,
      default: null,
    },
    organizationId: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

incidentTaskSchema.index({ organizationId: 1, incidentId: 1 });
incidentTaskSchema.index({ organizationId: 1, status: 1 });
incidentTaskSchema.index({ organizationId: 1, 'assignee.id': 1 });

module.exports = mongoose.models.IncidentTask || mongoose.model('IncidentTask', incidentTaskSchema);
