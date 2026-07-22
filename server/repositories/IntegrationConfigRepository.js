const IntegrationConfig = require('../models/IntegrationConfig');
const IntegrationConfigDTO = require('../models/dto/IntegrationConfigDTO');

class IntegrationConfigRepository {
    async findById(id) {
        const doc = await IntegrationConfig.findById(id);
        if (!doc) return null;
        return new IntegrationConfigDTO(doc.toObject());
    }

    async find(filter = {}) {
        const docs = await IntegrationConfig.find(filter);
        return docs.map(doc => new IntegrationConfigDTO(doc.toObject()));
    }

    async findOne(filter = {}) {
        const doc = await IntegrationConfig.findOne(filter);
        if (!doc) return null;
        return new IntegrationConfigDTO(doc.toObject());
    }

    async create(data) {
        const doc = await IntegrationConfig.create(data);
        return new IntegrationConfigDTO(doc.toObject());
    }

    async update(id, data) {
        const doc = await IntegrationConfig.findByIdAndUpdate(id, data, { new: true });
        if (!doc) return null;
        return new IntegrationConfigDTO(doc.toObject());
    }

    async delete(id) {
        const doc = await IntegrationConfig.findByIdAndDelete(id);
        if (!doc) return null;
        return new IntegrationConfigDTO(doc.toObject());
    }
}

module.exports = IntegrationConfigRepository;
