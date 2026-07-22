const SystemSettings = require('../models/SystemSettings');
const SystemSettingsDTO = require('../models/dto/SystemSettingsDTO');

class SystemSettingsRepository {
    async findById(id) {
        const doc = await SystemSettings.findById(id);
        if (!doc) return null;
        return new SystemSettingsDTO(doc.toObject());
    }

    async find(filter = {}) {
        const docs = await SystemSettings.find(filter);
        return docs.map(doc => new SystemSettingsDTO(doc.toObject()));
    }

    async findOne(filter = {}) {
        const doc = await SystemSettings.findOne(filter);
        if (!doc) return null;
        return new SystemSettingsDTO(doc.toObject());
    }

    async create(data) {
        const doc = await SystemSettings.create(data);
        return new SystemSettingsDTO(doc.toObject());
    }

    async update(id, data) {
        const doc = await SystemSettings.findByIdAndUpdate(id, data, { new: true });
        if (!doc) return null;
        return new SystemSettingsDTO(doc.toObject());
    }

    async delete(id) {
        const doc = await SystemSettings.findByIdAndDelete(id);
        if (!doc) return null;
        return new SystemSettingsDTO(doc.toObject());
    }
}

module.exports = SystemSettingsRepository;
