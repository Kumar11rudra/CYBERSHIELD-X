const PermissionDTO = require('./dto/PermissionDTO');

/**
 * @module PermissionRepository
 * @description Manages persistence access for Permissions.
 */
class PermissionRepository {
    /**
     * @param {import('../chatbot_core/storage/IStorageProvider')} storageProvider 
     */
    constructor(storageProvider) {
        this.storage = storageProvider;
        this.collection = 'permissions';
    }

    async create(permissionData) {
        const saved = await this.storage.save(this.collection, permissionData.id || null, permissionData);
        return new PermissionDTO(saved);
    }

    async findByName(name) {
        const doc = await this.storage.findOne(this.collection, { name });
        return doc ? new PermissionDTO(doc) : null;
    }

    async exists(name) {
        const doc = await this.storage.findOne(this.collection, { name });
        return !!doc;
    }

    async findAll() {
        const docs = await this.storage.findMany(this.collection, {});
        return docs.map(doc => new PermissionDTO(doc));
    }
}
module.exports = PermissionRepository;
