class ExecutionJobDTO {
    constructor({ jobId, capabilityId, status, createdAt, updatedAt, error = null }) {
        this.jobId = jobId;
        this.capabilityId = capabilityId;
        this.status = status;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.error = error;
        Object.freeze(this);
    }
}
module.exports = ExecutionJobDTO;
