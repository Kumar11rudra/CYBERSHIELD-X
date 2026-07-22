const CommunityNote = require('../../models/CommunityNote');
const GenericDTO = require('../../models/dto/GenericDTO');
const QueryBuilder = require('../../utils/QueryBuilder');
const RBACService = require('../org/RBACService');

class CommunityService {
    static async getCommunityNotes(orgId, userId, query) {
        await RBACService.requirePermission(orgId, userId, 'canView');
        const qb = new QueryBuilder(CommunityNote, query)
            .paginate()
            .sortBy(['createdAt']);
        const { data, pagination } = await qb.execute();
        return { data: data.map(d => new GenericDTO(d)), pagination };
    }
    static async createCommunityNote(orgId, userId, body) {
        await RBACService.requirePermission(orgId, userId, 'canView');
        const note = new CommunityNote({ ...body, author: userId });
        await note.save();
        return new GenericDTO(note);
    }
    static async voteCommunityNote(orgId, userId, id, type) {
        await RBACService.requirePermission(orgId, userId, 'canView');
        const update = type === 'up' ? { $inc: { upvotes: 1 } } : { $inc: { downvotes: 1 } };
        const note = await CommunityNote.findByIdAndUpdate(id, update, { new: true });
        return new GenericDTO(note);
    }
}
module.exports = CommunityService;
