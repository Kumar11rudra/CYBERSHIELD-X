const ExecutionStartRequestDTO = require('../services/execution/dto/ExecutionStartRequestDTO');
const ExecutionStartResponseDTO = require('../services/execution/dto/ExecutionStartResponseDTO');
const ExecutionJobDTO = require('../services/execution/dto/ExecutionJobDTO');
const ExecutionResultDTO = require('../services/execution/dto/ExecutionResultDTO');

class ExecutionController {
    /**
     * @param {Object} deps
     * @param {import('../services/scanners/ScanExecutionService')} deps.scanExecutionService
     * @param {import('../services/jobs/JobManager')} deps.jobManager
     * @param {import('../services/jobs/JobCancellationService')} deps.jobCancellationService
     * @param {import('../services/chatbot_core/capabilities/CapabilityResolver')} deps.capabilityResolver
     */
    constructor({ scanExecutionService, jobManager, jobCancellationService, capabilityResolver }) {
        this.scanExecutionService = scanExecutionService;
        this.jobManager = jobManager;
        this.jobCancellationService = jobCancellationService;
        this.capabilityResolver = capabilityResolver;
    }

    /**
     * POST /api/execution/start
     */
    async start(req, res, next) {
        try {
            const startReq = new ExecutionStartRequestDTO(req.body);

            const capability = this.capabilityResolver.resolve(startReq.capabilityId);
            if (!capability) {
                return res.status(404).json({ error: 'Capability not found' });
            }

            // Dispatch through ScanExecutionService which encapsulates scanner-specific logic,
            // provider normalization, and orchestrator execution.
            const response = await this.scanExecutionService.startScan(capability, startReq.parameters, req.user._id);

            return res.status(200).json(response);
            
        } catch (error) {
            next(error);
        }
    };

    listJobs = async (req, res, next) => {
        try {
            const isAdmin = req.user.roles && req.user.roles.includes('Admin');
            const jobs = isAdmin 
                ? await this.jobManager.jobRepository.findAll()
                : await this.jobManager.jobRepository.findByOwnerId(req.user._id.toString());
            
            const dtos = jobs.map(j => new ExecutionJobDTO(j));
            return res.status(200).json({ jobs: dtos });
        } catch (error) {
            next(error);
        }
    };

    getJob = async (req, res, next) => {
        try {
            const job = await this.jobManager.getJob(req.params.jobId);
            if (!job) {
                return res.status(404).json({ error: 'Job not found' });
            }

            const isAdmin = req.user.roles && req.user.roles.includes('Admin');
            if (!isAdmin && job.ownerId !== req.user._id.toString()) {
                return res.status(404).json({ error: 'Job not found' }); // Hide existence
            }

            return res.status(200).json(new ExecutionJobDTO(job));
        } catch (error) {
            next(error);
        }
    };

    cancelJob = async (req, res, next) => {
        try {
            const job = await this.jobManager.getJob(req.params.jobId);
            if (!job) {
                return res.status(404).json({ error: 'Job not found' });
            }

            const isAdmin = req.user.roles && req.user.roles.includes('Admin');
            if (!isAdmin && job.ownerId !== req.user._id.toString()) {
                return res.status(404).json({ error: 'Job not found' });
            }

            const result = await this.jobCancellationService.cancelJob(req.params.jobId);
            if (!result.success) {
                return res.status(409).json({ error: result.error }); // Already completed/invalid transition
            }

            return res.status(202).json({ success: true, message: 'Job cancelled' });
        } catch (error) {
            next(error);
        }
    };

    getJobResult = async (req, res, next) => {
        try {
            const job = await this.jobManager.getJob(req.params.jobId);
            if (!job) {
                return res.status(404).json({ error: 'Job not found' });
            }

            const isAdmin = req.user.roles && req.user.roles.includes('Admin');
            if (!isAdmin && job.ownerId !== req.user._id.toString()) {
                return res.status(404).json({ error: 'Job not found' });
            }

            const JobStatusDTO = require('../services/jobs/dto/JobStatusDTO');
            if (!JobStatusDTO.isTerminal(job.status)) {
                return res.status(202).json({ status: job.status, message: 'Execution still running' });
            }

            return res.status(200).json(new ExecutionResultDTO({
                jobId: job.jobId,
                success: job.status === JobStatusDTO.COMPLETED,
                data: job.result,
                error: job.error
            }));
        } catch (error) {
            next(error);
        }
    };
}

module.exports = ExecutionController;
