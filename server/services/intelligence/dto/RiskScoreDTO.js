/**
 * @module RiskScoreDTO
 * @description Standardized severity and scoring model.
 */
class RiskScoreDTO {
    /**
     * @param {Object} data 
     * @param {string} data.severity - 'Critical', 'High', 'Medium', 'Low', 'Informational'.
     * @param {number} data.score - A numerical value (e.g. 0.0 to 10.0 like CVSS).
     */
    constructor(data) {
        if (!data.severity) {
            throw new Error('RiskScoreDTO missing severity');
        }
        
        const validSeverities = ['Critical', 'High', 'Medium', 'Low', 'Informational'];
        if (!validSeverities.includes(data.severity)) {
            throw new Error(`Invalid severity: ${data.severity}`);
        }

        this.severity = data.severity;
        this.score = typeof data.score === 'number' ? data.score : 0.0;

        Object.freeze(this);
    }
}
module.exports = RiskScoreDTO;
