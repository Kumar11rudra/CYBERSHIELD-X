const { executeTool } = require('../../controllers/toolkitController');

jest.mock('../../services/ExecutionDispatcher');
jest.mock('../../services/SocketNotificationService', () => {
    return jest.fn().mockImplementation(() => ({
        emitToolLog: jest.fn(),
        emitToolComplete: jest.fn()
    }));
});

describe('ToolkitController Unit Tests', () => {
    let req, res;

    beforeEach(() => {
        req = {
            body: { toolId: 'wazuh-agent-audit', target: 'test-agent-log-data' },
            user: { _id: 'user-1' },
            app: { get: jest.fn().mockReturnValue({}) }
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        jest.clearAllMocks();
    });

    test('executeTool - missing toolId returns 400', async () => {
        req.body.toolId = null;
        await executeTool(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'Tool ID is required' });
    });

    test('executeTool - unmapped tool returns 400 COMING_SOON', async () => {
        req.body.toolId = 'unknown-tool';
        req.body.target = 'example.com';
        await executeTool(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 'COMING_SOON' }));
    });

    test('executeTool - active raw-dispatch tool returns result', async () => {
        req.body.toolId = 'wazuh-agent-audit';
        req.body.target = 'agent-id: 001\nstatus: active\nos: Ubuntu 22.04';
        await executeTool(req, res);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ success: true })
        );
    });

    test('executeTool - missing target returns 400', async () => {
        req.body.toolId = 'dns';
        req.body.target = '';
        await executeTool(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ error: 'Target is required' });
    });
});
