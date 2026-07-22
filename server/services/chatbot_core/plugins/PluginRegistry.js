/**
 * @module PluginRegistry
 * @description Maintains plugin metadata only. No lifecycle management.
 */
class PluginRegistry {
    constructor() {
        /** @type {Map<string, import('./PluginDescriptor')>} */
        this.plugins = new Map();
    }

    /**
     * Registers a plugin descriptor.
     * @param {import('./PluginDescriptor')} descriptor 
     */
    register(descriptor) {
        if (!descriptor || !descriptor.manifest || !descriptor.manifest.pluginId) {
            throw new Error('Invalid PluginDescriptor.');
        }
        this.plugins.set(descriptor.manifest.pluginId, descriptor);
    }

    /**
     * Looks up a plugin by ID.
     * @param {string} pluginId 
     * @returns {import('./PluginDescriptor')|undefined}
     */
    lookup(pluginId) {
        return this.plugins.get(pluginId);
    }
    
    /**
     * Returns all registered plugins.
     * @returns {Array<import('./PluginDescriptor')>}
     */
    getAll() {
        return Array.from(this.plugins.values());
    }
}

module.exports = PluginRegistry;
