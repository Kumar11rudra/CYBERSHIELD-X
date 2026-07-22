class ExecutionStartResponseDTO {
    constructor({ jobId, status, result = null }) {
        this.jobId = jobId;
        this.status = status;
        this.result = result;
        Object.freeze(this);
    }
}
module.exports = ExecutionStartResponseDTO;
