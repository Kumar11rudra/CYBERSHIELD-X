const AuditDecision = require('./AuditDecision');

/**
 * @module AuditPolicy
 * @description Pure policy evaluator. Never knows RuntimePipeline implementation details.
 */
class AuditPolicy {
    /**
     * @param {import('./AuditContext')} auditContext 
     * @param {import('./AuditEvent')} auditEvent 
     * @returns {AuditDecision}
     */
    evaluate(auditContext, auditEvent) {
        // Pure function, zero side effects
        if (auditEvent.severity === 'DEBUG') {
            return new AuditDecision(false, 'DEBUG severity is dropped by default policy');
        }
        
        return new AuditDecision(true, 'Event meets audit threshold');
    }
}

module.exports = AuditPolicy;
