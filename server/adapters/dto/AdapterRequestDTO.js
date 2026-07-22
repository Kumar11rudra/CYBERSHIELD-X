/**
 * @module AdapterRequestDTO
 * @description Immutable DTO representing a request sent to a capability execution adapter.
 */
class AdapterRequestDTO {
    constructor({ capabilityId, provider, timeout = 30000, parameters = {}, executionId }) {
        if (!capabilityId) throw new Error("capabilityId is required");
        if (!executionId) throw new Error("executionId is required");
        if (!provider) throw new Error("provider is required");

        this.capabilityId = capabilityId;
        this.provider = provider;
        this.timeout = timeout;
        this.parameters = Object.freeze({ ...parameters });
        this.executionId = executionId;
        
        Object.freeze(this);
    }
}
module.exports = AdapterRequestDTO;
