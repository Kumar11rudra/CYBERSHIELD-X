const mongoose = require('mongoose');

const WorkflowSchema = new mongoose.Schema({
    executionId: { type: String, required: true },
    templateId: { type: String, required: true },
    ownerId: { type: String, required: true },
    status: { type: String, required: true },
    globalParameters: { type: mongoose.Schema.Types.Mixed, default: {} },
    startTime: { type: Number, default: null },
    endTime: { type: Number, default: null },
    error: { type: mongoose.Schema.Types.Mixed, default: null },
    jobMappings: { type: [mongoose.Schema.Types.Mixed], default: [] },
    result: { type: mongoose.Schema.Types.Mixed, default: null },
    createdAt: { type: Number, default: Date.now },
    updatedAt: { type: Number, default: Date.now }
}, {
    timestamps: false,
    versionKey: false,
    minimize: false
});

WorkflowSchema.index({ executionId: 1 }, { unique: true });
WorkflowSchema.index({ ownerId: 1 });
WorkflowSchema.index({ status: 1 });
WorkflowSchema.index({ ownerId: 1, createdAt: 1 });
WorkflowSchema.index({ status: 1, createdAt: 1 });

module.exports = mongoose.model('Workflow', WorkflowSchema);
