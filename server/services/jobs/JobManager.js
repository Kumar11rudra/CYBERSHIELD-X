const crypto = require('crypto');
const JobDTO = require('./dto/JobDTO');
const JobStatusDTO = require('./dto/JobStatusDTO');
const JobResultDTO = require('./dto/JobResultDTO');
const DomainEvent = require('../chatbot_core/events/DomainEvent');

class JobManager {
    /**
     * @param {Object} deps 
     * @param {import('./JobRepository')} deps.jobRepository
     * @param {import('../chatbot_core/events/EventPublisher')} [deps.eventPublisher]
     */
    constructor(deps) {
        this.jobRepository = deps.jobRepository;
        this.eventPublisher = deps.eventPublisher;
        this.activeJobs = new Set(); // To prevent duplicate duplicate concurrent creation by executionId
    }

    /**
     * @param {import('./dto/JobRequestDTO')} request 
     * @returns {Promise<JobResultDTO>}
     */
    async createJob(request) {
        if (!request || !request.executionId || !request.capability) {
            return JobResultDTO.failure('Invalid JobRequestDTO');
        }

        if (this.activeJobs.has(request.executionId)) {
            return JobResultDTO.failure('Job for this executionId already exists');
        }

        const jobId = crypto.randomUUID();
        const job = new JobDTO({
            jobId,
            executionId: request.executionId,
            capabilityId: request.capability.capabilityId,
            ownerId: request.ownerId,
            status: JobStatusDTO.PENDING
        });

        try {
            const savedJob = await this.jobRepository.save(job);
            this.activeJobs.add(request.executionId);
            
            if (this.eventPublisher) {
                await this.eventPublisher.publish(new DomainEvent({
                    type: 'JOB_STARTED',
                    payload: { jobId: savedJob.jobId, capabilityId: savedJob.capabilityId, ownerId: savedJob.ownerId }
                }), 'JobManager');
            }

            return JobResultDTO.success(savedJob);
        } catch (error) {
            return JobResultDTO.failure(`Failed to save job: ${error.message}`);
        }
    }

    /**
     * @param {string} jobId 
     * @param {string} nextStatus 
     * @param {Object} [result] 
     * @param {string} [error] 
     * @returns {Promise<JobResultDTO>}
     */
    async transitionState(jobId, nextStatus, result = null, error = null) {
        const job = await this.jobRepository.findById(jobId);
        if (!job) {
            return JobResultDTO.failure(`Job not found: ${jobId}`);
        }

        if (!JobStatusDTO.isValidTransition(job.status, nextStatus)) {
            return JobResultDTO.failure(`Invalid status transition from ${job.status} to ${nextStatus}`);
        }

        const updatedJob = job.withStatus(nextStatus, error, result);
        
        try {
            const savedJob = await this.jobRepository.update(updatedJob);
            
            if (JobStatusDTO.isTerminal(nextStatus)) {
                this.activeJobs.delete(savedJob.executionId);
            }
            
            if (this.eventPublisher) {
                let eventType = 'JOB_PROGRESS';
                if (nextStatus === JobStatusDTO.COMPLETED) eventType = 'JOB_COMPLETED';
                else if (nextStatus === JobStatusDTO.FAILED || nextStatus === JobStatusDTO.CANCELLED) eventType = 'JOB_FAILED';

                await this.eventPublisher.publish(new DomainEvent({
                    type: eventType,
                    payload: { 
                        jobId: savedJob.jobId, 
                        capabilityId: savedJob.capabilityId,
                        ownerId: savedJob.ownerId,
                        status: savedJob.status,
                        result: savedJob.result,
                        error: savedJob.error
                    }
                }), 'JobManager');
            }

            return JobResultDTO.success(savedJob);
        } catch (err) {
            return JobResultDTO.failure(`Failed to transition job state: ${err.message}`);
        }
    }

    /**
     * @param {string} jobId 
     * @returns {Promise<JobDTO|null>}
     */
    async getJob(jobId) {
        return await this.jobRepository.findById(jobId);
    }
}
module.exports = JobManager;
