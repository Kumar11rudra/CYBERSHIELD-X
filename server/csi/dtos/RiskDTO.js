'use strict';

const { randomUUID } = require('crypto');

/**
 * RiskDTO
 *
 * Immutable, deterministically calculated risk score.
 * Produced exclusively by RiskScoringEngine — never by the AI layer.
 *
 * Invariants:
 *   - Frozen via Object.freeze().
 *   - numericalScore is sealed to prevent AI modification.
 *   - AI layer reads this DTO but cannot write to it.
 *   - scoringVector provides full audit trail of how the score was computed.
 *
 * Per ADR-003: AI must NEVER recalculate, override, or estimate numericalScore.
 */

const SEVERITY_LABELS = Object.freeze({
    critical : [80, 100],
    high     : [60, 79],
    medium   : [35, 59],
    low      : [10, 34],
    info     : [0,  9],
});

function scoreToSeverity(score) {
    for (const [label, [min, max]] of Object.entries(SEVERITY_LABELS)) {
        if (score >= min && score <= max) return label;
    }
    return 'info';
}

class RiskDTO {
    /**
     * @param {object} params
     * @param {string} [params.riskId]         - UUID (auto-generated if omitted)
     * @param {string} params.targetId         - UUID of the csi_assets record
     * @param {string} params.executionId      - UUID of the orchestration job
     * @param {number} params.numericalScore   - Final risk score 0–100 (deterministic)
     * @param {object} params.scoringVector    - Breakdown: { findingType: contributedScore }
     * @param {number} params.findingCount     - Total number of findings processed
     * @param {string} [params.calculatedAt]   - ISO-8601 (defaults to now)
     */
    constructor({ riskId, targetId, executionId, numericalScore, scoringVector, findingCount, calculatedAt }) {
        if (!targetId)    throw new TypeError('[RiskDTO] targetId is required.');
        if (!executionId) throw new TypeError('[RiskDTO] executionId is required.');
        if (typeof numericalScore !== 'number' || numericalScore < 0 || numericalScore > 100) {
            throw new TypeError('[RiskDTO] numericalScore must be a number between 0 and 100.');
        }
        if (typeof findingCount !== 'number' || findingCount < 0) {
            throw new TypeError('[RiskDTO] findingCount must be a non-negative number.');
        }

        this.riskId         = riskId || randomUUID();
        this.targetId       = targetId;
        this.executionId    = executionId;
        this.numericalScore = numericalScore;
        this.severity       = scoreToSeverity(numericalScore);
        this.scoringVector  = Object.freeze({ ...scoringVector });
        this.findingCount   = findingCount;
        this.calculatedAt   = calculatedAt || new Date().toISOString();

        Object.freeze(this);
    }
}

module.exports = { RiskDTO, scoreToSeverity, SEVERITY_LABELS };
