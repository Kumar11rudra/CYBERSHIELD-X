'use strict';

const { deepFreeze } = require('./RiskFactorDTO');

class RiskResultDTO {
    /**
     * @param {object} params
     * @param {number} params.overallScore
     * @param {string} params.overallSeverity
     * @param {object} params.categories - Record of category scores e.g., { TLS: 40, DNS: 10 }
     * @param {RiskFactorDTO[]} params.riskFactors
     * @param {object[]} params.calculationTrace
     * @param {string} params.version - e.g., '1.0.0'
     * @param {string} params.executionId - UUID
     * @param {string} params.timestamp - ISO timestamp
     */
    constructor({ overallScore, overallSeverity, categories, riskFactors, calculationTrace, version, executionId, timestamp }) {
        if (typeof overallScore !== 'number') throw new TypeError('[RiskResultDTO] overallScore must be a number');
        if (!overallSeverity || typeof overallSeverity !== 'string') throw new TypeError('[RiskResultDTO] overallSeverity is required');
        if (!categories || typeof categories !== 'object') throw new TypeError('[RiskResultDTO] categories must be an object');
        if (!Array.isArray(riskFactors)) throw new TypeError('[RiskResultDTO] riskFactors must be an array');
        if (!Array.isArray(calculationTrace)) throw new TypeError('[RiskResultDTO] calculationTrace must be an array');
        if (!version || typeof version !== 'string') throw new TypeError('[RiskResultDTO] version is required');
        if (!executionId || typeof executionId !== 'string') throw new TypeError('[RiskResultDTO] executionId is required');
        if (!timestamp || typeof timestamp !== 'string') throw new TypeError('[RiskResultDTO] timestamp is required');

        this.overallScore = overallScore;
        this.overallSeverity = overallSeverity;
        this.categories = { ...categories };
        this.riskFactors = [...riskFactors];
        this.calculationTrace = [...calculationTrace];
        this.version = version;
        this.executionId = executionId;
        this.timestamp = timestamp;

        deepFreeze(this);
    }
}

module.exports = { RiskResultDTO };
