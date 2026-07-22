/**
 * @module RuntimeCapabilityContext
 * @description Immutable data structure holding context passed into capability.
 */
class RuntimeCapabilityContext {
    /**
     * @param {Object} props
     * @param {string} props.executionId
     * @param {Object} props.payload
     * @param {Object} props.identity
     */
    constructor(props) {
        this.executionId = props.executionId;
        this.payload = props.payload ? { ...props.payload } : {};
        this.identity = props.identity ? { ...props.identity } : {};

        Object.freeze(this.payload);
        Object.freeze(this.identity);
        Object.freeze(this);
    }
}

module.exports = RuntimeCapabilityContext;
