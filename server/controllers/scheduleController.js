const ScheduleService = require('../services/platform/ScheduleService');

const getOrgId = (req) => {
    return req.params.orgId || req.query.orgId || req.headers['x-organization-id'] || null;
};

exports.getSchedules = async (req, res, next) => {
    try {
        const result = await ScheduleService.getSchedules(getOrgId(req), req.user._id, req.query);
        res.json({ success: true, schedules: result.data || result });
    } catch (error) {
        next(error);
    }
};

exports.createSchedule = async (req, res, next) => {
    try {
        const result = await ScheduleService.createSchedule(getOrgId(req), req.user._id, req.body);
        res.status(201).json({ success: true, schedule: result });
    } catch (error) {
        if (error.message.includes('Frequency must be') || error.message.includes('required')) {
            return res.status(400).json({ success: false, error: error.message });
        }
        next(error);
    }
};

exports.updateSchedule = async (req, res, next) => {
    try {
        const result = await ScheduleService.updateSchedule(getOrgId(req), req.user._id, req.params.id, req.body);
        res.json({ success: true, schedule: result });
    } catch (error) {
        if (error.message.includes('Frequency must be') || error.message.includes('required')) {
            return res.status(400).json({ success: false, error: error.message });
        }
        if (error.message.includes('not found')) {
            return res.status(404).json({ success: false, error: error.message });
        }
        next(error);
    }
};

exports.deleteSchedule = async (req, res, next) => {
    try {
        await ScheduleService.deleteSchedule(getOrgId(req), req.user._id, req.params.id);
        res.json({ success: true });
    } catch (error) {
        if (error.message.includes('not found')) {
            return res.status(404).json({ success: false, error: error.message });
        }
        next(error);
    }
};
