const Playbook = require('../models/Playbook');
const PlaybookDTO = require('../models/dto/PlaybookDTO');

class PlaybookRepository {
    async findById(id) {
        const doc = await Playbook.findById(id);
        if (!doc) return null;
        return new PlaybookDTO(doc.toObject());
    }

    async find(filter = {}) {
        const docs = await Playbook.find(filter);
        return docs.map(doc => new PlaybookDTO(doc.toObject()));
    }

    async findOne(filter = {}) {
        const doc = await Playbook.findOne(filter);
        if (!doc) return null;
        return new PlaybookDTO(doc.toObject());
    }

    async create(data) {
        const doc = await Playbook.create(data);
        return new PlaybookDTO(doc.toObject());
    }

    async update(id, data) {
        const doc = await Playbook.findByIdAndUpdate(id, data, { new: true });
        if (!doc) return null;
        return new PlaybookDTO(doc.toObject());
    }

    async delete(id) {
        const doc = await Playbook.findByIdAndDelete(id);
        if (!doc) return null;
        return new PlaybookDTO(doc.toObject());
    }
}

module.exports = PlaybookRepository;
