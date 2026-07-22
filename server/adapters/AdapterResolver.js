/**
 * @module AdapterResolver
 * @description Resolves the best AdapterDescriptor for a given Capability.
 * Does NOT instantiate adapters.
 */
class AdapterResolver {
    /**
     * @param {import('./AdapterRegistry')} adapterRegistry
     */
    constructor(adapterRegistry) {
        if (!adapterRegistry) {
            throw new Error("AdapterRegistry is required for AdapterResolver");
        }
        this.adapterRegistry = adapterRegistry;
    }

    /**
     * Finds the best AdapterDescriptor for a capability.
     * @param {import('./CapabilityDescriptor')} capability
     * @returns {import('./AdapterDescriptor')|null}
     */
    resolveAdapter(capability) {
        const allDescriptors = this.adapterRegistry.getAllDescriptors();
        
        // Find matching, active and compatible descriptors
        const compatible = allDescriptors.filter(desc => desc.isCompatible(capability));
        
        if (compatible.length === 0) {
            return null;
        }

        // Return first match (could be expanded to select optimal)
        return compatible[0];
    }
}

module.exports = AdapterResolver;
