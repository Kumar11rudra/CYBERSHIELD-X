/**
 * @module AdapterDescriptor
 * @description Represents metadata for an adapter without instantiating it.
 */
class AdapterDescriptor {
    /**
     * @param {Object} params
     * @param {string} params.adapterId
     * @param {string} params.adapterType - 'CLI', 'Docker', 'API', 'Cloud'
     * @param {Array<string>} params.supportedCapabilities - List of capability IDs this adapter can resolve.
     * @param {Array<string>} params.supportedToolCategories - List of tool categories.
     * @param {string} params.adapterVersion
     * @param {string} params.lifecycleStatus - 'Draft', 'Active', 'Deprecated', 'Disabled'
     * @param {string} params.compatibilityVersion - Must match CapabilityDescriptor.compatibilityVersion.
     * @param {Object} params.metadata
     */
    constructor({ adapterId, adapterType, supportedCapabilities = [], supportedToolCategories = [], adapterVersion, lifecycleStatus, compatibilityVersion, metadata = {} }) {
        this.adapterId = adapterId;
        this.adapterType = adapterType;
        this.supportedCapabilities = supportedCapabilities;
        this.supportedToolCategories = supportedToolCategories;
        this.adapterVersion = adapterVersion;
        this.lifecycleStatus = lifecycleStatus;
        this.compatibilityVersion = compatibilityVersion;
        this.metadata = metadata;
    }

    /**
     * Validates compatibility with a given capability.
     * @param {import('./CapabilityDescriptor')} capability
     * @returns {boolean}
     */
    isCompatible(capability) {
        return this.compatibilityVersion === capability.compatibilityVersion &&
               this.supportedCapabilities.includes(capability.capabilityId) &&
               ['Active', 'Draft', 'Experimental'].includes(this.lifecycleStatus);
    }
}

module.exports = AdapterDescriptor;
