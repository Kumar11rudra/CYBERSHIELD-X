const mongoose = require('mongoose');

const automationPlaybookRevisionSchema = new mongoose.Schema({
  playbookId: { type: String, required: true, index: true },
  organizationId: { type: mongoose.Schema.Types.Mixed, default: null, index: true },
  version: { type: Number, required: true },
  stepsSnapshot: { type: mongoose.Schema.Types.Mixed, required: true },
  changeSummary: { type: String, required: true },
  changedBy: { type: String, required: true },
  contentHash: { type: String, required: true, index: true },
  createdAt: { type: Date, default: Date.now }
}, {
  timestamps: false
});

automationPlaybookRevisionSchema.index({ playbookId: 1, version: -1 });

module.exports = mongoose.models.AutomationPlaybookRevision || mongoose.model('AutomationPlaybookRevision', automationPlaybookRevisionSchema);
