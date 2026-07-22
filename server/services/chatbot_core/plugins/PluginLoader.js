/**
 * @module PluginLoader
 * @description Abstract contract for loading plugin metadata without executing or importing them.
 */
class PluginLoader {
    /**
     * Loads a plugin manifest and creates a descriptor.
     * @param {string} pluginId 
     * @returns {Promise<import('./PluginResult')>}
     */
    async load(pluginId) {
        throw new Error('PluginLoader.load() must be implemented by subclasses.');
    }

    /**
     * @param {string} pluginId 
     * @returns {Promise<import('./PluginResult')>}
     */
    async unload(pluginId) {
        throw new Error('PluginLoader.unload() must be implemented by subclasses.');
    }
}

module.exports = PluginLoader;
