/**
 * @module WorkflowResultDTO
 * @description Immutable DTO representing the final result of a workflow.
 */
class WorkflowResultDTO {
    /**
     * @param {Object} data
     * @param {string} data.executionId - Associated workflow execution ID
     * @param {boolean} data.success - Overall success status
     * @param {import('../../intelligence/dto/IntelligenceReportDTO')} data.intelligenceReport - Final consolidated intelligence report
     * @param {Array<Object>} data.stageResults - Results per stage
     */
    constructor(data) {
        if (!data || !data.executionId || typeof data.success !== 'boolean') {
            throw new Error('WorkflowResultDTO requires executionId and success flag');
        }

        this.executionId = data.executionId;
        this.success = data.success;
        this.intelligenceReport = data.intelligenceReport || null;
        this.stageResults = Array.isArray(data.stageResults) ? [...data.stageResults] : [];

        Object.freeze(this.stageResults);
        for (let r of this.stageResults) {
            Object.freeze(r);
        }
        Object.freeze(this);
    }
}

module.exports = WorkflowResultDTO;
