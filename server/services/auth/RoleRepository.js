const RoleDTO = require('./dto/RoleDTO');

/**
 * @module RoleRepository
 * @description Manages persistence access for Roles.
 */
class RoleRepository {
    /**
     * @param {import('../chatbot_core/storage/IStorageProvider')} storageProvider 
     */
    constructor(storageProvider) {
        this.storage = storageProvider && storageProvider.storageProvider ? storageProvider.storageProvider : storageProvider;
        this.collection = 'roles';
        this.userRoleCollection = 'user_roles';
    }

    async create(roleData) {
        const saved = await this.storage.save(this.collection, roleData.id || null, roleData);
        return new RoleDTO(saved);
    }

    async findByName(name) {
        const doc = await this.storage.findOne(this.collection, { name });
        return doc ? new RoleDTO(doc) : null;
    }

    async exists(name) {
        const doc = await this.storage.findOne(this.collection, { name });
        return !!doc;
    }

    async findAll() {
        const docs = await this.storage.findMany(this.collection, {});
        return docs.map(doc => new RoleDTO(doc));
    }

    async assignRoleToUser(userId, roleName) {
        await this.storage.save(this.userRoleCollection, `${userId}_${roleName}`, { userId, roleName });
        return true;
    }

    async removeRoleFromUser(userId, roleName) {
        await this.storage.delete(this.userRoleCollection, `${userId}_${roleName}`);
        return true;
    }

    async findRolesByUser(userId) {
        // Needs findMany. We'll use a mocked query in storage.
        const userRoles = await this.storage.findOne(this.userRoleCollection, { userId, $many: true }); // Mocking semantic
        if (!userRoles || !Array.isArray(userRoles)) return [];
        return userRoles.map(ur => ur.roleName);
    }
}
module.exports = RoleRepository;
