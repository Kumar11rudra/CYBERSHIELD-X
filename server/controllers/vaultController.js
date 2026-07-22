const VaultService = require('../services/platform/VaultService');

const getOrgId = (req) => {
    const orgId = req.params.orgId || req.query.orgId || req.headers['x-organization-id'];
    if (!orgId) throw new Error('organizationId is required');
    return orgId;
};

exports.getAssets = async (req, res, next) => {
    try {
        const result = await VaultService.getAssets(getOrgId(req), req.user._id, req.query);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

exports.addAsset = async (req, res, next) => {
    try {
        const result = await VaultService.addAsset(getOrgId(req), req.user._id, req.body);
        res.status(201).json(result);
    } catch (error) {
        next(error);
    }
};

exports.deleteAsset = async (req, res, next) => {
    try {
        const result = await VaultService.deleteAsset(getOrgId(req), req.user._id, req.params.id);
        res.json(result);
    } catch (error) {
        next(error);
    }
};
