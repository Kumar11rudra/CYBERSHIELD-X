/**
 * @module WorkflowExecutionDTO
 * @description Immutable DTO representing an active or completed workflow execution.
 */
class WorkflowExecutionDTO {
    /**
     * @param {Object} data
     * @param {string} data.executionId - Unique ID for this workflow execution
     * @param {string} data.templateId - Reference to the WorkflowDefinition template
     * @param {string} data.ownerId - User who initiated the workflow
     * @param {string} data.status - PENDING, RUNNING, COMPLETED, FAILED, CANCELLED
     * @param {Object} [data.globalParameters={}] - Global parameters applicable across stages
     * @param {number} [data.startTime] - Epoch timestamp
     * @param {number} [data.endTime] - Epoch timestamp
     * @param {Array<Object>} [data.jobMappings=[]] - Mapping of stages/steps to Job IDs
     * @param {string} [data.error=null] - Global workflow error if applicable
     * @param {import('./WorkflowResultDTO')} [data.result=null] - Final result containing intelligence report
     */
    constructor(data) {
        if (!data || !data.executionId || !data.templateId || !data.ownerId || !data.status) {
            throw new Error('WorkflowExecutionDTO requires executionId, templateId, ownerId, and status');
        }

        this.executionId = data.executionId;
        this.templateId = data.templateId;
        this.ownerId = data.ownerId;
        this.status = data.status;
        this.globalParameters = data.globalParameters ? { ...data.globalParameters } : {};
        this.startTime = data.startTime || null;
        this.endTime = data.endTime || null;
        this.error = data.error || null;
        
        this.jobMappings = Array.isArray(data.jobMappings) ? [...data.jobMappings] : [];
        this.result = data.result || null;

        Object.freeze(this.globalParameters);
        Object.freeze(this.jobMappings);
        for (let mapping of this.jobMappings) {
            Object.freeze(mapping);
        }
        Object.freeze(this);
    }

    /**
     * Create a new instance with updated properties.
     */
    withUpdate(updates) {
        return new WorkflowExecutionDTO({
            ...this,
            ...updates
        });
    }
}

WorkflowExecutionDTO.STATUS_PENDING = 'PENDING';
WorkflowExecutionDTO.STATUS_RUNNING = 'RUNNING';
WorkflowExecutionDTO.STATUS_COMPLETED = 'COMPLETED';
WorkflowExecutionDTO.STATUS_FAILED = 'FAILED';
WorkflowExecutionDTO.STATUS_CANCELLED = 'CANCELLED';

module.exports = WorkflowExecutionDTO;
