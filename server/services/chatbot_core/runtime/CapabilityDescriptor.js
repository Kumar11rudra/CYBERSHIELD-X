/**
 * @module CapabilityDescriptor
 * @description Immutable metadata for an identified capability.
 */
class CapabilityDescriptor {
    /**
     * @param {Object} props
     * @param {string} props.capabilityId
     * @param {string} props.pluginId
     * @param {string} props.type
     * @param {string} props.description
     */
    constructor(props) {
        this.capabilityId = props.capabilityId;
        this.pluginId = props.pluginId;
        this.type = props.type;
        this.description = props.description;

        Object.freeze(this);
    }
}

module.exports = CapabilityDescriptor;
