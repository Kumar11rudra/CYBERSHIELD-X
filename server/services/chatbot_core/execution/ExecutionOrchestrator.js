const ExecutionMetadata = require('./ExecutionMetadata');
const ExecutionRequest = require('./ExecutionRequest');
const ExecutionResponse = require('./ExecutionResponse');

/**
 * @module ExecutionOrchestrator
 * @description Central coordinator for executing a capability. Standardizes the request for the Dispatcher.
 */
class ExecutionOrchestrator {
    /**
     * @param {Object} deps 
     * @param {Object} deps.executionDispatcher
     */
    constructor(deps) {
        this.executionDispatcher = deps.executionDispatcher;
    }

    /**
     * @param {Object} capability - The resolved capability
     * @param {Object} plan - The action plan
     * @param {string} [ownerId=null] - The user initiating the execution
     * @returns {Promise<ExecutionResponse>}
     */
    async execute(capability, plan, ownerId = null) {
        const metadata = new ExecutionMetadata(capability?.capabilityId || 'unknown', 'RuntimePipeline', ownerId);
        
        try {
            if (!capability || !plan) {
                metadata.markComplete();
                return ExecutionResponse.failure('Missing capability or plan for execution.', 'INVALID_EXECUTION_REQUEST', metadata);
            }

            const request = new ExecutionRequest(plan, capability, metadata);
            
            // Dispatch completely abstractly
            const response = await this.executionDispatcher.dispatch(request);
            
            return response;
        } catch (error) {
            metadata.markComplete();
            return ExecutionResponse.failure(error.message, 'ORCHESTRATION_ERROR', metadata);
        }
    }
}

module.exports = ExecutionOrchestrator;
