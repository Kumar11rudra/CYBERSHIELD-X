/**
 * @module CapabilityDescriptor
 * @description Standardized data object representing a business capability.
 */
class CapabilityDescriptor {
    /**
     * @param {Object} params
     * @param {string} params.capabilityId - Unique identifier for the capability.
     * @param {string} params.name - Human readable name.
     * @param {string} params.description - Description of capability.
     * @param {string} params.lifecycleStatus - 'Draft', 'Experimental', 'Active', 'Deprecated', 'Disabled'
     * @param {string} params.compatibilityVersion - Version required by adapters.
     * @param {Array<string>} params.requiredParameters - List of parameter keys needed.
     * @param {Object} params.metadata - Extra context.
     */
    constructor({ capabilityId, name, description, lifecycleStatus, compatibilityVersion, requiredParameters = [], metadata = {} }) {
        this.capabilityId = capabilityId;
        this.name = name;
        this.description = description;
        this.lifecycleStatus = lifecycleStatus;
        this.compatibilityVersion = compatibilityVersion;
        this.requiredParameters = requiredParameters;
        this.metadata = metadata;
    }

    /**
     * Checks if capability is active.
     * @returns {boolean}
     */
    isActive() {
        return ['Active', 'Experimental'].includes(this.lifecycleStatus);
    }
}

module.exports = CapabilityDescriptor;
