const IntegrationService = require('../services/platform/IntegrationService');

const getOrgId = (req) => {
    return req.organizationId || req.headers['x-organization-id'] || req.query.orgId || req.params.orgId || null;
};

exports.getIntegrations = async (req, res, next) => {
    try {
        const result = await IntegrationService.getIntegrations(getOrgId(req), req.user._id, req.query);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

exports.createIntegration = async (req, res, next) => {
    try {
        const result = await IntegrationService.createIntegration(getOrgId(req), req.user._id, req.body);
        res.status(201).json(result);
    } catch (error) {
        next(error);
    }
};

exports.updateIntegration = async (req, res, next) => {
    try {
        const result = await IntegrationService.updateIntegration(getOrgId(req), req.user._id, req.params.id, req.body);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

exports.deleteIntegration = async (req, res, next) => {
    try {
        const result = await IntegrationService.deleteIntegration(getOrgId(req), req.user._id, req.params.id);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

exports.testIntegration = async (req, res, next) => {
    try {
        const integrationId = req.params.id || req.body?.id || req.body?.integrationId;
        if (!integrationId) {
            return res.status(400).json({
                success: false,
                error: 'Integration identifier is required in route parameter or request body.',
                code: 'MISSING_INTEGRATION_ID',
            });
        }

        let orgId = getOrgId(req);
        if (!orgId && req.user?._id) {
            const Membership = require('../models/Membership');
            const membership = await Membership.findOne({ userId: req.user._id }).sort({ createdAt: 1 });
            if (membership) {
                orgId = membership.organizationId.toString();
            }
        }

        if (!orgId) {
            return res.status(400).json({
                success: false,
                error: 'Organization context required. Pass X-Organization-Id header.',
                code: 'MISSING_ORGANIZATION_CONTEXT',
            });
        }

        const result = await IntegrationService.testIntegration(orgId, req.user._id, integrationId);
        res.json(result);
    } catch (error) {
        if (error.status) {
            return res.status(error.status).json({
                success: false,
                error: error.message,
                code: error.code || 'INTEGRATION_ERROR',
            });
        }
        next(error);
    }
};
