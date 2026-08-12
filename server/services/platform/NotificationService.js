const Notification = require('../../models/Notification');
const NotificationDTO = require('../../models/dto/NotificationDTO');
const QueryBuilder = require('../../utils/QueryBuilder');
const RBACService = require('../org/RBACService');

class NotificationService {
    static async getNotifications(orgId, userId, query) {
        await RBACService.requirePermission(orgId, userId, 'canView');
        const qb = new QueryBuilder(Notification, query);
        if (orgId) {
            qb.tenant(orgId);
        }
        qb.filter(['type', 'read'])
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
        if (notificationId === 'all') {
            const query = orgId ? { organizationId: orgId, userId } : { userId };
            await Notification.updateMany(query, { read: true });
            return { success: true };
        }
        const query = orgId 
            ? { _id: notificationId, organizationId: orgId, userId }
            : { _id: notificationId, userId };
        const notification = await Notification.findOneAndUpdate(
            query,
            { read: true },
            { new: true }
        );
        if (!notification) throw new Error('Notification not found');
        return new NotificationDTO(notification);
    }

    static async deleteNotification(orgId, userId, notificationId) {
        await RBACService.requirePermission(orgId, userId, 'canView');
        const query = orgId 
            ? { _id: notificationId, organizationId: orgId, userId }
            : { _id: notificationId, userId };
        const result = await Notification.findOneAndDelete(query);
        if (!result) throw new Error('Notification not found');
        return { success: true };
    }
}
module.exports = NotificationService;
