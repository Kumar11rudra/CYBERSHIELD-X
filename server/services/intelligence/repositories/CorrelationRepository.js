const IRepository = require('../../shared/IRepository');
const CorrelationRecordDTO = require('../dto/CorrelationRecordDTO');

class CorrelationRepository extends IRepository {
    constructor({ storageProvider }) {
        super();
        this.storageProvider = storageProvider;
        this.collection = 'correlation_records';
    }

    async findById(id) {
        const data = await this.storageProvider.findById(this.collection, id);
        return data ? new CorrelationRecordDTO(data) : null;
    }

    async findOne(query) {
        const data = await this.storageProvider.findOne(this.collection, query);
        return data ? new CorrelationRecordDTO(data) : null;
    }

    async findMany(query) {
        const items = await this.storageProvider.findMany(this.collection, query);
        return items.map(item => new CorrelationRecordDTO(item));
    }

    async create(data) {
        const result = await this.storageProvider.save(this.collection, null, data);
        return new CorrelationRecordDTO(result);
    }

    async update(data) {
        const { id, ...updatePayload } = data;
        const result = await this.storageProvider.save(this.collection, id, updatePayload);
        return new CorrelationRecordDTO(result);
    }

    async delete(id) {
        return await this.storageProvider.delete(this.collection, id);
    }
}

module.exports = CorrelationRepository;
