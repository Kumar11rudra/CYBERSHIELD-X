const mongoose = require('mongoose');
const IntegrationService = require('../../services/platform/IntegrationService');
const RBACService = require('../../services/org/RBACService');
const IntegrationConfig = require('../../models/IntegrationConfig');
const QueryBuilder = require('../../utils/QueryBuilder');

jest.mock('../../services/org/RBACService');
jest.mock('../../utils/QueryBuilder');
jest.mock('../../models/IntegrationConfig');

describe('IntegrationService', () => {
    let orgId, userId;

    beforeEach(() => {
        orgId = new mongoose.Types.ObjectId().toString();
        userId = new mongoose.Types.ObjectId().toString();
        jest.clearAllMocks();
        RBACService.requirePermission.mockResolvedValue('viewer');

        QueryBuilder.mockImplementation(() => {
            const qb = {
                tenant: jest.fn().mockReturnThis(),
                filter: jest.fn().mockReturnThis(),
                paginate: jest.fn().mockReturnThis(),
                sortBy: jest.fn().mockReturnThis(),
                mongoQuery: {},
                execute: jest.fn().mockResolvedValue({
                    data: [{ _id: '123', type: 'slack' }],
                    pagination: { total: 1 }
                })
            };
            return qb;
        });
    });

    it('should retrieve integrations', async () => {
        const result = await IntegrationService.getIntegrations(orgId, userId, {});
        expect(result.data.length).toBe(1);
    });

    it('should update integration', async () => {
        IntegrationConfig.findOneAndUpdate.mockResolvedValue({ _id: '123', type: 'jira' });
        const result = await IntegrationService.updateIntegration(orgId, userId, '123', { type: 'jira' });
        expect(result.type).toBe('jira');
    });

    it('should delete integration', async () => {
        IntegrationConfig.findOneAndDelete.mockResolvedValue({ _id: '123' });
        const result = await IntegrationService.deleteIntegration(orgId, userId, '123');
        expect(result.success).toBe(true);
    });
});
