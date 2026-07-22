/**
 * @module AuditResult
 * @description Immutable DTO representing the final structured output of the AuditEngine.
 */
class AuditResult {
    /**
     * @param {Object} props
     * @param {boolean} props.success
     * @param {Array} props.events
     * @param {string} props.severity
     * @param {Array} props.warnings
     * @param {Object} props.metadata
     */
    constructor(props) {
        this.success = props.success ?? true;
        this.events = props.events ? [...props.events] : [];
        this.severity = props.severity || 'INFO';
        this.warnings = props.warnings ? [...props.warnings] : [];
        this.metadata = props.metadata ? { ...props.metadata } : {};
        
        Object.freeze(this.events);
        Object.freeze(this.warnings);
        Object.freeze(this.metadata);
        Object.freeze(this);
    }

    /**
     * Guard 1: Safe fallback result when the engine fails internally.
     */
    static emptyFallback(errorReason) {
        return new AuditResult({
            success: false,
            events: [],
            severity: 'ERROR',
            warnings: [errorReason],
            metadata: { fallback: true }
        });
    }
}

module.exports = AuditResult;
