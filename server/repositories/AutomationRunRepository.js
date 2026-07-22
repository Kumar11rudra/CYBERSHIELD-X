const AutomationRun = require('../models/AutomationRun');
const AutomationRunDTO = require('../models/dto/AutomationRunDTO');

class AutomationRunRepository {
    async findById(id) {
        const doc = await AutomationRun.findById(id);
        if (!doc) return null;
        return new AutomationRunDTO(doc.toObject());
    }

    async find(filter = {}) {
        const docs = await AutomationRun.find(filter);
        return docs.map(doc => new AutomationRunDTO(doc.toObject()));
    }

    async findOne(filter = {}) {
        const doc = await AutomationRun.findOne(filter);
        if (!doc) return null;
        return new AutomationRunDTO(doc.toObject());
    }

    async create(data) {
        const doc = await AutomationRun.create(data);
        return new AutomationRunDTO(doc.toObject());
    }

    async update(id, data) {
        const doc = await AutomationRun.findByIdAndUpdate(id, data, { new: true });
        if (!doc) return null;
        return new AutomationRunDTO(doc.toObject());
    }

    async delete(id) {
        const doc = await AutomationRun.findByIdAndDelete(id);
        if (!doc) return null;
        return new AutomationRunDTO(doc.toObject());
    }
}

module.exports = AutomationRunRepository;
