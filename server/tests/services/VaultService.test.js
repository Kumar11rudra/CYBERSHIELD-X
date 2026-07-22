const mongoose = require('mongoose');
const VaultService = require('../../services/platform/VaultService');
const RBACService = require('../../services/org/RBACService');
const VaultAsset = require('../../models/VaultAsset');
const QueryBuilder = require('../../utils/QueryBuilder');

jest.mock('../../services/org/RBACService');
jest.mock('../../utils/QueryBuilder');
jest.mock('../../models/VaultAsset');

describe('VaultService', () => {
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
                    data: [{ _id: '123', type: 'credential' }],
                    pagination: { total: 1 }
                })
            };
            return qb;
        });
    });

    it('should retrieve vault assets', async () => {
        const result = await VaultService.getAssets(orgId, userId, {});
        expect(result.data.length).toBe(1);
    });

    it('should delete vault asset', async () => {
        VaultAsset.findOneAndDelete.mockResolvedValue({ _id: '123' });
        const result = await VaultService.deleteAsset(orgId, userId, '123');
        expect(result.success).toBe(true);
    });
});
