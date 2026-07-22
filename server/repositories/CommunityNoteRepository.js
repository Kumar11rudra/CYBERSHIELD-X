const CommunityNote = require('../models/CommunityNote');
const CommunityNoteDTO = require('../models/dto/CommunityNoteDTO');

class CommunityNoteRepository {
    async findById(id) {
        const doc = await CommunityNote.findById(id);
        if (!doc) return null;
        return new CommunityNoteDTO(doc.toObject());
    }

    async find(filter = {}) {
        const docs = await CommunityNote.find(filter);
        return docs.map(doc => new CommunityNoteDTO(doc.toObject()));
    }

    async findOne(filter = {}) {
        const doc = await CommunityNote.findOne(filter);
        if (!doc) return null;
        return new CommunityNoteDTO(doc.toObject());
    }

    async create(data) {
        const doc = await CommunityNote.create(data);
        return new CommunityNoteDTO(doc.toObject());
    }

    async update(id, data) {
        const doc = await CommunityNote.findByIdAndUpdate(id, data, { new: true });
        if (!doc) return null;
        return new CommunityNoteDTO(doc.toObject());
    }

    async delete(id) {
        const doc = await CommunityNote.findByIdAndDelete(id);
        if (!doc) return null;
        return new CommunityNoteDTO(doc.toObject());
    }
}

module.exports = CommunityNoteRepository;
