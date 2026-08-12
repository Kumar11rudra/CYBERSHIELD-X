const NotificationService = require('../services/platform/NotificationService');

const getOrgId = (req) => {
    return req.params.orgId || req.query.orgId || req.headers['x-organization-id'] || null;
};

exports.getNotifications = async (req, res, next) => {
    try {
        const result = await NotificationService.getNotifications(getOrgId(req), req.user._id || req.user.id, req.query);
        res.json({ success: true, notifications: result.data, pagination: result.pagination });
    } catch (error) {
        next(error);
    }
};

exports.markAsRead = async (req, res, next) => {
    try {
        const result = await NotificationService.markAsRead(getOrgId(req), req.user._id || req.user.id, req.params.id);
        if (req.params.id === 'all') {
            res.json({ success: true });
        } else {
            res.json({ success: true, notification: result });
        }
    } catch (error) {
        if (error.message.includes('not found')) {
            return res.status(404).json({ success: false, error: error.message });
        }
        next(error);
    }
};

exports.deleteNotification = async (req, res, next) => {
    try {
        await NotificationService.deleteNotification(getOrgId(req), req.user._id || req.user.id, req.params.id);
        res.json({ success: true });
    } catch (error) {
        if (error.message.includes('not found')) {
            return res.status(404).json({ success: false, error: error.message });
        }
        next(error);
    }
};
