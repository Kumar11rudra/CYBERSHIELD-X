const HistoryService = require('../services/platform/HistoryService');

const getOrgId = (req) => {
    const orgId = req.params.orgId || req.query.orgId || req.headers['x-organization-id'];
    if (!orgId) throw new Error('organizationId is required');
    return orgId;
};

exports.getHistory = async (req, res, next) => {
    try {
        const result = await HistoryService.getHistory(getOrgId(req), req.user._id, req.query);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

exports.getEntityHistory = async (req, res, next) => {
    try {
        const result = await HistoryService.getEntityHistory(getOrgId(req), req.user._id, req.params.entityType, req.params.entityId, req.query);
        res.json(result);
    } catch (error) {
        next(error);
    }
};