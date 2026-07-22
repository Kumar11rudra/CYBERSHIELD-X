/**
 * @module PluginCapability
 * @description Represents an abstract capability contract provided by a plugin.
 */
class PluginCapability {
    /**
     * @param {Object} props
     * @param {string} props.capabilityId
     * @param {string} props.type
     * @param {string} props.description
     */
    constructor(props) {
        this.capabilityId = props.capabilityId;
        this.type = props.type;
        this.description = props.description;

        Object.freeze(this);
    }
}

module.exports = PluginCapability;
