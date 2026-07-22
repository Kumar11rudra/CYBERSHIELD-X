/**
 * @module DomainEvent
 * @description Immutable abstract base payload for all domain events.
 */
class DomainEvent {
    /**
     * @param {Object} props
     * @param {string} props.eventId
     * @param {string} props.correlationId
     * @param {number} props.timestamp
     * @param {string} props.eventType
     * @param {Object} props.payload
     */
    constructor(props) {
        const type = props.eventType || props.type;
        if (!type) {
            throw new Error('DomainEvent missing required eventType.');
        }

        const crypto = require('crypto');
        this.eventId = props.eventId || crypto.randomUUID();
        this.correlationId = props.correlationId || (props.payload && (props.payload.executionId || props.payload.jobId)) || 'system-event';
        this.timestamp = props.timestamp || Date.now();
        this.eventType = type;
        this.payload = props.payload ? { ...props.payload } : {};

        Object.freeze(this.payload);
        Object.freeze(this);
    }
}

module.exports = DomainEvent;
