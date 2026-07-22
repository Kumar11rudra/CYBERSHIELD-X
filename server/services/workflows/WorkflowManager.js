const crypto = require('crypto');
const WorkflowExecutionDTO = require('./dto/WorkflowExecutionDTO');

const DomainEvent = require('../chatbot_core/events/DomainEvent');

/**
 * @module WorkflowManager
 * @description Facade for creating and starting workflows, and exposing progress/results.
 */
class WorkflowManager {
    /**
     * @param {Object} deps 
     * @param {import('./WorkflowRepository')} deps.workflowRepository 
     * @param {import('./WorkflowTemplateRepository')} deps.workflowTemplateRepository 
     * @param {import('./WorkflowValidationService')} deps.workflowValidationService 
     * @param {import('./WorkflowExecutionService')} deps.workflowExecutionService 
     * @param {import('./WorkflowProgressService')} deps.workflowProgressService 
     * @param {import('../chatbot_core/events/EventPublisher')} [deps.eventPublisher]
     */
    constructor({ workflowRepository, workflowTemplateRepository, workflowValidationService, workflowExecutionService, workflowProgressService, eventPublisher }) {
        this.workflowRepository = workflowRepository;
        this.workflowTemplateRepository = workflowTemplateRepository;
        this.workflowValidationService = workflowValidationService;
        this.workflowExecutionService = workflowExecutionService;
        this.workflowProgressService = workflowProgressService;
        this.eventPublisher = eventPublisher;
    }

    /**
     * @param {string} templateId 
     * @param {string} ownerId 
     * @param {Object} [globalParameters={}] 
     * @returns {Promise<{success: boolean, execution?: WorkflowExecutionDTO, error?: string}>}
     */
    async startWorkflow(templateId, ownerId, globalParameters = {}) {
        const template = await this.workflowTemplateRepository.findById(templateId);
        if (!template) {
            return { success: false, error: `Workflow template '${templateId}' not found.` };
        }

        const validation = this.workflowValidationService.validateTemplateCapabilities(template);
        if (!validation.isValid) {
            return { success: false, error: validation.errors.join(' | ') };
        }

        const executionId = crypto.randomUUID();
        const execution = new WorkflowExecutionDTO({
            executionId,
            templateId,
            ownerId,
            status: 'PENDING',
            globalParameters
        });

        const savedExecution = await this.workflowRepository.save(execution);

        if (this.eventPublisher) {
            await this.eventPublisher.publish(new DomainEvent({
                type: 'WORKFLOW_STARTED',
                payload: { executionId: savedExecution.executionId, templateId: savedExecution.templateId, ownerId: savedExecution.ownerId }
            }), 'WorkflowManager').catch(() => {});
        }

        // Fire and forget background execution. In a production app, we would enqueue this.
        this.workflowExecutionService.executeWorkflow(savedExecution, template)
            .then(async finalExecution => {
                if (this.eventPublisher && finalExecution) {
                    await this.eventPublisher.publish(new DomainEvent({
                        type: finalExecution.status === 'COMPLETED' ? 'WORKFLOW_COMPLETED' : 'WORKFLOW_FAILED',
                        payload: { 
                            executionId: finalExecution.executionId, 
                            templateId: finalExecution.templateId, 
                            ownerId: finalExecution.ownerId,
                            error: finalExecution.error,
                            result: finalExecution.result
                        }
                    }), 'WorkflowManager').catch(() => {});
                }
            })
            .catch(err => {
                console.error(`Workflow execution failed entirely for ${executionId}:`, err);
            });

        return { success: true, execution: savedExecution };
    }

    /**
     * @param {string} executionId 
     * @returns {Promise<import('./dto/WorkflowExecutionDTO')|null>}
     */
    async getExecution(executionId) {
        return await this.workflowRepository.findById(executionId);
    }

    /**
     * @param {string} ownerId 
     * @returns {Promise<Array<import('./dto/WorkflowExecutionDTO')>>}
     */
    async listExecutions(ownerId = null) {
        if (ownerId) {
            return await this.workflowRepository.findByOwnerId(ownerId);
        }
        return await this.workflowRepository.findAll();
    }

    /**
     * @param {string} executionId 
     * @returns {Promise<import('./dto/WorkflowProgressDTO')|null>}
     */
    async getProgress(executionId) {
        const execution = await this.getExecution(executionId);
        if (!execution) return null;

        const template = await this.workflowTemplateRepository.findById(execution.templateId);
        if (!template) return null;

        return this.workflowProgressService.calculateProgress(execution, template);
    }

    /**
     * @param {string} executionId 
     * @returns {Promise<{success: boolean, message: string}>}
     */
    async deleteExecution(executionId) {
        const execution = await this.getExecution(executionId);
        if (!execution) {
            return { success: false, message: 'Not found' };
        }

        this.workflowRepository.executions.delete(executionId);
        return { success: true, message: 'Deleted' };
    }
}

module.exports = WorkflowManager;
