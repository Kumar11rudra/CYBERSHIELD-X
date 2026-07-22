const Playbook = require('../../models/Playbook');
const PlaybookDTO = require('../../models/dto/PlaybookDTO');
const QueryBuilder = require('../../utils/QueryBuilder');
const RBACService = require('../org/RBACService');

class PlaybookService {
    static async getPlaybooks(orgId, userId, query) {
        await RBACService.requirePermission(orgId, userId, 'canView');
        const qb = new QueryBuilder(Playbook, query)
            .tenant(orgId)
            .filter(['status'])
            .paginate()
            .sortBy(['createdAt']);

        const { data, pagination } = await qb.execute();
        return {
            data: data.map(p => new PlaybookDTO(p)),
            pagination
        };
    }

    static async createPlaybook(orgId, userId, data) {
        await RBACService.requirePermission(orgId, userId, 'canManageOrg');
        const playbook = new Playbook({ ...data, organizationId: orgId });
        await playbook.save();
        return new PlaybookDTO(playbook);
    }

    static async updatePlaybook(orgId, userId, id, data) {
        await RBACService.requirePermission(orgId, userId, 'canManageOrg');
        const playbook = await Playbook.findOneAndUpdate({ _id: id, organizationId: orgId }, data, { new: true });
        if (!playbook) throw new Error('Playbook not found');
        return new PlaybookDTO(playbook);
    }

    static async deletePlaybook(orgId, userId, id) {
        await RBACService.requirePermission(orgId, userId, 'canManageOrg');
        const result = await Playbook.findOneAndDelete({ _id: id, organizationId: orgId });
        if (!result) throw new Error('Playbook not found');
        return { success: true };
    }

    static async triggerPlaybookManually(orgId, userId, id, data) {
        await RBACService.requirePermission(orgId, userId, 'canManageOrg');
        // Logic to trigger playbook manually
        return { success: true, message: 'Playbook triggered' };
    }
}
module.exports = PlaybookService;
