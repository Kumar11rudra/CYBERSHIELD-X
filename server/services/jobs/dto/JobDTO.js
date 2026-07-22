const JobStatusDTO = require('./JobStatusDTO');

class JobDTO {
    constructor({ jobId, executionId, capabilityId, ownerId, status = JobStatusDTO.PENDING, createdAt = Date.now(), updatedAt = Date.now(), error = null, result = null, rawOutput = null, normalizedOutput = null, intelligenceReport = null }) {
        this.jobId = jobId;
        this.executionId = executionId;
        this.capabilityId = capabilityId;
        this.ownerId = ownerId;
        this.status = status;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.error = error;
        this.result = result; // Kept for backwards compatibility / generic execution
        this.rawOutput = rawOutput;
        this.normalizedOutput = normalizedOutput;
        this.intelligenceReport = intelligenceReport;
        Object.freeze(this);
    }

    withStatus(newStatus, error = this.error, result = this.result, overrides = {}) {
        return new JobDTO({
            ...this,
            status: newStatus,
            updatedAt: Date.now(),
            error,
            result,
            ...overrides
        });
    }
}
module.exports = JobDTO;
