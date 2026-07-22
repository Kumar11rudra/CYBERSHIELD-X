/**
 * @module AdapterRegistry
 * @description Maintains available AdapterDescriptors. Does NOT hold adapter instances.
 */
class AdapterRegistry {
    constructor() {
        this.descriptors = new Map();
    }

    /**
     * Registers an AdapterDescriptor.
     * @param {import('./AdapterDescriptor')} descriptor
     */
    register(descriptor) {
        this.descriptors.set(descriptor.adapterId, descriptor);
    }

    /**
     * Gets a descriptor by ID.
     * @param {string} adapterId
     * @returns {import('./AdapterDescriptor')}
     */
    getDescriptor(adapterId) {
        return this.descriptors.get(adapterId);
    }

    /**
     * Returns all registered descriptors.
     * @returns {Array<import('./AdapterDescriptor')>}
     */
    getAllDescriptors() {
        return Array.from(this.descriptors.values());
    }
}

module.exports = AdapterRegistry;
