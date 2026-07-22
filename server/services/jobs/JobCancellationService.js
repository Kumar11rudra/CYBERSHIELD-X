const JobResultDTO = require('./dto/JobResultDTO');
const ExecutionResponse = require('../chatbot_core/execution/ExecutionResponse');

class JobCancellationService {
    /**
     * @param {Object} deps 
     * @param {import('./JobManager')} deps.jobManager
     * @param {import('./JobScheduler')} deps.jobScheduler
     */
    constructor(deps) {
        this.jobManager = deps.jobManager;
        this.jobScheduler = deps.jobScheduler;
    }

    /**
     * @param {string} jobId 
     * @returns {Promise<JobResultDTO>}
     */
    async cancelJob(jobId) {
        const job = await this.jobManager.getJob(jobId);
        if (!job) {
            return JobResultDTO.failure('Job not found');
        }

        if (['COMPLETED', 'FAILED', 'TIMED_OUT'].includes(job.status)) {
            return JobResultDTO.failure('Job already finished');
        }

        if (job.status === 'CANCELLED') {
            return JobResultDTO.success({ message: 'Job already cancelled' });
        }

        const transition = await this.jobManager.transitionState(jobId, 'CANCELLED');
        if (!transition.success) {
            return JobResultDTO.failure(transition.error);
        }

        // Notify scheduler so any awaiting dispatch gets resolved
        const event = this.jobScheduler.jobCompletionEvents.get(jobId);
        if (event) {
            event.resolve(ExecutionResponse.failure('Job was cancelled', 'JOB_CANCELLED'));
            this.jobScheduler.jobCompletionEvents.delete(jobId);
        }

        return JobResultDTO.success({ message: 'Job cancelled successfully' });
    }
}
module.exports = JobCancellationService;
