const Notification = require('../models/Notification');
const NotificationDTO = require('../models/dto/NotificationDTO');

class NotificationRepository {
    async findById(id) {
        const doc = await Notification.findById(id);
        if (!doc) return null;
        return new NotificationDTO(doc.toObject());
    }

    async find(filter = {}) {
        const docs = await Notification.find(filter);
        return docs.map(doc => new NotificationDTO(doc.toObject()));
    }

    async findOne(filter = {}) {
        const doc = await Notification.findOne(filter);
        if (!doc) return null;
        return new NotificationDTO(doc.toObject());
    }

    async create(data) {
        const doc = await Notification.create(data);
        return new NotificationDTO(doc.toObject());
    }

    async update(id, data) {
        const doc = await Notification.findByIdAndUpdate(id, data, { new: true });
        if (!doc) return null;
        return new NotificationDTO(doc.toObject());
    }

    async delete(id) {
        const doc = await Notification.findByIdAndDelete(id);
        if (!doc) return null;
        return new NotificationDTO(doc.toObject());
    }
}

module.exports = NotificationRepository;
