const SecurityFindingDTO = require('./SecurityFindingDTO');
const RiskScoreDTO = require('./RiskScoreDTO');

/**
 * @module ScanCorrelationDTO
 * @description A deduplicated representation combining multiple findings that point to the same issue.
 */
class ScanCorrelationDTO {
    /**
     * @param {Object} data 
     * @param {string} data.correlationId - Unique ID for the correlated issue.
     * @param {string} data.title - Unified title.
     * @param {string} data.description - Unified description.
     * @param {string} data.target - The affected target.
     * @param {string} data.issueType - 'port', 'vulnerability', etc.
     * @param {SecurityFindingDTO[]} data.findings - Array of original raw findings that were merged.
     * @param {RiskScoreDTO} data.riskScore - Correlated risk score.
     */
    constructor(data) {
        this.correlationId = data.correlationId;
        this.title = data.title;
        this.description = data.description;
        this.target = data.target;
        this.issueType = data.issueType;
        this.findings = Array.isArray(data.findings) ? [...data.findings] : [];
        this.riskScore = data.riskScore;

        Object.freeze(this.findings);
        Object.freeze(this);
    }
}
module.exports = ScanCorrelationDTO;
