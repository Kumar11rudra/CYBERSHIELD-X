const PlaybookService = require('../services/platform/PlaybookService');

const getOrgId = (req) => {
    const orgId = req.params.orgId || req.query.orgId || req.headers['x-organization-id'];
    if (!orgId) throw new Error('organizationId is required');
    return orgId;
};

exports.getPlaybooks = async (req, res, next) => {
    try {
        const result = await PlaybookService.getPlaybooks(getOrgId(req), req.user._id, req.query);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

exports.createPlaybook = async (req, res, next) => {
    try {
        const result = await PlaybookService.createPlaybook(getOrgId(req), req.user._id, req.body);
        res.status(201).json(result);
    } catch (error) {
        next(error);
    }
};

exports.updatePlaybook = async (req, res, next) => {
    try {
        const result = await PlaybookService.updatePlaybook(getOrgId(req), req.user._id, req.params.id, req.body);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

exports.deletePlaybook = async (req, res, next) => {
    try {
        const result = await PlaybookService.deletePlaybook(getOrgId(req), req.user._id, req.params.id);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

exports.triggerPlaybookManually = async (req, res, next) => {
    try {
        const result = await PlaybookService.triggerPlaybookManually(getOrgId(req), req.user._id, req.params.id, req.body);
        res.json(result);
    } catch (error) {
        next(error);
    }
};
