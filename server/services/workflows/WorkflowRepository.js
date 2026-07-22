const WorkflowExecutionDTO = require('./dto/WorkflowExecutionDTO');
const IRepository = require('../../shared/IRepository');

/**
 * @module WorkflowRepository
 * @description Persistence for WorkflowExecutionDTOs. Respects storage abstraction.
 */
class WorkflowRepository extends IRepository {
    /**
     * @param {Object} deps
     * @param {import('../chatbot_core/storage/IStorageProvider')} deps.storageProvider
     */
    constructor(deps) {
        super();
        if (!deps || !deps.storageProvider) {
            throw new Error('WorkflowRepository requires storageProvider');
        }
        this.storageProvider = deps.storageProvider;
        this.collectionName = 'workflows';
    }

    /**
     * @param {import('./dto/WorkflowExecutionDTO')} execution 
     * @returns {Promise<import('./dto/WorkflowExecutionDTO')>}
     */
    async save(execution) {
        await this.storageProvider.save(this.collectionName, execution.executionId, execution);
        return execution;
    }

    /**
     * @param {import('./dto/WorkflowExecutionDTO')} execution 
     * @returns {Promise<import('./dto/WorkflowExecutionDTO')>}
     */
    async update(execution) {
        // Find existing to ensure it exists, throw if not found
        const existing = await this.storageProvider.findById(this.collectionName, execution.executionId);
        if (!existing) {
            throw new Error(`Workflow execution not found: ${execution.executionId}`);
        }
        await this.storageProvider.update(this.collectionName, execution.executionId, {
            status: execution.status,
            endTime: execution.endTime,
            error: execution.error,
            jobMappings: execution.jobMappings,
            result: execution.result,
            updatedAt: Date.now()
        });
        return execution;
    }

    /**
     * @param {string} executionId 
     * @returns {Promise<import('./dto/WorkflowExecutionDTO')|null>}
     */
    async findById(executionId) {
        const doc = await this.storageProvider.findById(this.collectionName, executionId);
        if (!doc) return null;
        return new WorkflowExecutionDTO(doc);
    }

    /**
     * @returns {Promise<Array<import('./dto/WorkflowExecutionDTO')>>}
     */
    async findAll() {
        const docs = await this.storageProvider.findMany(this.collectionName, {});
        return docs.map(doc => new WorkflowExecutionDTO(doc));
    }

    /**
     * @param {string} ownerId 
     * @returns {Promise<Array<import('./dto/WorkflowExecutionDTO')>>}
     */
    async findByOwnerId(ownerId) {
        const docs = await this.storageProvider.findMany(this.collectionName, { ownerId });
        return docs.map(doc => new WorkflowExecutionDTO(doc));
    }
}

module.exports = WorkflowRepository;
