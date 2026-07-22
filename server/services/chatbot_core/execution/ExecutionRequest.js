/**
 * @module ExecutionRequest
 * @description Standardized data structure representing the normalized payload before it goes to a specific adapter.
 */
class ExecutionRequest {
    /**
     * @param {Object} plan - The abstract execution plan
     * @param {Object} capability - The resolved capability wrapper
     * @param {ExecutionMetadata} metadata - Request tracking metadata
     */
    constructor(plan, capability, metadata) {
        this.plan = plan;
        this.capability = capability;
        this.metadata = metadata;
    }
}

module.exports = ExecutionRequest;
