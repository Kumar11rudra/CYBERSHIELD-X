const IRepository = require('../../shared/IRepository');
const IOCRecordDTO = require('../dto/IOCRecordDTO');

class IOCRepository extends IRepository {
    constructor({ storageProvider }) {
        super();
        this.storageProvider = storageProvider;
        this.collection = 'ioc_records';
    }

    async findById(id) {
        const data = await this.storageProvider.findById(this.collection, id);
        return data ? new IOCRecordDTO(data) : null;
    }

    async findOne(query) {
        const data = await this.storageProvider.findOne(this.collection, query);
        return data ? new IOCRecordDTO(data) : null;
    }

    async findMany(query) {
        const items = await this.storageProvider.findMany(this.collection, query);
        return items.map(item => new IOCRecordDTO(item));
    }

    async create(data) {
        const result = await this.storageProvider.save(this.collection, null, data);
        return new IOCRecordDTO(result);
    }

    async update(data) {
        const { id, ...updatePayload } = data;
        const result = await this.storageProvider.save(this.collection, id, updatePayload);
        return new IOCRecordDTO(result);
    }

    async delete(id) {
        return await this.storageProvider.delete(this.collection, id);
    }

    async upsert(query, data) {
        // We use MongoStorageProvider's save with null to trigger create, 
        // but for upsert we need to rely on standard query. Let's try find and update.
        // Or we can add an upsert to IStorageProvider later. 
        // For now, implementing manually via findOne + create/update.
        const existing = await this.storageProvider.findOne(this.collection, query);
        if (existing) {
            const result = await this.storageProvider.save(this.collection, existing._id, data);
            return new IOCRecordDTO(result);
        } else {
            const result = await this.storageProvider.save(this.collection, null, { ...query, ...data });
            return new IOCRecordDTO(result);
        }
    }
}

module.exports = IOCRepository;
