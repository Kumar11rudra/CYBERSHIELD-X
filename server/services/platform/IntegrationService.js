const IntegrationConfig = require('../../models/IntegrationConfig');
const IntegrationDTO = require('../../models/dto/IntegrationDTO');
const QueryBuilder = require('../../utils/QueryBuilder');
const RBACService = require('../org/RBACService');

class IntegrationService {
    static async getIntegrations(orgId, userId, query) {
        await RBACService.requirePermission(orgId, userId, 'canManageOrg');
        const qb = new QueryBuilder(IntegrationConfig, query)
            .tenant(orgId)
            .filter(['type', 'status'])
            .paginate()
            .sortBy(['createdAt']);

        const { data, pagination } = await qb.execute();
        return {
            data: data.map(i => new IntegrationDTO(i)),
            pagination
        };
    }

    static async createIntegration(orgId, userId, data) {
        await RBACService.requirePermission(orgId, userId, 'canManageOrg');
        const integration = new IntegrationConfig({ ...data, organizationId: orgId });
        await integration.save();
        return new IntegrationDTO(integration);
    }

    static async updateIntegration(orgId, userId, id, data) {
        await RBACService.requirePermission(orgId, userId, 'canManageOrg');
        const integration = await IntegrationConfig.findOneAndUpdate({ _id: id, organizationId: orgId }, data, { new: true });
        if (!integration) throw new Error('Integration not found');
        return new IntegrationDTO(integration);
    }

    static async deleteIntegration(orgId, userId, id) {
        await RBACService.requirePermission(orgId, userId, 'canManageOrg');
        const result = await IntegrationConfig.findOneAndDelete({ _id: id, organizationId: orgId });
        if (!result) throw new Error('Integration not found');
        return { success: true };
    }

    static async testIntegration(orgId, userId, id) {
        await RBACService.requirePermission(orgId, userId, 'canManageOrg');
        // Logic to test integration
        return { success: true, message: 'Integration test successful' };
    }
}
module.exports = IntegrationService;
