const mongoose = require('mongoose');

const investigationGraphSnapshotSchema = new mongoose.Schema({
  snapshotId: { type: String, required: true, unique: true, index: true },
  organizationId: { type: mongoose.Schema.Types.Mixed, default: null, index: true },
  rootEntity: {
    entityType: { type: String, required: true },
    entityId: { type: String, required: true }
  },
  nodeCount: { type: Number, required: true },
  edgeCount: { type: Number, required: true },
  queryDefinition: { type: mongoose.Schema.Types.Mixed, required: true },
  nodesSnapshot: { type: mongoose.Schema.Types.Mixed, required: true },
  edgesSnapshot: { type: mongoose.Schema.Types.Mixed, required: true },
  generatedAt: { type: Date, default: Date.now },
  contentHash: { type: String, required: true, index: true },
  evidenceReferences: [{ type: String }],
  createdBy: {
    userId: String,
    username: String,
    role: String
  }
}, {
  timestamps: true
});

investigationGraphSnapshotSchema.index({ organizationId: 1, generatedAt: -1 });

module.exports = mongoose.models.InvestigationGraphSnapshot || mongoose.model('InvestigationGraphSnapshot', investigationGraphSnapshotSchema);
