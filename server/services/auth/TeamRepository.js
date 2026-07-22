const TeamDTO = require('./dto/TeamDTO');
const IRepository = require('../../shared/IRepository');

/**
 * @module TeamRepository
 * @description Storage abstraction wrapper for Teams.
 */
class TeamRepository extends IRepository {
    /**
     * @param {Object} deps
     * @param {import('../chatbot_core/storage/IStorageProvider')} deps.storageProvider
     */
    constructor(deps) {
        super();
        if (!deps || !deps.storageProvider) {
            throw new Error('TeamRepository requires storageProvider');
        }
        this.storageProvider = deps.storageProvider;
        this.collectionName = 'teams';
    }

    async findById(id) {
        const doc = await this.storageProvider.findById(this.collectionName, id);
        if (!doc) return null;
        return new TeamDTO(doc);
    }

    async findOne(query) {
        const doc = await this.storageProvider.findOne(this.collectionName, query);
        if (!doc) return null;
        return new TeamDTO(doc);
    }

    async findMany(query = {}) {
        const docs = await this.storageProvider.findMany(this.collectionName, query);
        return docs.map(doc => new TeamDTO(doc));
    }

    async create(entityDTO) {
        const doc = await this.storageProvider.save(this.collectionName, entityDTO.id, entityDTO);
        return new TeamDTO(doc);
    }

    async update(entityDTO) {
        const updates = { ...entityDTO };
        delete updates.id;
        delete updates.createdAt;
        
        const doc = await this.storageProvider.update(this.collectionName, entityDTO.id, updates);
        return new TeamDTO(doc);
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
            data: result.data.map(doc => new TeamDTO(doc))
        };
    }
}

module.exports = TeamRepository;
