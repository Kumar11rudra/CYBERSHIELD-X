const ExecutionResponse = require('./ExecutionResponse');
const ExecutionStage = require('./ExecutionStage');
const DomainEvent = require('./../events/DomainEvent');

/**
 * @module ExecutionDispatcher
 * @description Receives an ExecutionRequest and dispatches it to the abstract AdapterResolver/AdapterFactory.
 */
class ExecutionDispatcher {
    /**
     * @param {Object} deps 
     * @param {Object} deps.adapterResolver
     * @param {Object} deps.adapterFactory
     * @param {import('../../../jobs/JobManager')} [deps.jobManager]
     * @param {import('../../../jobs/JobScheduler')} [deps.jobScheduler]
     * @param {import('../events/EventPublisher')} [deps.eventPublisher]
     */
    constructor(deps) {
        this.adapterResolver = deps.adapterResolver;
        this.adapterFactory = deps.adapterFactory;
        this.jobManager = deps.jobManager;
        this.jobScheduler = deps.jobScheduler;
        this.eventPublisher = deps.eventPublisher;
    }

    /**
     * @param {ExecutionRequest} request 
     * @returns {Promise<ExecutionResponse>}
     */
    async dispatch(request) {
        if (!this.jobManager || !this.jobScheduler) {
            // Fallback for tests that haven't updated DI
            return this.executeJob(request);
        }

        const JobRequestDTO = require('../../jobs/dto/JobRequestDTO');
        const jobRequest = new JobRequestDTO({
            executionId: request.metadata.executionId,
            capability: request.capability,
            plan: request.plan,
            ownerId: request.metadata.ownerId
        });

        const jobResult = await this.jobManager.createJob(jobRequest);
        if (!jobResult.success) {
            request.metadata.markComplete();
            return ExecutionResponse.failure(`Failed to create job: ${jobResult.error}`, 'JOB_CREATION_FAILED', request.metadata);
        }

        const jobId = jobResult.data.jobId;
        
        try {
            // Enqueue and await terminal state
            const response = await this.jobScheduler.enqueue(jobId, () => this.executeJob(request));
            return response;
        } catch (error) {
            request.metadata.markComplete();
            return ExecutionResponse.failure(error.message, 'JOB_SCHEDULING_FAILED', request.metadata);
        }
    }

    /**
     * @param {ExecutionRequest} request 
     * @returns {Promise<ExecutionResponse>}
     */
    async executeJob(request) {
        try {
            // Abstract Adapter Resolution
            const descriptor = this.adapterResolver.resolveAdapter(request.capability);
            if (!descriptor) {
                request.metadata.markComplete();
                
                if (this.eventPublisher) {
                    this.eventPublisher.publish(new DomainEvent({
                        type: 'SYSTEM_ERROR',
                        payload: {
                            ownerId: request.metadata.ownerId,
                            message: `Adapter not found for capability ${request.capability.capabilityId}`
                        }
                    }), 'ExecutionDispatcher').catch(() => {});
                }

                return ExecutionResponse.failure(`Adapter not found for capability ${request.capability.capabilityId}`, 'ADAPTER_NOT_FOUND', request.metadata);
            }
            
            // Abstract Adapter Execution
            const adapter = this.adapterFactory.createAdapter(descriptor);
            
            // Re-resolve the contract (if needed) to get the planned execution, or simply construct the payload
            // request.plan is the executed plan from actionPlanner.
            // Our real adapters expect an AdapterRequestDTO, so we construct it here.
            const AdapterRequestDTO = require('../../../adapters/dto/AdapterRequestDTO');
            const adapterRequest = new AdapterRequestDTO({
                capabilityId: request.capability.capabilityId,
                provider: descriptor.adapterId,
                timeout: request.plan.timeout || 30000,
                parameters: request.plan.parameters || {},
                executionId: request.metadata.executionId
            });

            const executionResponseDTO = await adapter.execute(adapterRequest);
            
            if (!executionResponseDTO.success) {
                request.metadata.markComplete();
                return ExecutionResponse.failure(executionResponseDTO.stderr || 'Adapter execution failed', 'EXECUTION_FAILED', request.metadata);
            }

            request.metadata.markComplete();
            return ExecutionResponse.success({ data: executionResponseDTO, stage: ExecutionStage.COMPLETED }, request.metadata);
        } catch (error) {
            request.metadata.markComplete();
            return ExecutionResponse.failure(error.message, 'DISPATCH_ERROR', request.metadata);
        }
    }
}

module.exports = ExecutionDispatcher;
