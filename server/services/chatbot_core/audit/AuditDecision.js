/**
 * @module AuditDecision
 * @description Immutable DTO evaluating whether an event should be persisted or dropped.
 */
class AuditDecision {
    /**
     * @param {boolean} shouldAudit 
     * @param {string} reason 
     */
    constructor(shouldAudit, reason = '') {
        this.shouldAudit = shouldAudit;
        this.reason = reason;
        
        Object.freeze(this);
    }
}

module.exports = AuditDecision;
