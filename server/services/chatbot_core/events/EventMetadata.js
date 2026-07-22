/**
 * @module EventMetadata
 * @description Additional routing/tracing metadata for envelopes.
 */
class EventMetadata {
    /**
     * @param {Object} props
     * @param {string} props.source - originating module or service
     * @param {number} props.depth - event chain depth
     */
    constructor(props) {
        this.source = props.source || 'UNKNOWN';
        this.depth = props.depth || 0;

        Object.freeze(this);
    }
}

module.exports = EventMetadata;
