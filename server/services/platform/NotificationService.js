const Notification = require('../../models/Notification');
const NotificationDTO = require('../../models/dto/NotificationDTO');
const QueryBuilder = require('../../utils/QueryBuilder');
const RBACService = require('../org/RBACService');

class NotificationService {
    static async getNotifications(orgId, userId, query) {
        await RBACService.requirePermission(orgId, userId, 'canView');
        const qb = new QueryBuilder(Notification, query)
            .tenant(orgId)
            .filter(['type', 'read'])
            .paginate()
            .sortBy(['createdAt']);

        // Only fetch for specific user
        qb.mongoQuery.userId = userId;

        const { data, pagination } = await qb.execute();
        return {
            data: data.map(n => new NotificationDTO(n)),
            pagination
        };
    }

    static async markAsRead(orgId, userId, notificationId) {
        await RBACService.requirePermission(orgId, userId, 'canView');
        const notification = await Notification.findOneAndUpdate(
            { _id: notificationId, organizationId: orgId, userId },
            { read: true },
            { new: true }
        );
        if (!notification) throw new Error('Notification not found');
        return new NotificationDTO(notification);
    }

    static async deleteNotification(orgId, userId, notificationId) {
        await RBACService.requirePermission(orgId, userId, 'canView');
        const result = await Notification.findOneAndDelete({ _id: notificationId, organizationId: orgId, userId });
        if (!result) throw new Error('Notification not found');
        return { success: true };
    }
}
module.exports = NotificationService;
