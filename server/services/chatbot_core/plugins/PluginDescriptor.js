/**
 * @module PluginDescriptor
 * @description Describes runtime plugin information combining Manifest and status.
 */
class PluginDescriptor {
    /**
     * @param {Object} props
     * @param {import('./PluginManifest')} props.manifest
     * @param {string} props.status - e.g., 'LOADED', 'ACTIVE', 'ERROR'
     * @param {number} props.loadedAt
     */
    constructor(props) {
        this.manifest = props.manifest;
        this.status = props.status || 'UNLOADED';
        this.loadedAt = props.loadedAt || Date.now();

        Object.freeze(this);
    }
}

module.exports = PluginDescriptor;
