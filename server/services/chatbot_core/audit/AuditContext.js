/**
 * @module AuditContext
 * @description Immutable context snapshot for policy evaluation and audit recording.
 */
class AuditContext {
    /**
     * @param {Object} props 
     * @param {string} props.userId
     * @param {string} props.sessionId
     * @param {Array} props.metrics
     * @param {Array} props.trace
     */
    constructor(props) {
        this.userId = props.userId || 'anonymous';
        this.sessionId = props.sessionId || 'system-session';
        this.metrics = props.metrics ? [...props.metrics] : [];
        this.trace = props.trace ? [...props.trace] : [];
        
        Object.freeze(this.metrics);
        Object.freeze(this.trace);
        Object.freeze(this);
    }
}

module.exports = AuditContext;
