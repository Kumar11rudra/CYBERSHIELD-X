const AuditService = require('../services/platform/AuditService');

const getOrgId = (req) => {
    return req.params.orgId || req.query.orgId || req.headers['x-organization-id'] || null;
};

exports.getAuditLogs = async (req, res, next) => {
    try {
        const result = await AuditService.getLogs(getOrgId(req), req.user._id, req.query);
        res.json(result);
    } catch (error) {
        next(error);
    }
};
