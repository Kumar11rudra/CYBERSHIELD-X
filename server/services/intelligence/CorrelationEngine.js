const DomainEvent = require('../chatbot_core/events/DomainEvent');

class CorrelationEngine {
    /**
     * @param {import('./FindingNormalizer')} normalizer 
     * @param {import('./FindingDeduplicator')} deduplicator 
     * @param {import('./IntelligenceReportService')} reportService 
     * @param {import('../chatbot_core/events/EventPublisher')} [eventPublisher]
     */
    constructor(normalizer, deduplicator, reportService, eventPublisher) {
        this.normalizer = normalizer;
        this.deduplicator = deduplicator;
        this.reportService = reportService;
        this.eventPublisher = eventPublisher;
    }

    /**
     * @param {import('../scanners/dto/ScanResultDTO')[]} scanResults 
     * @returns {import('./dto/IntelligenceReportDTO')}
     */
    correlate(scanResults) {
        if (!Array.isArray(scanResults) || scanResults.length === 0) {
            return this.reportService.generateReport([], 'Unknown Target');
        }

        let allNormalizedFindings = [];
        let primaryTarget = scanResults[0]?.target || 'Unknown Target';

        for (const result of scanResults) {
            const normalized = this.normalizer.normalize(result);
            allNormalizedFindings = allNormalizedFindings.concat(normalized);
        }

        const correlations = this.deduplicator.deduplicate(allNormalizedFindings);
        
        const report = this.reportService.generateReport(correlations, primaryTarget);

        if (this.eventPublisher) {
            // Non-blocking fire and forget
            this.eventPublisher.publish(new DomainEvent({
                type: 'INTELLIGENCE_READY',
                payload: {
                    reportId: report.reportId || 'N/A',
                    target: primaryTarget,
                    summary: `Generated ${report.correlations.length} correlated findings.`
                }
            }), 'CorrelationEngine').catch(() => {});
        }

        return report;
    }
}

module.exports = CorrelationEngine;
