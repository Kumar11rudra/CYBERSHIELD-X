'use strict';

const { randomUUID } = require('crypto');

/**
 * ReportDTO
 *
 * Immutable final intelligence report bundle.
 * Produced by ReportGenerationEngine after AI reasoning is complete.
 *
 * Invariants:
 *   - Frozen via Object.freeze().
 *   - aiNarrative is the ONLY field populated by the AI layer.
 *   - All other fields come from the deterministic pipeline.
 */

const VALID_FORMATS = Object.freeze(['json', 'markdown']);

class ReportDTO {
    /**
     * @param {object} params
     * @param {string} [params.reportId]         - UUID (auto-generated if omitted)
     * @param {string} params.targetId           - UUID of the csi_assets record
     * @param {string} params.executionId        - UUID of the orchestration job
     * @param {import('./RiskDTO').RiskDTO} params.riskDto
     * @param {import('./FindingDTO').FindingDTO[]} params.findings
     * @param {object} params.aiNarrative        - { summary, attackChains[], remediation[] }
     * @param {'json'|'markdown'} [params.format] - Defaults to 'json'
     * @param {string} [params.generatedAt]      - ISO-8601 (defaults to now)
     */
    constructor({ reportId, targetId, executionId, riskDto, findings, aiNarrative, format = 'json', generatedAt }) {
        if (!targetId)    throw new TypeError('[ReportDTO] targetId is required.');
        if (!executionId) throw new TypeError('[ReportDTO] executionId is required.');
        if (!riskDto)     throw new TypeError('[ReportDTO] riskDto is required.');
        if (!Array.isArray(findings)) throw new TypeError('[ReportDTO] findings must be an array.');
        if (!VALID_FORMATS.includes(format)) {
            throw new TypeError(`[ReportDTO] format must be one of: ${VALID_FORMATS.join(', ')}.`);
        }

        // Validate aiNarrative shape — guard against AI hallucination
        const narrative = aiNarrative || {};
        const safeNarrative = {
            summary      : typeof narrative.summary === 'string' ? narrative.summary : '',
            attackChains : Array.isArray(narrative.attackChains) ? narrative.attackChains : [],
            remediation  : Array.isArray(narrative.remediation)  ? narrative.remediation  : [],
        };

        this.reportId    = reportId || randomUUID();
        this.targetId    = targetId;
        this.executionId = executionId;
        this.riskDto     = riskDto;                          // already frozen RiskDTO
        this.findings    = Object.freeze([...findings]);     // already frozen FindingDTOs
        this.aiNarrative = Object.freeze(safeNarrative);
        this.format      = format;
        this.generatedAt = generatedAt || new Date().toISOString();

        Object.freeze(this);
    }
}

module.exports = { ReportDTO, VALID_FORMATS };
