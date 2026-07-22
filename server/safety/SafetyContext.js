/**
 * @module SafetyContext
 * @description Context used by Safety layer for validation.
 * "Runtime Integration Pending"
 */
class SafetyContext {
    /**
     * @param {Object} params
     * @param {string} params.prompt
     * @param {string} params.capabilityId
     * @param {string} params.userId
     * @param {string} params.sessionId
     */
    constructor({ prompt, capabilityId, userId, sessionId }) {
        this.prompt = prompt;
        this.capabilityId = capabilityId;
        this.userId = userId;
        this.sessionId = sessionId;
    }

    /**
     * Validates safety context structure.
     * @returns {boolean}
     */
    isValid() {
        return !!this.userId && !!this.sessionId;
    }
}

module.exports = SafetyContext;
