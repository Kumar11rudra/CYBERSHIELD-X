const WorkflowProgressDTO = require('./dto/WorkflowProgressDTO');
const DomainEvent = require('../chatbot_core/events/DomainEvent');

/**
 * @module WorkflowProgressService
 * @description Stateless service to calculate workflow progress and emit progress events.
 */
class WorkflowProgressService {
    /**
     * @param {Object} deps
     * @param {import('../chatbot_core/events/EventPublisher')} [deps.eventPublisher]
     */
    constructor(deps = {}) {
        this.eventPublisher = deps.eventPublisher;
    }
    /**
     * @param {import('./dto/WorkflowExecutionDTO')} execution 
     * @param {import('./dto/WorkflowDefinitionDTO')} template 
     * @returns {WorkflowProgressDTO}
     */
    calculateProgress(execution, template) {
        const totalStages = template.stages.length;
        let completedStages = 0;
        let currentStageName = null;

        if (execution.status === 'COMPLETED' || execution.status === 'FAILED' || execution.status === 'CANCELLED') {
            return new WorkflowProgressDTO({
                executionId: execution.executionId,
                status: execution.status,
                percentage: execution.status === 'COMPLETED' ? 100 : 0,
                totalStages,
                completedStages: totalStages,
                currentStageName: null
            });
        }

        // Logic relies on tracking which stage is currently running.
        // For simplicity, we calculate based on the number of jobMappings that are in a terminal state.
        // To precisely track stages, we can infer from jobMappings. 
        // A jobMapping will contain { stageId, jobId, status }.
        
        const stageStatus = new Map();
        for (const stage of template.stages) {
            stageStatus.set(stage.stageId, { total: stage.steps.length, completed: 0, active: false });
        }

        for (const mapping of execution.jobMappings) {
            const ss = stageStatus.get(mapping.stageId);
            if (ss) {
                if (['COMPLETED', 'FAILED', 'CANCELLED'].includes(mapping.status)) {
                    ss.completed++;
                } else {
                    ss.active = true;
                }
            }
        }

        for (const stage of template.stages) {
            const ss = stageStatus.get(stage.stageId);
            if (ss.completed === ss.total) {
                completedStages++;
            } else if (ss.active && !currentStageName) {
                currentStageName = stage.name;
            }
        }

        const percentage = totalStages === 0 ? 100 : Math.floor((completedStages / totalStages) * 100);

        const progressDto = new WorkflowProgressDTO({
            executionId: execution.executionId,
            status: execution.status,
            percentage,
            totalStages,
            completedStages,
            currentStageName
        });

        // Fire progress event if publisher is injected
        if (this.eventPublisher && execution.status === 'RUNNING') {
            this.eventPublisher.publish(new DomainEvent({
                type: 'WORKFLOW_PROGRESS',
                payload: {
                    executionId: execution.executionId,
                    ownerId: execution.ownerId,
                    progress: percentage,
                    message: `Completed ${completedStages} of ${totalStages} stages`
                }
            }), 'WorkflowProgressService').catch(() => {});
        }

        return progressDto;
    }
}

module.exports = WorkflowProgressService;
