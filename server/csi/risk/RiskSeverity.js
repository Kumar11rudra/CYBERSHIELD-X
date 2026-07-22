'use strict';

const riskWeights = require('./RiskWeights');

class RiskSeverity {
    /**
     * Map a numeric score to a severity based on the configuration in RiskWeights
     * @param {number} score 
     * @returns {string} Severity (e.g. 'HIGH')
     */
    static mapScoreToSeverity(score) {
        if (typeof score !== 'number') {
            throw new TypeError('[RiskSeverity] Score must be a number');
        }

        const severities = riskWeights.getSeverities();

        for (const sev of severities) {
            if (score >= sev.minScore && score <= sev.maxScore) {
                return sev.severity;
            }
        }

        // If score is somehow out of bounds despite normalization, throw
        throw new Error(`[RiskSeverity] Score ${score} cannot be mapped to any severity`);
    }
}

module.exports = RiskSeverity;
