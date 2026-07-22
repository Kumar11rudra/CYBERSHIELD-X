/**
 * @module WorkflowDefinitionDTO
 * @description Immutable DTO representing a static template of a scan workflow.
 */
class WorkflowDefinitionDTO {
    /**
     * @param {Object} data
     * @param {string} data.templateId - ID of the template
     * @param {string} data.name - Name of the workflow
     * @param {string} [data.version='1.0.0'] - Template version
     * @param {string} data.description - Description of the workflow
     * @param {Array<import('./WorkflowStageDTO')>} data.stages - Ordered list of stages
     */
    constructor(data) {
        if (!data || !data.templateId || !data.name || !Array.isArray(data.stages)) {
            throw new Error('WorkflowDefinitionDTO requires templateId, name, and stages');
        }

        this.templateId = data.templateId;
        this.name = data.name;
        this.version = data.version || '1.0.0';
        this.description = data.description || '';
        
        this.stages = data.stages.map(stage => {
            // Ensure they are instances of WorkflowStageDTO
            const WorkflowStageDTO = require('./WorkflowStageDTO');
            return stage instanceof WorkflowStageDTO ? stage : new WorkflowStageDTO(stage);
        });

        Object.freeze(this.stages);
        Object.freeze(this);
    }
}

module.exports = WorkflowDefinitionDTO;
