/**
 * @module WorkflowProgressDTO
 * @description Immutable DTO representing progress of a workflow.
 */
class WorkflowProgressDTO {
    /**
     * @param {Object} data
     * @param {string} data.executionId - ID of the workflow execution
     * @param {string} data.status - Workflow execution status
     * @param {number} data.percentage - 0 to 100
     * @param {string} [data.currentStageName=null] - Name of the currently executing stage
     * @param {number} data.totalStages - Total number of stages
     * @param {number} data.completedStages - Number of completed stages
     */
    constructor(data) {
        if (!data || !data.executionId || !data.status || typeof data.percentage !== 'number') {
            throw new Error('WorkflowProgressDTO requires executionId, status, and percentage');
        }

        this.executionId = data.executionId;
        this.status = data.status;
        this.percentage = Math.max(0, Math.min(100, data.percentage));
        this.currentStageName = data.currentStageName || null;
        this.totalStages = data.totalStages || 0;
        this.completedStages = data.completedStages || 0;

        Object.freeze(this);
    }
}

module.exports = WorkflowProgressDTO;
