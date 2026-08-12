const adminService = require('../services/admin/AdminService');

exports.getAllUsers = async (req, res, next) => {
    try {
        const result = await adminService.getAllUsers(req.query);
        res.json(result);
    } catch (err) { next(err); }
};

exports.getPlatformStats = async (req, res, next) => {
    try {
        const stats = await adminService.getPlatformStats();
        res.json(stats);
    } catch (err) { next(err); }
};

exports.updateUserRole = async (req, res, next) => {
    try {
        const user = await adminService.updateUserRole(req.params.id, req.body.role, req.user._id);
        res.json({ success: true, user });
    } catch (err) { next(err); }
};

exports.deleteUser = async (req, res, next) => {
    try {
        const result = await adminService.deleteUser(req.params.id, req.user._id);
        res.json(result);
    } catch (err) { next(err); }
};

exports.toggleBanUser = async (req, res, next) => {
    try {
        const user = await adminService.toggleBanUser(req.params.id, req.body.banReason, req.user._id);
        res.json({ success: true, isBanned: user.isBanned });
    } catch (err) { next(err); }
};

exports.getUserReport = async (req, res, next) => {
    try {
        const report = await adminService.getUserReport(req.params.id);
        res.json(report);
    } catch (err) { next(err); }
};

exports.getFirewallRules = async (req, res, next) => {
    try {
        const rules = await adminService.getFirewallRules();
        res.json({ rules });
    } catch (err) { next(err); }
};

exports.addFirewallRule = async (req, res, next) => {
    try {
        const rules = await adminService.addFirewallRule(req.body.ip, req.user._id);
        res.json({ success: true, rules });
    } catch (err) { next(err); }
};

exports.removeFirewallRule = async (req, res, next) => {
    try {
        const rules = await adminService.removeFirewallRule(req.params.ip || req.body.ip, req.user._id);
        res.json({ success: true, rules });
    } catch (err) { next(err); }
};

exports.getMaintenanceStatus = async (req, res, next) => {
    try {
        const status = await adminService.getMaintenanceStatus();
        res.json(status);
    } catch (err) { next(err); }
};

exports.toggleMaintenanceMode = async (req, res, next) => {
    try {
        const { enabled, message } = req.body;
        const result = await adminService.toggleMaintenanceMode(enabled, message, req.user._id);
        res.json({ success: true, ...result });
    } catch (err) { next(err); }
};

exports.getAuditLogs = async (req, res, next) => {
    try {
        const logs = await adminService.getAuditLogs(req.query);
        res.json(logs);
    } catch (err) { next(err); }
};

exports.injectTestThreat = async (req, res, next) => {
    try {
        const result = await adminService.injectTestThreat(req.user._id);
        res.json(result);
    } catch (err) { next(err); }
};

exports.getSecurityMetrics = async (req, res, next) => {
    try {
        const metrics = await adminService.getSecurityMetrics();
        res.json(metrics);
    } catch (err) { next(err); }
};

exports.getProductionTelemetry = async (req, res, next) => {
    try {
        const telemetry = await adminService.getProductionTelemetry();
        res.json(telemetry);
    } catch (err) { next(err); }
};

exports.getSystemHealth = async (req, res, next) => {
    try {
        const health = await adminService.getSystemHealth();
        res.json(health);
    } catch (err) { next(err); }
};

exports.getDeployments = async (req, res, next) => {
    try {
        const deployments = await adminService.getDeployments();
        res.json(deployments);
    } catch (err) { next(err); }
};

exports.getDeploymentCorrelation = async (req, res, next) => {
    try {
        const correlation = await adminService.getDeploymentCorrelation();
        res.json(correlation);
    } catch (err) { next(err); }
};
