const mongoose = require('mongoose');

const JobSchema = new mongoose.Schema({
    jobId: { type: String, required: true },
    executionId: { type: String, required: false }, // Optional workflow parent
    capabilityId: { type: String, required: true },
    ownerId: { type: String, required: true },
    status: { type: String, required: true },
    createdAt: { type: Number, required: true },
    updatedAt: { type: Number, required: true },
    error: { type: mongoose.Schema.Types.Mixed, default: null },
    result: { type: mongoose.Schema.Types.Mixed, default: null },
    rawOutput: { type: mongoose.Schema.Types.Mixed, default: null },
    normalizedOutput: { type: mongoose.Schema.Types.Mixed, default: null },
    intelligenceReport: { type: mongoose.Schema.Types.Mixed, default: null }
}, {
    timestamps: false,
    versionKey: false,
    minimize: false
});

// Using jobId as unique since executionId represents the parent workflow
JobSchema.index({ jobId: 1 }, { unique: true }); 
JobSchema.index({ executionId: 1 });
JobSchema.index({ ownerId: 1 });
JobSchema.index({ status: 1 });
JobSchema.index({ ownerId: 1, createdAt: 1 });
JobSchema.index({ status: 1, createdAt: 1 });

module.exports = mongoose.model('Job', JobSchema);
