const AnalyticsAggregationService = require('../services/platform/AnalyticsAggregationService');

const getOrgId = (req) => {
    const orgId = req.params.orgId || req.query.orgId || req.headers['x-organization-id'];
    if (!orgId) throw new Error('organizationId is required');
    return orgId;
};

exports.getDailyActivity = async (req, res, next) => {
    try {
        const result = await AnalyticsAggregationService.getDailyScans(getOrgId(req), req.user._id, req.query);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

exports.getRiskTrends = async (req, res, next) => {
    try {
        const result = await AnalyticsAggregationService.getRiskTrends(getOrgId(req), req.user._id);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

exports.getSeverityTrends = async (req, res, next) => {
    try {
        const result = await AnalyticsAggregationService.getSeverityTrends(getOrgId(req), req.user._id);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

exports.getTopVulnerableAssets = async (req, res, next) => {
    try {
        const result = await AnalyticsAggregationService.getTopVulnerableAssets(getOrgId(req), req.user._id);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

exports.getCommonCVEs = async (req, res, next) => {
    try {
        const result = await AnalyticsAggregationService.getCommonCVEs(getOrgId(req), req.user._id);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

exports.getSLABreaches = async (req, res, next) => {
    try {
        const result = await AnalyticsAggregationService.getSLABreaches(getOrgId(req), req.user._id);
        res.json(result);
    } catch (error) {
        next(error);
    }
};
