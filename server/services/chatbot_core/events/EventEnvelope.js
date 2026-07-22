/**
 * @module EventEnvelope
 * @description Immutable container holding the event and its metadata.
 */
class EventEnvelope {
    /**
     * @param {Object} props
     * @param {import('./DomainEvent')} props.event
     * @param {import('./EventMetadata')} props.metadata
     */
    constructor(props) {
        if (!props.event) throw new Error('EventEnvelope requires a DomainEvent.');

        this.event = props.event;
        this.metadata = props.metadata;

        Object.freeze(this);
    }
}

module.exports = EventEnvelope;
