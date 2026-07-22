const mongoose = require('mongoose');
const HistoryService = require('../../services/platform/HistoryService');
const RBACService = require('../../services/org/RBACService');
const ActivityLog = require('../../models/ActivityLog');
const QueryBuilder = require('../../utils/QueryBuilder');

jest.mock('../../services/org/RBACService');
jest.mock('../../utils/QueryBuilder');

describe('HistoryService', () => {
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
                dateRange: jest.fn().mockReturnThis(),
                paginate: jest.fn().mockReturnThis(),
                sortBy: jest.fn().mockReturnThis(),
                mongoQuery: {},
                execute: jest.fn().mockResolvedValue({
                    data: [{ _id: '123', action: 'test_action' }],
                    pagination: { total: 1 }
                })
            };
            return qb;
        });
    });

    it('should retrieve history', async () => {
        const result = await HistoryService.getHistory(orgId, userId, {});
        expect(RBACService.requirePermission).toHaveBeenCalledWith(orgId, userId, 'canView');
        expect(result.data.length).toBe(1);
        expect(result.data[0].action).toBe('test_action');
    });

    it('should retrieve entity history', async () => {
        const result = await HistoryService.getEntityHistory(orgId, userId, 'scan', 'scan_123', {});
        expect(result.data.length).toBe(1);
    });
});
