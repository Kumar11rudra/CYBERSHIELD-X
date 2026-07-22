const JobDTO = require('./dto/JobDTO');
const IRepository = require('../../shared/IRepository');

class JobRepository extends IRepository {
    /**
     * @param {Object} deps
     * @param {import('../chatbot_core/storage/IStorageProvider')} deps.storageProvider
     */
    constructor(deps) {
        super();
        this.storageProvider = deps.storageProvider;
        this.collectionName = 'jobs';
    }

    /**
     * @param {JobDTO} job 
     * @returns {Promise<JobDTO>}
     */
    async save(job) {
        await this.storageProvider.save(this.collectionName, job.jobId, job);
        return job;
    }

    /**
     * @param {JobDTO} job 
     * @returns {Promise<JobDTO>}
     */
    async update(job) {
        await this.storageProvider.update(this.collectionName, job.jobId, {
            status: job.status,
            updatedAt: job.updatedAt,
            error: job.error,
            result: job.result,
            rawOutput: job.rawOutput,
            normalizedOutput: job.normalizedOutput,
            intelligenceReport: job.intelligenceReport
        });
        return job;
    }

    /**
     * @param {string} jobId 
     * @returns {Promise<JobDTO|null>}
     */
    async findById(jobId) {
        const doc = await this.storageProvider.findById(this.collectionName, jobId);
        if (!doc) return null;
        return new JobDTO(doc);
    }

    /**
     * @param {string} executionId 
     * @returns {Promise<JobDTO|null>}
     */
    async findByExecutionId(executionId) {
        const docs = await this.storageProvider.findMany(this.collectionName, { executionId });
        if (!docs || docs.length === 0) return null;
        // Depending on requirements, we might return all jobs for a workflow,
        // but this method signature previously returned a single job or null.
        return new JobDTO(docs[0]);
    }

    /**
     * @param {string} ownerId 
     * @returns {Promise<JobDTO[]>}
     */
    async findByOwnerId(ownerId) {
        const docs = await this.storageProvider.findMany(this.collectionName, { ownerId });
        return docs.map(doc => new JobDTO(doc));
    }

    /**
     * @returns {Promise<JobDTO[]>}
     */
    async findAll() {
        const docs = await this.storageProvider.findMany(this.collectionName, {});
        return docs.map(doc => new JobDTO(doc));
    }
}
module.exports = JobRepository;
