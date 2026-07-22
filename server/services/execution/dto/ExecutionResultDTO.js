class ExecutionResultDTO {
    constructor({ jobId, success, data = null, error = null }) {
        this.jobId = jobId;
        this.success = success;
        this.data = data;
        this.error = error;
        Object.freeze(this);
    }
}
module.exports = ExecutionResultDTO;
