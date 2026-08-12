const AssetService = require('../services/asset/AssetService');

const getOrgId = (req) => {
    return req.params.orgId || req.query.orgId || req.headers['x-organization-id'] || null;
};

exports.createAsset = async (req, res, next) => {
    try {
        const result = await AssetService.createAsset(getOrgId(req), req.user._id || req.user.id, req.body);
        res.status(201).json({ success: true, asset: result });
    } catch (error) {
        if (error.message.includes('already exists') || error.message.includes('required')) {
            return res.status(400).json({ success: false, error: error.message });
        }
        next(error);
    }
};

exports.getAssets = async (req, res, next) => {
    try {
        const result = await AssetService.getAssets(getOrgId(req), req.user._id || req.user.id, req.query);
        res.json({ success: true, assets: result.data || result, pagination: result.pagination });
    } catch (error) {
        next(error);
    }
};

exports.getAssetById = async (req, res, next) => {
    try {
        const result = await AssetService.getAssetById(getOrgId(req), req.user._id || req.user.id, req.params.assetId);
        res.json({ success: true, asset: result });
    } catch (error) {
        if (error.message.includes('not found')) {
            return res.status(404).json({ success: false, error: error.message });
        }
        next(error);
    }
};

exports.updateAsset = async (req, res, next) => {
    try {
        const result = await AssetService.updateAsset(getOrgId(req), req.user._id || req.user.id, req.params.assetId, req.body);
        res.json({ success: true, asset: result });
    } catch (error) {
        if (error.message.includes('not found')) {
            return res.status(404).json({ success: false, error: error.message });
        }
        next(error);
    }
};

exports.deleteAsset = async (req, res, next) => {
    try {
        const result = await AssetService.deleteAsset(getOrgId(req), req.user._id || req.user.id, req.params.assetId);
        res.json({ success: true, asset: result });
    } catch (error) {
        if (error.message.includes('not found')) {
            return res.status(404).json({ success: false, error: error.message });
        }
        next(error);
    }
};

exports.archiveAsset = async (req, res, next) => {
    try {
        const result = await AssetService.archiveAsset(getOrgId(req), req.user._id, req.params.assetId);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

exports.restoreAsset = async (req, res, next) => {
    try {
        const result = await AssetService.restoreAsset(getOrgId(req), req.user._id, req.params.assetId);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

exports.bulkCreateAssets = async (req, res, next) => {
    try {
        const result = await AssetService.bulkCreateAssets(getOrgId(req), req.user._id, req.body.assets);
        res.status(201).json(result);
    } catch (error) {
        next(error);
    }
};

exports.bulkDeleteAssets = async (req, res, next) => {
    try {
        const result = await AssetService.bulkDeleteAssets(getOrgId(req), req.user._id, req.body.assetIds);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

exports.bulkArchiveAssets = async (req, res, next) => {
    try {
        const result = await AssetService.bulkArchiveAssets(getOrgId(req), req.user._id, req.body.assetIds);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

exports.searchAssets = async (req, res, next) => {
    try {
        const result = await AssetService.searchAssets(getOrgId(req), req.user._id, req.query);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

exports.filterAssets = async (req, res, next) => {
    try {
        const result = await AssetService.filterAssets(getOrgId(req), req.user._id, req.query);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

exports.assignOwner = async (req, res, next) => {
    try {
        const result = await AssetService.assignOwner(getOrgId(req), req.user._id, req.params.assetId, req.body.ownerId);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

exports.removeOwner = async (req, res, next) => {
    try {
        const result = await AssetService.removeOwner(getOrgId(req), req.user._id, req.params.assetId);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

exports.assignTeam = async (req, res, next) => {
    try {
        const result = await AssetService.assignTeam(getOrgId(req), req.user._id, req.params.assetId, req.body.teamId);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

exports.removeTeam = async (req, res, next) => {
    try {
        const result = await AssetService.removeTeam(getOrgId(req), req.user._id, req.params.assetId);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

exports.getAssetHistory = async (req, res, next) => {
    try {
        const result = await AssetService.getAssetHistory(getOrgId(req), req.user._id, req.params.assetId);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

exports.getAssetStatistics = async (req, res, next) => {
    try {
        const result = await AssetService.getAssetStatistics(getOrgId(req), req.user._id);
        res.json(result);
    } catch (error) {
        next(error);
    }
};
