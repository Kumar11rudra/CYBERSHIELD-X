'use strict';

/**
 * Utility to deeply freeze objects
 */
function deepFreeze(object) {
    if (object && typeof object === 'object') {
        Object.freeze(object);
        Object.getOwnPropertyNames(object).forEach(prop => {
            if (object[prop] !== null &&
                (typeof object[prop] === 'object' || typeof object[prop] === 'function') &&
                !Object.isFrozen(object[prop])) {
                deepFreeze(object[prop]);
            }
        });
    }
    return object;
}

class RiskFactorDTO {
    /**
     * @param {object} params
     * @param {string} params.findingId
     * @param {string} params.ruleId
     * @param {number} params.weight
     * @param {string} params.category
     * @param {string} params.severity
     * @param {string} params.reason
     * @param {number} params.confidence
     */
    constructor({ findingId, ruleId, weight, category, severity, reason, confidence }) {
        if (!findingId || typeof findingId !== 'string') throw new TypeError('[RiskFactorDTO] findingId is required');
        if (!ruleId || typeof ruleId !== 'string') throw new TypeError('[RiskFactorDTO] ruleId is required');
        if (typeof weight !== 'number') throw new TypeError('[RiskFactorDTO] weight must be a number');
        if (!category || typeof category !== 'string') throw new TypeError('[RiskFactorDTO] category is required');
        if (!severity || typeof severity !== 'string') throw new TypeError('[RiskFactorDTO] severity is required');
        if (!reason || typeof reason !== 'string') throw new TypeError('[RiskFactorDTO] reason is required');
        if (typeof confidence !== 'number') throw new TypeError('[RiskFactorDTO] confidence must be a number');

        this.findingId = findingId;
        this.ruleId = ruleId;
        this.weight = weight;
        this.category = category;
        this.severity = severity;
        this.reason = reason;
        this.confidence = confidence;

        deepFreeze(this);
    }
}

module.exports = { RiskFactorDTO, deepFreeze };
