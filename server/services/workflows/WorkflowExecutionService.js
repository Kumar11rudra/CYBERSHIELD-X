/**
 * @module WorkflowExecutionService
 * @description The DAG Engine. Executes workflow stages, respects parallel/sequential modes and execution policies using Promise.allSettled.
 */
const DomainEvent = require('../chatbot_core/events/DomainEvent');
class WorkflowExecutionService {
    /**
     * @param {Object} deps 
     * @param {import('./WorkflowRepository')} deps.workflowRepository 
     * @param {import('../scanners/ScanExecutionService')} deps.scanExecutionService 
     * @param {import('../chatbot_core/capabilities/CapabilityResolver')} deps.capabilityResolver 
     * @param {import('./WorkflowResultAggregator')} deps.workflowResultAggregator 
     * @param {import('../chatbot_core/events/EventPublisher')} [deps.eventPublisher]
     */
    constructor({ workflowRepository, scanExecutionService, capabilityResolver, workflowResultAggregator, eventPublisher }) {
        this.workflowRepository = workflowRepository;
        this.scanExecutionService = scanExecutionService;
        this.capabilityResolver = capabilityResolver;
        this.workflowResultAggregator = workflowResultAggregator;
        this.eventPublisher = eventPublisher;
    }

    /**
     * Executes the workflow. Intended to be run in the background (or awaited).
     * @param {import('./dto/WorkflowExecutionDTO')} execution 
     * @param {import('./dto/WorkflowDefinitionDTO')} template 
     */
    async executeWorkflow(execution, template) {
        let currentExecution = await this.workflowRepository.update(
            execution.withUpdate({ status: 'RUNNING', startTime: Date.now() })
        );

        let workflowFailed = false;
        let globalError = null;
        let jobMappings = [...currentExecution.jobMappings];

        for (const stage of template.stages) {
            if (workflowFailed && stage.executionPolicy !== 'CONTINUE_ON_ERROR') {
                break; // Stop on failure triggered by a previous stage
            }

            try {
                const stageJobs = await this._executeStage(stage, currentExecution);
                jobMappings.push(...stageJobs);
                
                // Check for stage failure
                const stageFailed = stageJobs.some(j => j.status === 'FAILED');
                if (stageFailed) {
                    if (stage.executionPolicy === 'STOP_ON_FAILURE') {
                        workflowFailed = true;
                        globalError = `Stage '${stage.name}' failed with STOP_ON_FAILURE policy.`;
                        break;
                    }
                }
            } catch (error) {
                workflowFailed = true;
                globalError = `Unexpected error in stage '${stage.name}': ${error.message}`;
                break; // A hard exception breaks the workflow regardless of policy
            }

            // Update execution state incrementally
            currentExecution = await this.workflowRepository.update(
                currentExecution.withUpdate({ jobMappings })
            );
        }

        // Finalize Workflow
        const finalStatus = workflowFailed ? 'FAILED' : 'COMPLETED';
        const resultDto = await this.workflowResultAggregator.aggregate(currentExecution);
        
        const finalizedExecution = currentExecution.withUpdate({
            status: finalStatus,
            endTime: Date.now(),
            error: globalError,
            result: resultDto
        });

        await this.workflowRepository.update(finalizedExecution);
        return finalizedExecution;
    }

    /**
     * @param {import('./dto/WorkflowStageDTO')} stage 
     * @param {import('./dto/WorkflowExecutionDTO')} execution 
     * @returns {Promise<Array<Object>>} - Array of job mappings
     */
    async _executeStage(stage, execution) {
        const mappings = [];
        
        const executeStep = async (step) => {
            let capability = this.capabilityResolver.resolve(step.capabilityId);
            if (!capability) {
                // Fallback for scanner capabilities that are internally managed by ScanExecutionService
                capability = { capabilityId: step.capabilityId };
            }
            // Merge parameters: Global -> Stage Override
            const parameters = { ...execution.globalParameters, ...step.parameters };
            
            // This returns an ExecutionResponse containing executionId. 
            // ScanExecutionService delegates to ExecutionOrchestrator which generates the job.
            const response = await this.scanExecutionService.startScan(capability, parameters, execution.ownerId);
            
            return {
                stageId: stage.stageId,
                jobId: response.metadata ? response.metadata.executionId : null, // The job ID happens to be executionId here or mapped by it
                status: response.success ? 'COMPLETED' : 'FAILED',
                error: response.error || null
            };
        };

        if (stage.executionMode === 'PARALLEL') {
            const results = await Promise.allSettled(stage.steps.map(step => executeStep(step)));
            for (const result of results) {
                if (result.status === 'fulfilled') {
                    mappings.push(result.value);
                } else {
                    mappings.push({ stageId: stage.stageId, jobId: null, status: 'FAILED', error: result.reason.message });
                }
            }
        } else {
            // SEQUENTIAL
            for (const step of stage.steps) {
                try {
                    const result = await executeStep(step);
                    mappings.push(result);
                    if (result.status === 'FAILED' && stage.executionPolicy === 'STOP_ON_FAILURE') {
                        break; // Stop subsequent steps in this sequential stage
                    }
                } catch (error) {
                    mappings.push({ stageId: stage.stageId, jobId: null, status: 'FAILED', error: error.message });
                    if (stage.executionPolicy === 'STOP_ON_FAILURE') {
                        break;
                    }
                }
            }
        }

        return mappings;
    }
}

module.exports = WorkflowExecutionService;
