const IRepository = require('../../../shared/IRepository');
const ThreatFeedDTO = require('../dto/ThreatFeedDTO');

class ThreatFeedRepository extends IRepository {
    constructor({ storageProvider }) {
        super();
        this.storageProvider = storageProvider;
        this.collection = 'threat_feed_records';
    }

    async findById(id) {
        const data = await this.storageProvider.findById(this.collection, id);
        return data ? new ThreatFeedDTO(data) : null;
    }

    async findOne(query) {
        const data = await this.storageProvider.findOne(this.collection, query);
        return data ? new ThreatFeedDTO(data) : null;
    }

    async findMany(query) {
        const items = await this.storageProvider.findMany(this.collection, query);
        return items.map(item => new ThreatFeedDTO(item));
    }

    async create(data) {
        const result = await this.storageProvider.save(this.collection, null, data);
        return new ThreatFeedDTO(result);
    }

    async update(data) {
        const { id, ...updatePayload } = data;
        const result = await this.storageProvider.save(this.collection, id, updatePayload);
        return new ThreatFeedDTO(result);
    }

    async delete(id) {
        return await this.storageProvider.delete(this.collection, id);
    }

    async upsert(query, data) {
        const existing = await this.storageProvider.findOne(this.collection, query);
        if (existing) {
            const result = await this.storageProvider.save(this.collection, existing._id, data);
            return new ThreatFeedDTO(result);
        } else {
            const result = await this.storageProvider.save(this.collection, null, { ...query, ...data });
            return new ThreatFeedDTO(result);
        }
    }
}

module.exports = ThreatFeedRepository;
