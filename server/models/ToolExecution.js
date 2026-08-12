const mongoose = require('mongoose');

const toolExecutionSchema = new mongoose.Schema({
  executionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  toolId: {
    type: String,
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
    index: true
  },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    default: null,
    index: true
  },
  status: {
    type: String,
    enum: ['pending', 'running', 'success', 'failed'],
    default: 'pending',
    index: true
  },
  executionMode: {
    type: String,
    default: 'sync'
  },
  startedAt: {
    type: Date,
    required: true,
    default: Date.now,
    index: true
  },
  completedAt: {
    type: Date
  },
  durationMs: {
    type: Number,
    default: 0
  },
  targetHash: {
    type: String,
    required: true,
    index: true
  },
  provider: {
    type: String,
    default: 'CSI'
  },
  errorCode: {
    type: String,
    default: null
  },
  errorCategory: {
    type: String,
    default: null
  },
  resultSignature: {
    type: String,
    default: null
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, { timestamps: true });

const ToolExecution = mongoose.model('ToolExecution', toolExecutionSchema);
module.exports = ToolExecution;
