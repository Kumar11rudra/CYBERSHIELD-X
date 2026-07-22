/**
 * @module ExecutionContext
 * @description Standard object encapsulating the execution request.
 * "Runtime Integration Pending"
 */
class ExecutionContext {
    /**
     * @param {Object} params
     * @param {string} params.id
     * @param {string} params.capabilityId
     * @param {string} params.userId
     * @param {Object} params.metadata
     */
    constructor({ id, capabilityId, userId, metadata = {} }) {
        this.id = id;
        this.capabilityId = capabilityId;
        this.userId = userId;
        this.metadata = metadata;
    }

    /**
     * Validates context structure.
     * @returns {boolean}
     */
    isValid() {
        return !!this.id && !!this.capabilityId && !!this.userId;
    }
}

module.exports = ExecutionContext;
