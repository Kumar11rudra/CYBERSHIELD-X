/**
 * @module WorkflowStageDTO
 * @description Immutable DTO representing a stage within a workflow.
 */
class WorkflowStageDTO {
    /**
     * @param {Object} data
     * @param {string} data.stageId - Unique identifier for this stage within the workflow
     * @param {string} data.name - Human readable name
     * @param {string} [data.executionMode='SEQUENTIAL'] - 'SEQUENTIAL' or 'PARALLEL'
     * @param {string} [data.executionPolicy='CONTINUE_ON_ERROR'] - 'CONTINUE_ON_ERROR', 'STOP_ON_FAILURE', etc.
     * @param {number} [data.timeoutMs=0] - Stage level timeout (0 for unlimited)
     * @param {Array<Object>} data.steps - The capabilities to run in this stage
     * @param {string} data.steps[].capabilityId - E.g. 'nmap.scan'
     * @param {Object} [data.steps[].parameters] - Stage-specific overrides for parameters
     */
    constructor(data) {
        if (!data || !data.stageId || !data.name || !Array.isArray(data.steps)) {
            throw new Error('WorkflowStageDTO requires stageId, name, and steps');
        }

        this.stageId = data.stageId;
        this.name = data.name;
        this.executionMode = data.executionMode || 'SEQUENTIAL';
        this.executionPolicy = data.executionPolicy || 'CONTINUE_ON_ERROR';
        this.timeoutMs = typeof data.timeoutMs === 'number' ? data.timeoutMs : 0;
        
        // Deep clone steps to ensure immutability
        this.steps = data.steps.map(s => ({
            capabilityId: s.capabilityId,
            parameters: s.parameters ? { ...s.parameters } : {}
        }));

        Object.freeze(this.steps);
        for (let s of this.steps) {
            Object.freeze(s);
            Object.freeze(s.parameters);
        }
        Object.freeze(this);
    }
}

module.exports = WorkflowStageDTO;
