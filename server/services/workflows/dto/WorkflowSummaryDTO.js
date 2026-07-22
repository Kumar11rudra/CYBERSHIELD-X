/**
 * @module WorkflowSummaryDTO
 * @description Immutable DTO representing a brief summary of a workflow execution for list views.
 */
class WorkflowSummaryDTO {
    /**
     * @param {Object} data
     * @param {string} data.executionId
     * @param {string} data.templateId
     * @param {string} data.status
     * @param {number} data.startTime
     * @param {number} data.endTime
     */
    constructor(data) {
        if (!data || !data.executionId || !data.templateId || !data.status) {
            throw new Error('WorkflowSummaryDTO requires executionId, templateId, and status');
        }

        this.executionId = data.executionId;
        this.templateId = data.templateId;
        this.status = data.status;
        this.startTime = data.startTime || null;
        this.endTime = data.endTime || null;

        Object.freeze(this);
    }
}

module.exports = WorkflowSummaryDTO;
