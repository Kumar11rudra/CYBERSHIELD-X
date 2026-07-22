const DashboardAggregationService = require('../services/platform/DashboardAggregationService');

const getOrgId = (req) => {
    const orgId = req.params.orgId || req.query.orgId || req.headers['x-organization-id'];
    if (!orgId) throw new Error('organizationId is required');
    return orgId;
};

exports.getDashboardStats = async (req, res, next) => {
    try {
        const result = await DashboardAggregationService.getStats(getOrgId(req), req.user._id);
        res.json(result);
    } catch (error) {
        next(error);
    }
};