/**
 * @module CapabilityRegistry
 * @description Owns business capabilities. Depends on ToolRegistry for tool metadata.
 */
class CapabilityRegistry {
    /**
     * @param {Object} toolRegistry - Dependency injected ToolRegistry.
     */
    constructor(toolRegistry) {
        if (!toolRegistry) {
            throw new Error("ToolRegistry is required for CapabilityRegistry");
        }
        this.toolRegistry = toolRegistry;
        this.capabilities = new Map();
    }

    /**
     * Registers a new capability descriptor.
     * @param {import('./CapabilityDescriptor')} capability
     */
    register(capability) {
        this.capabilities.set(capability.capabilityId, capability);
    }

    /**
     * Retrieves a capability by ID.
     * @param {string} capabilityId
     * @returns {import('./CapabilityDescriptor')|null}
     */
    getCapability(capabilityId) {
        const capability = this.capabilities.get(capabilityId);
        if (!capability) return null;
        if (!capability.isActive()) {
            throw new Error(`Capability ${capabilityId} is not active (Status: ${capability.lifecycleStatus}).`);
        }
        return capability;
    }

    /**
     * Lists all active capabilities.
     * @returns {Array<import('./CapabilityDescriptor')>}
     */
    listCapabilities() {
        return Array.from(this.capabilities.values()).filter(cap => cap.isActive());
    }
}

module.exports = CapabilityRegistry;
