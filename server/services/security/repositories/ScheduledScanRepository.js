const ScheduledScanDTO = require('../dto/ScheduledScanDTO');
const IRepository = require('../../../shared/IRepository');

/**
 * @module ScheduledScanRepository
 * @description Storage abstraction wrapper for ScheduledScans.
 */
class ScheduledScanRepository extends IRepository {
    constructor(deps) {
        super();
        if (!deps || !deps.storageProvider) {
            throw new Error('ScheduledScanRepository requires storageProvider');
        }
        this.storageProvider = deps.storageProvider;
        this.collectionName = 'scheduled_scans';
    }

    async findById(id) {
        const doc = await this.storageProvider.findById(this.collectionName, id);
        if (!doc) return null;
        return new ScheduledScanDTO(doc);
    }

    async findOne(query) {
        const doc = await this.storageProvider.findOne(this.collectionName, query);
        if (!doc) return null;
        return new ScheduledScanDTO(doc);
    }

    async findMany(query = {}) {
        const docs = await this.storageProvider.findMany(this.collectionName, query);
        return docs.map(doc => new ScheduledScanDTO(doc));
    }

    async create(entityDTO) {
        const doc = await this.storageProvider.save(this.collectionName, entityDTO.id, entityDTO);
        return new ScheduledScanDTO(doc);
    }

    async update(entityDTO) {
        const updates = { ...entityDTO };
        delete updates.id;
        delete updates.createdAt;
        
        const doc = await this.storageProvider.update(this.collectionName, entityDTO.id, updates);
        return new ScheduledScanDTO(doc);
    }

    async delete(id) {
        return await this.storageProvider.delete(this.collectionName, id);
    }

    async exists(query) {
        return await this.storageProvider.exists(this.collectionName, query);
    }

    async count(query) {
        return await this.storageProvider.count(this.collectionName, query);
    }

    async paginate(query, page = 1, limit = 10) {
        const result = await this.storageProvider.paginate(this.collectionName, query, page, limit);
        return {
            ...result,
            data: result.data.map(doc => new ScheduledScanDTO(doc))
        };
    }
}

module.exports = ScheduledScanRepository;
