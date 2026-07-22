const CapabilityDTO = require('./dto/CapabilityDTO');

/**
 * @module CapabilityMetadataRepository
 * @description Serves capability metadata primarily sourced from the runtime PluginRegistry/CapabilityResolver.
 */
class CapabilityMetadataRepository {
    /**
     * @param {Object} deps 
     * @param {import('../../chatbot_core/runtime/CapabilityResolver')} deps.capabilityResolver
     * @param {import('../../chatbot_core/storage/IStorageProvider')} deps.storageProvider
     */
    constructor(deps) {
        this.capabilityResolver = deps.capabilityResolver;
        this.storageProvider = deps.storageProvider; // Reserved for future overrides (e.g., disabling via UI)
    }

    async findAll() {
        // Source of truth is PluginRegistry via capabilityResolver
        const plugins = this.capabilityResolver.pluginManager.pluginRegistry.getAll();
        const capabilities = [];

        for (const plugin of plugins) {
            for (const cap of plugin.manifest.capabilities) {
                capabilities.push(new CapabilityDTO({
                    id: cap.capabilityId,
                    name: cap.name || cap.capabilityId,
                    description: cap.description,
                    category: cap.category || plugin.manifest.pluginId,
                    version: plugin.manifest.version,
                    requiredRole: cap.requiredRole || cap.role,
                    requiredPermission: cap.requiredPermission || cap.permission,
                    enabled: true, // Derived from runtime
                    visibility: 'public'
                }));
            }
        }
        return capabilities;
    }

    async findById(id) {
        const capabilities = await this.findAll();
        return capabilities.find(cap => cap.id === id) || null;
    }
}
module.exports = CapabilityMetadataRepository;
