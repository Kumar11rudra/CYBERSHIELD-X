/**
 * @module IStorageProvider
 * @description Abstract interface contract defining standard CRUD operations for storage.
 * Implementations must throw errors if operations fail.
 */
class IStorageProvider {
    /**
     * @param {string} collection - target storage partition/table/collection
     * @param {string} id - unique identifier
     * @param {Object} document - the data to store
     * @returns {Promise<Object>}
     */
    async save(collection, id, document) {
        throw new Error('Method not implemented.');
    }

    /**
     * @param {string} collection 
     * @param {string} id 
     * @returns {Promise<Object|null>}
     */
    async findById(collection, id) {
        throw new Error('Method not implemented.');
    }

    /**
     * @param {string} collection 
     * @param {Object} query 
     * @returns {Promise<Object|null>}
     */
    async findOne(collection, query) {
        throw new Error('Method not implemented.');
    }

    /**
     * @param {string} collection 
     * @param {Object} query 
     * @returns {Promise<Array<Object>>}
     */
    async findMany(collection, query = {}) {
        throw new Error('Method not implemented.');
    }

    /**
     * @param {string} collection 
     * @param {string} id 
     * @param {Object} updates 
     * @returns {Promise<Object>}
     */
    async update(collection, id, updates) {
        throw new Error('Method not implemented.');
    }

    /**
     * @param {string} collection 
     * @param {string} id 
     * @returns {Promise<boolean>}
     */
    async delete(collection, id) {
        throw new Error('Method not implemented.');
    }

    /**
     * @param {string} collection 
     * @param {Object} query 
     * @returns {Promise<boolean>}
     */
    async exists(collection, query) {
        throw new Error('Method not implemented.');
    }

    /**
     * @param {string} collection 
     * @param {Object} query 
     * @returns {Promise<number>}
     */
    async count(collection, query) {
        throw new Error('Method not implemented.');
    }

    /**
     * @param {string} collection 
     * @param {Object} query 
     * @param {number} page 
     * @param {number} limit 
     * @returns {Promise<{data: Array<Object>, total: number, page: number, limit: number}>}
     */
    async paginate(collection, query, page = 1, limit = 10) {
        throw new Error('Method not implemented.');
    }

    /**
     * @param {Function} callback 
     * @returns {Promise<any>}
     */
    async transaction(callback) {
        throw new Error('Method not implemented.');
    }

    /**
     * @param {string} collection 
     * @param {Array<Object>} documents 
     * @returns {Promise<Array<Object>>}
     */
    async bulkInsert(collection, documents) {
        throw new Error('Method not implemented.');
    }

    /**
     * @param {string} collection 
     * @param {Array<Object>} documents 
     * @returns {Promise<Array<Object>>}
     */
    async bulkUpdate(collection, documents) {
        throw new Error('Method not implemented.');
    }

    /**
     * @param {string} collection 
     * @param {Object} query 
     * @returns {Promise<number>}
     */
    async bulkDelete(collection, query) {
        throw new Error('Method not implemented.');
    }
}

module.exports = IStorageProvider;
