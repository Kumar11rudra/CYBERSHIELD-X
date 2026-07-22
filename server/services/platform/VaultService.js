const VaultAsset = require('../../models/VaultAsset');
const VaultDTO = require('../../models/dto/VaultDTO');
const QueryBuilder = require('../../utils/QueryBuilder');
const RBACService = require('../org/RBACService');

class VaultService {
    static async getAssets(orgId, userId, query) {
        await RBACService.requirePermission(orgId, userId, 'canManageOrg');
        const qb = new QueryBuilder(VaultAsset, query)
            .tenant(orgId)
            .filter(['type'])
            .paginate()
            .sortBy(['createdAt']);

        const { data, pagination } = await qb.execute();
        return {
            data: data.map(a => new VaultDTO(a)),
            pagination
        };
    }

    static async addAsset(orgId, userId, data) {
        await RBACService.requirePermission(orgId, userId, 'canManageOrg');
        const asset = new VaultAsset({ ...data, organizationId: orgId });
        await asset.save();
        return new VaultDTO(asset);
    }

    static async deleteAsset(orgId, userId, id) {
        await RBACService.requirePermission(orgId, userId, 'canManageOrg');
        const result = await VaultAsset.findOneAndDelete({ _id: id, organizationId: orgId });
        if (!result) throw new Error('Vault asset not found');
        return { success: true };
    }
}
module.exports = VaultService;
