/**
 * @module SafetyDecision
 * @description Standard response for all Safety validators.
 * "Runtime Integration Pending"
 */
class SafetyDecision {
    /**
     * @param {Object} params
     * @param {boolean} params.isSafe
     * @param {string} params.reason
     * @param {Object} params.metadata
     */
    constructor({ isSafe, reason = '', metadata = {} }) {
        this.isSafe = isSafe;
        this.reason = reason;
        this.metadata = metadata;
    }
}

module.exports = SafetyDecision;
