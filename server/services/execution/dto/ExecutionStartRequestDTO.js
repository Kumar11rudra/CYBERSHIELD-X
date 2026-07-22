class ExecutionStartRequestDTO {
    constructor({ capabilityId, parameters }) {
        if (!capabilityId) {
            throw new Error('capabilityId is required');
        }
        this.capabilityId = capabilityId;
        this.parameters = parameters || {};
        Object.freeze(this);
    }
}
module.exports = ExecutionStartRequestDTO;
