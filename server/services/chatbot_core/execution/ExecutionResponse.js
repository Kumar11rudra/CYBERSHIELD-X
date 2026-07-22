/**
 * @module ExecutionResponse
 * @description Standardized response wrapper holding the ExecutionContract and statuses.
 */
class ExecutionResponse {
    /**
     * @param {boolean} success 
     * @param {string} status 
     * @param {Object} data 
     * @param {string|null} error 
     * @param {ExecutionMetadata} metadata 
     */
    constructor(success, status, data, error, metadata) {
        this.success = success;
        this.status = status;
        this.data = data || {};
        this.error = error || null;
        this.metadata = metadata || {};
    }

    static success(data, metadata) {
        return new ExecutionResponse(true, 'COMPLETED', data, null, metadata);
    }

    static failure(errorReason, errorCode, metadata) {
        return new ExecutionResponse(false, errorCode, null, errorReason, metadata);
    }
}

module.exports = ExecutionResponse;
