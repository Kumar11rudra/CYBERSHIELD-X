/**
 * @module IRepository
 * @description Standardized base contract for all Domain Repositories in the system.
 * Enforces a consistent CRUD API across the entire data layer.
 * Concrete repositories MUST extend this class and implement these methods.
 */
class IRepository {
    /**
     * @param {string} id 
     * @returns {Promise<Object|null>}
     */
    async findById(id) { throw new Error('Method not implemented.'); }

    /**
     * @param {Object} query 
     * @returns {Promise<Object|null>}
     */
    async findOne(query) { throw new Error('Method not implemented.'); }

    /**
     * @param {Object} query 
     * @returns {Promise<Array<Object>>}
     */
    async findMany(query = {}) { throw new Error('Method not implemented.'); }

    /**
     * @param {Object} entityDTO 
     * @returns {Promise<Object>}
     */
    async create(entityDTO) { throw new Error('Method not implemented.'); }

    /**
     * @param {Object} entityDTO 
     * @returns {Promise<Object>}
     */
    async update(entityDTO) { throw new Error('Method not implemented.'); }

    /**
     * @param {string} id 
     * @returns {Promise<boolean>}
     */
    async delete(id) { throw new Error('Method not implemented.'); }

    /**
     * @param {Object} query 
     * @returns {Promise<boolean>}
     */
    async exists(query) { throw new Error('Method not implemented.'); }

    /**
     * @param {Object} query 
     * @returns {Promise<number>}
     */
    async count(query) { throw new Error('Method not implemented.'); }

    /**
     * @param {Object} query 
     * @param {number} page 
     * @param {number} limit 
     * @returns {Promise<{data: Array<Object>, total: number, page: number, limit: number}>}
     */
    async paginate(query, page = 1, limit = 10) { throw new Error('Method not implemented.'); }

    /**
     * @param {Function} callback 
     * @returns {Promise<any>}
     */
    async transaction(callback) { throw new Error('Method not implemented.'); }

    /**
     * @param {Array<Object>} entities 
     * @returns {Promise<Array<Object>>}
     */
    async bulkInsert(entities) { throw new Error('Method not implemented.'); }

    /**
     * @param {Array<Object>} entities 
     * @returns {Promise<Array<Object>>}
     */
    async bulkUpdate(entities) { throw new Error('Method not implemented.'); }

    /**
     * @param {Object} query 
     * @returns {Promise<number>} Returns the number of deleted records
     */
    async bulkDelete(query) { throw new Error('Method not implemented.'); }
}

module.exports = IRepository;
