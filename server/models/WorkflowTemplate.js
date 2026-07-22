const mongoose = require('mongoose');

const WorkflowTemplateSchema = new mongoose.Schema({
    templateId: { type: String, required: true },
    version: { type: String, required: true, default: '1.0.0' },
    name: { type: String, required: true },
    description: { type: String, default: '' },
    stages: { type: [mongoose.Schema.Types.Mixed], required: true }
}, {
    timestamps: true,
    versionKey: false,
    minimize: false
});

WorkflowTemplateSchema.index({ templateId: 1 }, { unique: true });
WorkflowTemplateSchema.index({ version: 1 });

module.exports = mongoose.model('WorkflowTemplate', WorkflowTemplateSchema);
