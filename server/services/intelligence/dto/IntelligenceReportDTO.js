const ScanCorrelationDTO = require('./ScanCorrelationDTO');

/**
 * @module IntelligenceReportDTO
 * @description The final aggregate report.
 */
class IntelligenceReportDTO {
    /**
     * @param {Object} data 
     * @param {string} data.reportId - Unique ID for the report.
     * @param {string} data.target - Primary target of this report.
     * @param {number} data.generatedAt - Timestamp.
     * @param {ScanCorrelationDTO[]} data.correlations - Deduplicated findings.
     * @param {Object} data.summary - Executive and technical summary.
     * @param {string} data.summary.executiveSummary
     * @param {string} data.summary.technicalSummary
     * @param {Object} data.statistics - Count of issues by severity.
     * @param {number} data.statistics.critical
     * @param {number} data.statistics.high
     * @param {number} data.statistics.medium
     * @param {number} data.statistics.low
     * @param {number} data.statistics.informational
     * @param {number} data.statistics.total
     * @param {string[]} data.recommendations - Top level recommendations.
     */
    constructor(data) {
        this.reportId = data.reportId;
        this.target = data.target;
        this.generatedAt = data.generatedAt || Date.now();
        this.correlations = Array.isArray(data.correlations) ? [...data.correlations] : [];
        this.summary = {
            executiveSummary: data.summary?.executiveSummary || '',
            technicalSummary: data.summary?.technicalSummary || ''
        };
        this.statistics = {
            critical: data.statistics?.critical || 0,
            high: data.statistics?.high || 0,
            medium: data.statistics?.medium || 0,
            low: data.statistics?.low || 0,
            informational: data.statistics?.informational || 0,
            total: data.statistics?.total || 0
        };
        this.recommendations = Array.isArray(data.recommendations) ? [...data.recommendations] : [];

        Object.freeze(this.summary);
        Object.freeze(this.statistics);
        Object.freeze(this.recommendations);
        Object.freeze(this.correlations);
        Object.freeze(this);
    }
}
module.exports = IntelligenceReportDTO;
