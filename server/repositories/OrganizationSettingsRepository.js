const OrganizationSettings = require('../models/OrganizationSettings');
const OrganizationSettingsDTO = require('../models/dto/OrganizationSettingsDTO');

class OrganizationSettingsRepository {
    async findById(id) {
        const doc = await OrganizationSettings.findById(id);
        if (!doc) return null;
        return new OrganizationSettingsDTO(doc.toObject());
    }

    async find(filter = {}) {
        const docs = await OrganizationSettings.find(filter);
        return docs.map(doc => new OrganizationSettingsDTO(doc.toObject()));
    }

    async findOne(filter = {}) {
        const doc = await OrganizationSettings.findOne(filter);
        if (!doc) return null;
        return new OrganizationSettingsDTO(doc.toObject());
    }

    async create(data) {
        const doc = await OrganizationSettings.create(data);
        return new OrganizationSettingsDTO(doc.toObject());
    }

    async update(id, data) {
        const doc = await OrganizationSettings.findByIdAndUpdate(id, data, { new: true });
        if (!doc) return null;
        return new OrganizationSettingsDTO(doc.toObject());
    }

    async delete(id) {
        const doc = await OrganizationSettings.findByIdAndDelete(id);
        if (!doc) return null;
        return new OrganizationSettingsDTO(doc.toObject());
    }
}

module.exports = OrganizationSettingsRepository;
