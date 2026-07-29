const WorkflowController = require('../../controllers/WorkflowController');

describe('WorkflowController Unit Tests', () => {
    let mockWorkflowManager;
    let controller;
    let req, res, next;

    beforeEach(() => {
        mockWorkflowManager = {
            startWorkflow: jest.fn(),
            listExecutions: jest.fn(),
            getExecution: jest.fn(),
            getProgress: jest.fn(),
            deleteExecution: jest.fn()
        };

        controller = new WorkflowController({ workflowManager: mockWorkflowManager });

        req = {
            body: { templateId: 'wf-1', parameters: {} },
            user: { _id: 'user-1', roles: ['User'] },
            params: { id: 'exec-1' }
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        next = jest.fn();
    });

    test('start - missing templateId returns 400', async () => {
        req.body.templateId = null;
        await controller.start(req, res, next);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'templateId is required' });
    });

    test('start - success returns 202', async () => {
        mockWorkflowManager.startWorkflow.mockResolvedValue({
            success: true,
            execution: { executionId: 'exec-1', status: 'RUNNING' }
        });
        await controller.start(req, res, next);
        expect(res.status).toHaveBeenCalledWith(202);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            executionId: 'exec-1',
            status: 'RUNNING'
        });
    });

    test('list - returns user workflow executions', async () => {
        mockWorkflowManager.listExecutions.mockResolvedValue([{ executionId: 'exec-1', templateId: 'tmpl-1', status: 'COMPLETED', ownerId: 'user-1' }]);
        await controller.list(req, res, next);
        expect(res.status).toHaveBeenCalledWith(200);
    });

    test('get - returns 404 for unauthorized user', async () => {
        mockWorkflowManager.getExecution.mockResolvedValue({ executionId: 'exec-1', ownerId: 'user-2' });
        await controller.get(req, res, next);
        expect(res.status).toHaveBeenCalledWith(404);
    });
});
