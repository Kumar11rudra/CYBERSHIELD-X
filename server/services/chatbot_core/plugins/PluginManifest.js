/**
 * @module PluginManifest
 * @description Immutable metadata for a plugin.
 */
class PluginManifest {
    /**
     * @param {Object} props
     * @param {string} props.pluginId
     * @param {string} props.name
     * @param {string} props.version
     * @param {Array<import('./PluginCapability')>} props.capabilities
     * @param {Array<string>} props.dependencies
     * @param {Object} props.compatibility
     * @param {Object} props.lifecycle
     */
    constructor(props) {
        this.pluginId = props.pluginId;
        this.name = props.name;
        this.version = props.version;
        this.capabilities = props.capabilities ? [...props.capabilities] : [];
        this.dependencies = props.dependencies ? [...props.dependencies] : [];
        this.compatibility = props.compatibility ? { ...props.compatibility } : {};
        this.lifecycle = props.lifecycle ? { ...props.lifecycle } : {};

        Object.freeze(this.capabilities);
        Object.freeze(this.dependencies);
        Object.freeze(this.compatibility);
        Object.freeze(this.lifecycle);
        Object.freeze(this);
    }
}

module.exports = PluginManifest;
