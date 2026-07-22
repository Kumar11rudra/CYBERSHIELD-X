/**
 * @module AuditEvent
 * @description Immutable DTO representing a discrete normalized runtime event.
 */
class AuditEvent {
    /**
     * @param {Object} props
     * @param {string} props.eventType
     * @param {string} props.severity - from AuditSeverity
     * @param {Object} props.details
     * @param {AuditMetadata} props.metadata
     * @param {AuditContext} props.context
     */
    constructor(props) {
        this.eventId = `evt-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        this.eventType = props.eventType || 'UNKNOWN_EVENT';
        this.severity = props.severity || 'INFO';
        this.details = props.details ? { ...props.details } : {};
        this.metadata = props.metadata;
        this.context = props.context;
        
        Object.freeze(this.details);
        Object.freeze(this);
    }
}

module.exports = AuditEvent;
