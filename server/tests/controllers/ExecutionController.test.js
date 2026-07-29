const ExecutionController = require('../../controllers/ExecutionController');

describe('ExecutionController Unit Tests', () => {
    let mockScanExecutionService;
    let mockJobManager;
    let mockJobCancellationService;
    let mockCapabilityResolver;
    let controller;
    let req, res, next;

    beforeEach(() => {
        mockScanExecutionService = { startScan: jest.fn() };
        mockJobManager = { getJob: jest.fn(), jobRepository: { findAll: jest.fn(), findByOwnerId: jest.fn() } };
        mockJobCancellationService = { cancelJob: jest.fn() };
        mockCapabilityResolver = { resolve: jest.fn() };

        controller = new ExecutionController({
            scanExecutionService: mockScanExecutionService,
            jobManager: mockJobManager,
            jobCancellationService: mockJobCancellationService,
            capabilityResolver: mockCapabilityResolver
        });

        req = {
            body: { capabilityId: 'cap-1', parameters: {} },
            user: { _id: 'user-1', roles: ['User'] },
            params: { jobId: 'job-1' }
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        next = jest.fn();
    });

    test('start - capability not found should return 404', async () => {
        mockCapabilityResolver.resolve.mockReturnValue(null);
        await controller.start(req, res, next);
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ error: 'Capability not found' });
    });

    test('start - successful execution returns 200', async () => {
        mockCapabilityResolver.resolve.mockReturnValue({ id: 'cap-1' });
        mockScanExecutionService.startScan.mockResolvedValue({ jobId: 'job-1' });
        await controller.start(req, res, next);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ jobId: 'job-1' });
    });

    test('listJobs - user list returns filtered jobs', async () => {
        mockJobManager.jobRepository.findByOwnerId.mockResolvedValue([{ jobId: 'job-1', ownerId: 'user-1' }]);
        await controller.listJobs(req, res, next);
        expect(res.status).toHaveBeenCalledWith(200);
    });

    test('getJob - non-owner returns 404', async () => {
        mockJobManager.getJob.mockResolvedValue({ jobId: 'job-1', ownerId: 'user-2' });
        await controller.getJob(req, res, next);
        expect(res.status).toHaveBeenCalledWith(404);
    });

    test('cancelJob - successful cancellation returns 202', async () => {
        mockJobManager.getJob.mockResolvedValue({ jobId: 'job-1', ownerId: 'user-1' });
        mockJobCancellationService.cancelJob.mockResolvedValue({ success: true });
        await controller.cancelJob(req, res, next);
        expect(res.status).toHaveBeenCalledWith(202);
    });
});
