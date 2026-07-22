const OrganizationDTO = require('./dto/OrganizationDTO');
const IRepository = require('../../shared/IRepository');

/**
 * @module OrganizationRepository
 * @description Storage abstraction wrapper for Organizations.
 */
class OrganizationRepository extends IRepository {
    /**
     * @param {Object} deps
     * @param {import('../chatbot_core/storage/IStorageProvider')} deps.storageProvider
     */
    constructor(deps) {
        super();
        if (!deps || !deps.storageProvider) {
            throw new Error('OrganizationRepository requires storageProvider');
        }
        this.storageProvider = deps.storageProvider;
        this.collectionName = 'organizations';
    }

    /**
     * @param {string} id 
     * @returns {Promise<OrganizationDTO|null>}
     */
    async findById(id) {
        const doc = await this.storageProvider.findById(this.collectionName, id);
        if (!doc) return null;
        return new OrganizationDTO(doc);
    }

    /**
     * @param {Object} query 
     * @returns {Promise<OrganizationDTO|null>}
     */
    async findOne(query) {
        const doc = await this.storageProvider.findOne(this.collectionName, query);
        if (!doc) return null;
        return new OrganizationDTO(doc);
    }

    /**
     * @param {Object} query 
     * @returns {Promise<Array<OrganizationDTO>>}
     */
    async findMany(query = {}) {
        const docs = await this.storageProvider.findMany(this.collectionName, query);
        return docs.map(doc => new OrganizationDTO(doc));
    }

    /**
     * @param {Object} entityDTO 
     * @returns {Promise<OrganizationDTO>}
     */
    async create(entityDTO) {
        const doc = await this.storageProvider.save(this.collectionName, entityDTO.id, entityDTO);
        return new OrganizationDTO(doc);
    }

    /**
     * @param {Object} entityDTO 
     * @returns {Promise<OrganizationDTO>}
     */
    async update(entityDTO) {
        const updates = { ...entityDTO };
        delete updates.id;
        delete updates.createdAt;
        
        const doc = await this.storageProvider.update(this.collectionName, entityDTO.id, updates);
        return new OrganizationDTO(doc);
    }

    /**
     * @param {string} id 
     * @returns {Promise<boolean>}
     */
    async delete(id) {
        return await this.storageProvider.delete(this.collectionName, id);
    }

    /**
     * @param {Object} query 
     * @returns {Promise<boolean>}
     */
    async exists(query) {
        return await this.storageProvider.exists(this.collectionName, query);
    }

    /**
     * @param {Object} query 
     * @returns {Promise<number>}
     */
    async count(query) {
        return await this.storageProvider.count(this.collectionName, query);
    }

    /**
     * @param {Object} query 
     * @param {number} page 
     * @param {number} limit 
     * @returns {Promise<{data: Array<OrganizationDTO>, total: number, page: number, limit: number}>}
     */
    async paginate(query, page = 1, limit = 10) {
        const result = await this.storageProvider.paginate(this.collectionName, query, page, limit);
        return {
            ...result,
            data: result.data.map(doc => new OrganizationDTO(doc))
        };
    }
}

module.exports = OrganizationRepository;
