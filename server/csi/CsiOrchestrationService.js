'use strict';

const { ExecutionResultDTO } = require('./orchestration/ExecutionResultDTO');

/**
 * High-level façade for orchestrating the CSI pipeline.
 * Contains NO business logic, simply delegates to the injected pipeline.
 */
class CsiOrchestrationService {
    /**
     * @param {Object} deps
     * @param {import('./orchestration/CsiExecutionPipeline').CsiExecutionPipeline} deps.executionPipeline
     */
    constructor(deps) {
        if (!deps || !deps.executionPipeline) {
            throw new TypeError('[CsiOrchestrationService] executionPipeline is required');
        }
        this.executionPipeline = deps.executionPipeline;
    }

    /**
     * Executes the full pipeline against a target.
     * @param {string} rawTarget 
     * @returns {Promise<ExecutionResultDTO>}
     */
    async execute(rawTarget) {
        return await this.executionPipeline.execute(rawTarget);
    }
}

module.exports = { CsiOrchestrationService };
