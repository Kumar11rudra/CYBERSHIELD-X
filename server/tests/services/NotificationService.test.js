const mongoose = require('mongoose');
const NotificationService = require('../../services/platform/NotificationService');
const RBACService = require('../../services/org/RBACService');
const Notification = require('../../models/Notification');
const QueryBuilder = require('../../utils/QueryBuilder');

jest.mock('../../services/org/RBACService');
jest.mock('../../utils/QueryBuilder');
jest.mock('../../models/Notification');

describe('NotificationService', () => {
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
                    data: [{ _id: '123', type: 'alert' }],
                    pagination: { total: 1 }
                })
            };
            return qb;
        });
    });

    it('should retrieve notifications', async () => {
        const result = await NotificationService.getNotifications(orgId, userId, {});
        expect(result.data.length).toBe(1);
    });

    it('should mark as read', async () => {
        Notification.findOneAndUpdate.mockResolvedValue({ _id: '123', read: true });
        const result = await NotificationService.markAsRead(orgId, userId, '123');
        expect(result.read).toBe(true);
    });

    it('should delete notification', async () => {
        Notification.findOneAndDelete.mockResolvedValue({ _id: '123' });
        const result = await NotificationService.deleteNotification(orgId, userId, '123');
        expect(result.success).toBe(true);
    });
});
