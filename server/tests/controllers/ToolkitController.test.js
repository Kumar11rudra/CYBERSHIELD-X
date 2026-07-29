const { executeTool } = require('../../controllers/toolkitController');
const executionDispatcher = require('../../services/ExecutionDispatcher');

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
            body: { toolId: 'wazuh', target: 'example.com' },
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
        expect(res.json).toHaveBeenCalledWith({ error: 'Tool ID and Target are required' });
    });

    test('executeTool - unmapped tool returns 400', async () => {
        req.body.toolId = 'unknown-tool';
        await executeTool(req, res);
        expect(res.status).toHaveBeenCalledWith(400);
    });

    test('executeTool - non-streaming tool returns result', async () => {
        executionDispatcher.resolveCapability.mockReturnValue({ name: 'Wazuh', supportsStreaming: false });
        executionDispatcher.dispatch.mockResolvedValue({ normalizedResult: { status: 'OK' } });
        await executeTool(req, res);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            report: { status: 'OK' },
            rawOutput: JSON.stringify({ status: 'OK' }, null, 2)
        });
    });
});
