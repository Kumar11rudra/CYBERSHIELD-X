const DashboardAggregationService = require('../services/platform/DashboardAggregationService');

const getOrgId = (req) => {
    return req.params.orgId || req.query.orgId || req.headers['x-organization-id'] || null;
};

exports.getDashboardStats = async (req, res, next) => {
    try {
        const result = await DashboardAggregationService.getStats(getOrgId(req), req.user._id);
        res.json(result);
    } catch (error) {
        next(error);
    }
};