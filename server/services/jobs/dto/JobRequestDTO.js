class JobRequestDTO {
    constructor({ executionId, capability, plan, ownerId }) {
        this.executionId = executionId;
        this.capability = capability;
        this.plan = plan;
        this.ownerId = ownerId;
        Object.freeze(this);
    }
}
module.exports = JobRequestDTO;
