const CapabilityDescriptor = require('./CapabilityDescriptor');
const CapabilityBinding = require('./CapabilityBinding');

/**
 * @module CapabilityResolver
 * @description Pure resolver logic for connecting abstract capability requests to contracts.
 */
class CapabilityResolver {
    /**
     * @param {Object} deps 
     * @param {import('../plugins/PluginManager')} deps.pluginManager
     */
    constructor(deps) {
        this.pluginManager = deps.pluginManager;
    }

    /**
     * Resolves a capability ID to a CapabilityBinding.
     * @param {string} capabilityId
     * @param {import('./CapabilityContract')} contractInstance - Injected purely for mock wiring inside DI.
     * @returns {CapabilityBinding|null}
     */
    resolve(capabilityId, contractInstance) {
        const plugins = this.pluginManager.pluginRegistry.getAll();
        
        for (const plugin of plugins) {
            const cap = plugin.manifest.capabilities.find(c => c.capabilityId === capabilityId);
            if (cap) {
                const descriptor = new CapabilityDescriptor({
                    capabilityId: cap.capabilityId,
                    pluginId: plugin.manifest.pluginId,
                    type: cap.type,
                    description: cap.description
                });

                return new CapabilityBinding({
                    descriptor,
                    contract: contractInstance // In a real system, the PluginManager would supply the concrete class
                });
            }
        }

        return null; // Not found
    }
}

module.exports = CapabilityResolver;
