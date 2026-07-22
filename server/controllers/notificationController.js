const NotificationService = require('../services/platform/NotificationService');

const getOrgId = (req) => {
    const orgId = req.params.orgId || req.query.orgId || req.headers['x-organization-id'];
    if (!orgId) throw new Error('organizationId is required');
    return orgId;
};

exports.getNotifications = async (req, res, next) => {
    try {
        const result = await NotificationService.getNotifications(getOrgId(req), req.user._id, req.query);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

exports.markAsRead = async (req, res, next) => {
    try {
        const result = await NotificationService.markAsRead(getOrgId(req), req.user._id, req.params.id);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

exports.deleteNotification = async (req, res, next) => {
    try {
        const result = await NotificationService.deleteNotification(getOrgId(req), req.user._id, req.params.id);
        res.json(result);
    } catch (error) {
        next(error);
    }
};
