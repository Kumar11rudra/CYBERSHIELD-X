/**
 * @module CapabilityAdapter
 * @description Abstract base class for all capability adapters.
 * Must not implement actual tool execution.
 */
class CapabilityAdapter {
    /**
     * @param {import('./AdapterDescriptor')} descriptor
     */
    constructor(descriptor) {
        if (new.target === CapabilityAdapter) {
            throw new TypeError("Cannot construct CapabilityAdapter instances directly");
        }
        this.descriptor = descriptor;
    }

    /**
     * Initializes the adapter.
     * @abstract
     * @returns {Promise<boolean>}
     */
    async initialize() {
        throw new Error("Method 'initialize()' must be implemented.");
    }

    /**
     * Translates a capability request into an ExecutionContract.
     * @abstract
     * @param {Object} request
     * @returns {Promise<import('./ExecutionContract')>}
     */
    async resolveContract(request) {
        throw new Error("Method 'resolveContract()' must be implemented.");
    }

    /**
     * Executes the capability based on the planned parameters.
     * @abstract
     * @param {import('./dto/AdapterRequestDTO')} request
     * @returns {Promise<import('./dto/AdapterResponseDTO')>}
     */
    async execute(request) {
        throw new Error("Method 'execute()' must be implemented.");
    }
}

module.exports = CapabilityAdapter;
