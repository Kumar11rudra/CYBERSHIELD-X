const ExecutionResponse = require('../chatbot_core/execution/ExecutionResponse');

class JobScheduler {
    /**
     * @param {Object} deps 
     * @param {import('./JobManager')} deps.jobManager
     */
    constructor(deps) {
        this.jobManager = deps.jobManager;
        this.queue = [];
        this.isProcessing = false;
        this.jobCompletionEvents = new Map(); // jobId -> { resolve, reject }
    }

    /**
     * @param {string} jobId 
     * @param {Function} executeCallback 
     * @returns {Promise<ExecutionResponse>}
     */
    async enqueue(jobId, executeCallback) {
        return new Promise(async (resolve, reject) => {
            const transition = await this.jobManager.transitionState(jobId, 'QUEUED');
            if (!transition.success) {
                // If it's already CANCELLED, return cancelled response
                const job = await this.jobManager.getJob(jobId);
                if (job && job.status === 'CANCELLED') {
                    return resolve(ExecutionResponse.failure('Job was cancelled', 'JOB_CANCELLED'));
                }
                return resolve(ExecutionResponse.failure(transition.error, 'JOB_TRANSITION_ERROR'));
            }
            
            this.jobCompletionEvents.set(jobId, { resolve, reject });
            this.queue.push({ jobId, executeCallback });
            
            // Start processing async
            this.processQueue().catch(err => {
                console.error("JobScheduler processQueue error:", err);
            });
        });
    }

    async processQueue() {
        if (this.isProcessing) return;
        this.isProcessing = true;

        while (this.queue.length > 0) {
            const { jobId, executeCallback } = this.queue.shift();
            
            const job = await this.jobManager.getJob(jobId);
            if (!job) {
                this._resolveEvent(jobId, ExecutionResponse.failure('Job not found', 'JOB_NOT_FOUND'));
                continue;
            }

            if (job.status === 'CANCELLED') {
                this._resolveEvent(jobId, ExecutionResponse.failure('Job was cancelled', 'JOB_CANCELLED'));
                continue;
            }

            const transition = await this.jobManager.transitionState(jobId, 'RUNNING');
            if (!transition.success) {
                // E.g. cancelled while in queue
                const currentJob = await this.jobManager.getJob(jobId);
                if (currentJob && currentJob.status === 'CANCELLED') {
                    this._resolveEvent(jobId, ExecutionResponse.failure('Job was cancelled', 'JOB_CANCELLED'));
                } else {
                    this._resolveEvent(jobId, ExecutionResponse.failure(transition.error, 'JOB_TRANSITION_ERROR'));
                }
                continue;
            }

            try {
                const executionResponse = await executeCallback();
                
                let nextState = 'COMPLETED';
                if (!executionResponse.success) {
                    if (executionResponse.error?.includes('timed out') || executionResponse.errorCode === 'TIMEOUT' || executionResponse.error?.includes('timeout')) {
                        nextState = 'TIMED_OUT';
                    } else {
                        nextState = 'FAILED';
                    }
                }

                await this.jobManager.transitionState(jobId, nextState, executionResponse.data, executionResponse.error);
                this._resolveEvent(jobId, executionResponse);
            } catch (err) {
                await this.jobManager.transitionState(jobId, 'FAILED', null, err.message);
                this._resolveEvent(jobId, ExecutionResponse.failure(err.message, 'UNCAUGHT_JOB_ERROR'));
            }
        }

        this.isProcessing = false;
    }

    _resolveEvent(jobId, response) {
        const event = this.jobCompletionEvents.get(jobId);
        if (event) {
            event.resolve(response);
            this.jobCompletionEvents.delete(jobId);
        }
    }
}
module.exports = JobScheduler;
