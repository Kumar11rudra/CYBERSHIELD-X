const PluginResult = require('./PluginResult');
const PluginManifest = require('./PluginManifest');

/**
 * @module PluginManager
 * @description Central coordinator. Validates manifests and delegates to registry and loader.
 */
class PluginManager {
    /**
     * @param {Object} deps 
     * @param {import('./PluginRegistry')} deps.pluginRegistry
     * @param {import('./PluginLoader')} deps.pluginLoader
     */
    constructor(deps) {
        this.pluginRegistry = deps.pluginRegistry;
        this.pluginLoader = deps.pluginLoader;
    }

    /**
     * Validates raw manifest payload.
     * @param {Object} rawManifest 
     * @returns {PluginResult}
     */
    validateManifest(rawManifest) {
        if (!rawManifest.pluginId || typeof rawManifest.pluginId !== 'string') {
            return PluginResult.fallbackError('Invalid or missing pluginId.');
        }
        if (!rawManifest.version || typeof rawManifest.version !== 'string') {
            return PluginResult.fallbackError('Invalid or missing version.');
        }
        if (rawManifest.capabilities && !Array.isArray(rawManifest.capabilities)) {
            return PluginResult.fallbackError('Capabilities must be an array.');
        }
        
        // Capability ID uniqueness check
        if (rawManifest.capabilities) {
            const capIds = rawManifest.capabilities.map(c => c.capabilityId);
            const uniqueCapIds = new Set(capIds);
            if (capIds.length !== uniqueCapIds.size) {
                return PluginResult.fallbackError('Duplicate capability IDs found in manifest.');
            }
        }

        return new PluginResult({ success: true, status: 'VALID' });
    }

    /**
     * Coordinates loading a plugin by delegating to PluginLoader and registering it.
     * @param {string} pluginId 
     * @returns {Promise<PluginResult>}
     */
    async loadPlugin(pluginId) {
        try {
            // Load via loader (which creates the Descriptor)
            const loaderResult = await this.pluginLoader.load(pluginId);
            
            if (!loaderResult.success) {
                return loaderResult;
            }

            const descriptor = loaderResult.data.descriptor;

            // Validate manifest structure BEFORE registration
            const validation = this.validateManifest(descriptor.manifest);
            if (!validation.success) {
                return validation;
            }

            // Register securely
            this.pluginRegistry.register(descriptor);

            return new PluginResult({
                success: true,
                status: 'PLUGIN_LOADED',
                data: { pluginId: descriptor.manifest.pluginId }
            });
        } catch (error) {
            return PluginResult.fallbackError(`PluginManager load failure: ${error.message}`);
        }
    }
}

module.exports = PluginManager;
