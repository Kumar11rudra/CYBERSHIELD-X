const mongoose = require('mongoose');
const ScheduleService = require('../../services/platform/ScheduleService');
const RBACService = require('../../services/org/RBACService');
const ScheduledScan = require('../../models/ScheduledScan');
const QueryBuilder = require('../../utils/QueryBuilder');

jest.mock('../../services/org/RBACService');
jest.mock('../../utils/QueryBuilder');
jest.mock('../../models/ScheduledScan');

describe('ScheduleService', () => {
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
                    data: [{ _id: '123', name: 'Weekly Scan' }],
                    pagination: { total: 1 }
                })
            };
            return qb;
        });
    });

    it('should retrieve schedules', async () => {
        const result = await ScheduleService.getSchedules(orgId, userId, {});
        expect(result.data.length).toBe(1);
    });

    it('should update schedule', async () => {
        ScheduledScan.findOneAndUpdate.mockResolvedValue({ _id: '123', name: 'New Name' });
        const result = await ScheduleService.updateSchedule(orgId, userId, '123', { name: 'New Name' });
        expect(result.name).toBe('New Name');
    });

    it('should delete schedule', async () => {
        ScheduledScan.findOneAndDelete.mockResolvedValue({ _id: '123' });
        const result = await ScheduleService.deleteSchedule(orgId, userId, '123');
        expect(result.success).toBe(true);
    });
});
