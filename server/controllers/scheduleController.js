const ScheduleService = require('../services/platform/ScheduleService');

const getOrgId = (req) => {
    const orgId = req.params.orgId || req.query.orgId || req.headers['x-organization-id'];
    if (!orgId) throw new Error('organizationId is required');
    return orgId;
};

exports.getSchedules = async (req, res, next) => {
    try {
        const result = await ScheduleService.getSchedules(getOrgId(req), req.user._id, req.query);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

exports.createSchedule = async (req, res, next) => {
    try {
        const result = await ScheduleService.createSchedule(getOrgId(req), req.user._id, req.body);
        res.status(201).json(result);
    } catch (error) {
        next(error);
    }
};

exports.updateSchedule = async (req, res, next) => {
    try {
        const result = await ScheduleService.updateSchedule(getOrgId(req), req.user._id, req.params.id, req.body);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

exports.deleteSchedule = async (req, res, next) => {
    try {
        const result = await ScheduleService.deleteSchedule(getOrgId(req), req.user._id, req.params.id);
        res.json(result);
    } catch (error) {
        next(error);
    }
};
