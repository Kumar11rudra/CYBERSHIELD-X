const mongoose = require('mongoose');

const terminalHistorySchema = new mongoose.Schema(
  {
    historyId: {
      type: String,
      default: () => `HIST-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      index: true,
      trim: true,
    },
    userId: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      index: true,
    },
    command: {
      type: String,
      required: true,
      trim: true,
    },
    tool: {
      type: String,
      required: true,
      trim: true,
    },
    target: {
      type: String,
      required: true,
      trim: true,
    },
    args: [{ type: String }],
    executionId: {
      type: String,
      trim: true,
    },
    durationMs: {
      type: Number,
      default: 0,
    },
    exitCode: {
      type: Number,
      default: 0,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

terminalHistorySchema.index({ userId: 1, timestamp: -1 });

module.exports = mongoose.models.TerminalHistory || mongoose.model('TerminalHistory', terminalHistorySchema);
