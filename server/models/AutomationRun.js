const mongoose = require('mongoose');

const actionStepSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'running', 'success', 'failed'],
    default: 'pending',
  },
  startedAt: {
    type: Date,
    default: Date.now,
  },
  completedAt: Date,
  durationMs: {
    type: Number,
    default: 0,
  },
  error: {
    type: String,
    default: '',
  },
  result: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },
}, { _id: false });

const automationRunSchema = new mongoose.Schema(
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
    trigger: {
      event: {
        type: String,
        required: true,
      },
      entityId: {
        type: mongoose.Schema.Types.ObjectId,
        required: false,
      },
      entityType: {
        type: String,
        required: false,
      },
    },
    status: {
      type: String,
      enum: ['pending', 'running', 'success', 'failed', 'partial'],
      default: 'pending',
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: Date,
    durationMs: {
      type: Number,
      default: 0,
    },
    actionCount: {
      type: Number,
      default: 0,
    },
    successfulActions: {
      type: Number,
      default: 0,
    },
    failedActions: {
      type: Number,
      default: 0,
    },
    actions: {
      type: [actionStepSchema],
      default: [],
    },
    result: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    error: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

automationRunSchema.index({ organizationId: 1, createdAt: -1 });
automationRunSchema.index({ playbookId: 1, createdAt: -1 });

module.exports = mongoose.model('AutomationRun', automationRunSchema);
