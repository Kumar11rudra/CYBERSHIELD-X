const ActivityLog = require('../models/ActivityLog');
const ActivityLogDTO = require('../models/dto/ActivityLogDTO');

class ActivityLogRepository {
    async findById(id) {
        const doc = await ActivityLog.findById(id);
        if (!doc) return null;
        return new ActivityLogDTO(doc.toObject());
    }

    async find(filter = {}) {
        const docs = await ActivityLog.find(filter);
        return docs.map(doc => new ActivityLogDTO(doc.toObject()));
    }

    async findOne(filter = {}) {
        const doc = await ActivityLog.findOne(filter);
        if (!doc) return null;
        return new ActivityLogDTO(doc.toObject());
    }

    async create(data) {
        const doc = await ActivityLog.create(data);
        return new ActivityLogDTO(doc.toObject());
    }

    async update(id, data) {
        const doc = await ActivityLog.findByIdAndUpdate(id, data, { new: true });
        if (!doc) return null;
        return new ActivityLogDTO(doc.toObject());
    }

    async delete(id) {
        const doc = await ActivityLog.findByIdAndDelete(id);
        if (!doc) return null;
        return new ActivityLogDTO(doc.toObject());
    }
}

module.exports = ActivityLogRepository;
