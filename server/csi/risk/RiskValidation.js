'use strict';

const riskWeights = require('./RiskWeights');

class RiskValidation {
    /**
     * @param {FindingDTO[]} findings 
     */
    static checkDuplicateFindings(findings) {
        if (!Array.isArray(findings)) {
            throw new TypeError('[RiskValidation] findings must be an array');
        }

        const seen = new Set();
        for (const f of findings) {
            if (!f.findingId) {
                throw new Error('[RiskValidation] Finding is missing findingId');
            }
            if (seen.has(f.findingId)) {
                throw new Error(`[RiskValidation] Duplicate findingId detected: ${f.findingId}`);
            }
            seen.add(f.findingId);
        }
    }

    /**
     * Ensure score is bound to [0, 100] exactly, returning normalized score.
     * Cap Logic: HARD_CAP_100
     * Floor Logic: HARD_FLOOR_0
     * @param {number} rawScore
     * @returns {number} 
     */
    static normalizeScore(rawScore) {
        if (typeof rawScore !== 'number' || isNaN(rawScore)) {
            throw new TypeError('[RiskValidation] Raw score must be a valid number');
        }

        const config = riskWeights.getNormalizationConfig();
        const maxScore = config.maxScore || 100;
        const minScore = config.minScore || 0;

        let normalized = rawScore;
        if (normalized > maxScore) {
            normalized = maxScore;
        }
        if (normalized < minScore) {
            normalized = minScore;
        }

        return normalized;
    }
}

module.exports = RiskValidation;
