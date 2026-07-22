const AuditResult = require('./AuditResult');

/**
 * @module AuditFormatter
 * @description Normalizes internal audit records (events) and produces the structured AuditResult. NEVER generates UI text.
 */
class AuditFormatter {
    /**
     * @param {Array<import('./AuditEvent')>} events 
     * @param {Object} metadata 
     * @returns {AuditResult}
     */
    format(events, metadata = {}) {
        const severity = this._calculateHighestSeverity(events);
        
        return new AuditResult({
            success: true,
            events,
            severity,
            warnings: [],
            metadata
        });
    }

    _calculateHighestSeverity(events) {
        const levels = { 'DEBUG': 1, 'INFO': 2, 'WARNING': 3, 'ERROR': 4, 'CRITICAL': 5 };
        let highest = 'INFO';
        
        for (const evt of events) {
            if (levels[evt.severity] > levels[highest]) {
                highest = evt.severity;
            }
        }
        return highest;
    }
}

module.exports = AuditFormatter;
