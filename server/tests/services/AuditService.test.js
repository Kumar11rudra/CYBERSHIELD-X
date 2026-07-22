const mongoose = require('mongoose');
const AuditService = require('../../services/platform/AuditService');
const RBACService = require('../../services/org/RBACService');
const QueryBuilder = require('../../utils/QueryBuilder');

jest.mock('../../services/org/RBACService');
jest.mock('../../utils/QueryBuilder');

describe('AuditService', () => {
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
                    data: [{ _id: '123', action: 'audit_action' }],
                    pagination: { total: 1 }
                })
            };
            return qb;
        });
    });

    it('should retrieve audit logs', async () => {
        const result = await AuditService.getLogs(orgId, userId, { search: 'login' });
        expect(RBACService.requirePermission).toHaveBeenCalledWith(orgId, userId, 'canView');
        expect(result.data.length).toBe(1);
    });
});
