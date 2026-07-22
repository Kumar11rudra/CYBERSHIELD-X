const WorkflowSummaryDTO = require('../services/workflows/dto/WorkflowSummaryDTO');

class WorkflowController {
    /**
     * @param {Object} deps 
     * @param {import('../services/workflows/WorkflowManager')} deps.workflowManager 
     */
    constructor({ workflowManager }) {
        this.workflowManager = workflowManager;
    }

    start = async (req, res, next) => {
        try {
            const { templateId, parameters } = req.body;
            if (!templateId) {
                return res.status(400).json({ error: 'templateId is required' });
            }

            const result = await this.workflowManager.startWorkflow(templateId, req.user._id.toString(), parameters || {});
            
            if (!result.success) {
                return res.status(400).json({ error: result.error });
            }

            return res.status(202).json({
                success: true,
                executionId: result.execution.executionId,
                status: result.execution.status
            });
        } catch (error) {
            next(error);
        }
    }

    list = async (req, res, next) => {
        try {
            const isAdmin = req.user.roles && req.user.roles.includes('Admin');
            const executions = await this.workflowManager.listExecutions(isAdmin ? null : req.user._id.toString());
            
            const summaries = executions.map(e => new WorkflowSummaryDTO(e));
            return res.status(200).json({ workflows: summaries });
        } catch (error) {
            next(error);
        }
    }

    get = async (req, res, next) => {
        try {
            const execution = await this.workflowManager.getExecution(req.params.id);
            if (!execution) {
                return res.status(404).json({ error: 'Workflow execution not found' });
            }

            const isAdmin = req.user.roles && req.user.roles.includes('Admin');
            if (!isAdmin && execution.ownerId !== req.user._id.toString()) {
                return res.status(404).json({ error: 'Workflow execution not found' });
            }

            return res.status(200).json(execution);
        } catch (error) {
            next(error);
        }
    }

    progress = async (req, res, next) => {
        try {
            const execution = await this.workflowManager.getExecution(req.params.id);
            if (!execution) {
                return res.status(404).json({ error: 'Workflow execution not found' });
            }

            const isAdmin = req.user.roles && req.user.roles.includes('Admin');
            if (!isAdmin && execution.ownerId !== req.user._id.toString()) {
                return res.status(404).json({ error: 'Workflow execution not found' });
            }

            const progress = await this.workflowManager.getProgress(req.params.id);
            return res.status(200).json(progress);
        } catch (error) {
            next(error);
        }
    }

    result = async (req, res, next) => {
        try {
            const execution = await this.workflowManager.getExecution(req.params.id);
            if (!execution) {
                return res.status(404).json({ error: 'Workflow execution not found' });
            }

            const isAdmin = req.user.roles && req.user.roles.includes('Admin');
            if (!isAdmin && execution.ownerId !== req.user._id.toString()) {
                return res.status(404).json({ error: 'Workflow execution not found' });
            }

            if (!['COMPLETED', 'FAILED', 'CANCELLED'].includes(execution.status)) {
                return res.status(202).json({ status: execution.status, message: 'Workflow is still active' });
            }

            return res.status(200).json(execution.result || {});
        } catch (error) {
            next(error);
        }
    }

    delete = async (req, res, next) => {
        try {
            const execution = await this.workflowManager.getExecution(req.params.id);
            if (!execution) {
                return res.status(404).json({ error: 'Workflow execution not found' });
            }

            const isAdmin = req.user.roles && req.user.roles.includes('Admin');
            if (!isAdmin && execution.ownerId !== req.user._id.toString()) {
                return res.status(404).json({ error: 'Workflow execution not found' });
            }

            const result = await this.workflowManager.deleteExecution(req.params.id);
            return res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    }
}

module.exports = WorkflowController;
