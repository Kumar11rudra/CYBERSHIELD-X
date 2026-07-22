/**
 * @module ExecutionContract
 * @description Defines the execution request standard. No execution results or raw output.
 */
class ExecutionContract {
    /**
     * @param {Object} params
     * @param {string} params.capabilityId
     * @param {string} params.adapterId
     * @param {Object} params.plannedExecution - Abstract representation of the action.
     * @param {string} params.executionStatus - 'PENDING', 'AUTHORIZED', 'REJECTED'
     * @param {Object} params.metadata
     */
    constructor({ capabilityId, adapterId, plannedExecution, executionStatus = 'PENDING', metadata = {} }) {
        this.capabilityId = capabilityId;
        this.adapterId = adapterId;
        this.plannedExecution = plannedExecution;
        this.executionStatus = executionStatus;
        this.metadata = metadata;
    }

    /**
     * Validates the contract structure.
     * @returns {boolean}
     */
    isValid() {
        return !!this.capabilityId && !!this.plannedExecution;
    }
}

module.exports = ExecutionContract;
