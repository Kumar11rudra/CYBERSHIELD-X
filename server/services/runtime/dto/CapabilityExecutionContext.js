/**
 * @module CapabilityExecutionContext
 * @description Immutable DTO defining the context for executing a capability.
 */
class CapabilityExecutionContext {
    /**
     * @param {Object} data 
     * @param {string} data.userId
     * @param {string} data.capabilityId
     * @param {Object} data.parameters
     * @param {Object} data.environment
     */
    constructor({ userId, capabilityId, parameters = {}, environment = {} }) {
        this.userId = userId;
        this.capabilityId = capabilityId;
        this.parameters = Object.freeze({ ...parameters });
        this.environment = Object.freeze({ ...environment });
        Object.freeze(this);
    }
}
module.exports = CapabilityExecutionContext;
