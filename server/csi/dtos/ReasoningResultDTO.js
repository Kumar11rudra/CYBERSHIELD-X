'use strict';

/**
 * Deep freezes an object and its nested properties.
 * @param {Object} obj
 * @returns {Object}
 */
function deepFreeze(obj) {
    if (!obj || typeof obj !== 'object' || Object.isFrozen(obj)) {
        return obj;
    }

    Object.keys(obj).forEach(prop => {
        deepFreeze(obj[prop]);
    });

    return Object.freeze(obj);
}

class ReasoningResultDTO {
    /**
     * @param {Object} params
     * @param {string} params.executiveSummary
     * @param {Array<string>} params.observations
     * @param {Array<string>} params.attackChains
     * @param {Array<string>} params.remediation
     * @param {string} params.confidenceExplanation
     * @param {string} params.reasoningVersion
     * @param {string} params.executionId
     */
    constructor(params) {
        if (!params || typeof params !== 'object') {
            throw new TypeError('[ReasoningResultDTO] Invalid constructor parameters');
        }

        // Validate required fields
        const required = [
            'executiveSummary', 'observations', 'attackChains', 
            'remediation', 'confidenceExplanation', 'reasoningVersion', 'executionId'
        ];

        for (const req of required) {
            if (!(req in params) || params[req] === undefined || params[req] === null) {
                throw new TypeError(`[ReasoningResultDTO] Missing required field: ${req}`);
            }
        }

        if (!Array.isArray(params.observations)) throw new TypeError('observations must be an array');
        if (!Array.isArray(params.attackChains)) throw new TypeError('attackChains must be an array');
        if (!Array.isArray(params.remediation)) throw new TypeError('remediation must be an array');

        this.executiveSummary = params.executiveSummary;
        this.observations = [...params.observations];
        this.attackChains = [...params.attackChains];
        this.remediation = [...params.remediation];
        this.confidenceExplanation = params.confidenceExplanation;
        this.reasoningVersion = params.reasoningVersion;
        this.executionId = params.executionId;
        this.timestamp = new Date().toISOString();

        // Recursively freeze to prevent Phase D mutations
        deepFreeze(this);
    }
}

module.exports = { ReasoningResultDTO };
