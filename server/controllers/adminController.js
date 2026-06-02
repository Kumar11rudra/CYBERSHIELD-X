const User = require('../models/User');
const Scan = require('../models/Scan');
const ActivityLog = require('../models/ActivityLog');
const SystemSettings = require('../models/SystemSettings');
const VaultAsset = require('../models/VaultAsset');
const Watchlist = require('../models/Watchlist');
const CommunityNote = require('../models/CommunityNote');
const { detectInputType, normalizeScanTarget } = require('../utils/validators');
const logger = require('../utils/logger');

const getAllUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find().sort({ createdAt: -1 }).skip(skip).limit(limit).select('-password'),
      User.countDocuments(),
    ]);

    res.json({ users, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    next(error);
  }
};

const getPlatformStats = async (req, res, next) => {
  try {
    const [totalUsers, totalScans, riskBreakdown, dailyScans, recentScans] = await Promise.all([
      User.countDocuments(),
      Scan.countDocuments(),
      Scan.aggregate([{ $group: { _id: '$riskLevel', count: { $sum: 1 } } }]),
      Scan.aggregate([
        { $match: { createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Scan.find().sort({ createdAt: -1 }).limit(10).populate('userId', 'username email'),
    ]);

    const riskMap = { safe: 0, low: 0, medium: 0, dangerous: 0 };
    riskBreakdown.forEach(({ _id, count }) => { if (_id in riskMap) riskMap[_id] = count; });

    res.json({ totalUsers, totalScans, riskBreakdown: riskMap, dailyScans, recentScans });
  } catch (error) {
    next(error);
  }
};

const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) return res.status(404).json({ error: 'User not found' });
    if (targetUser.email === 'official.cybershieldx@gmail.com' && req.user.email !== 'official.cybershieldx@gmail.com') {
      return res.status(403).json({ error: 'Cannot modify root admin role' });
    }
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password');

    logger.info(`[AUDIT] Admin ${req.user._id} updated role of User ${req.params.id} to ${role}`);
    res.json({ message: 'Role updated', user });
  } catch (error) {
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const existingUser = await User.findById(req.params.id).select('_id email');
    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (existingUser.email === 'official.cybershieldx@gmail.com') {
      return res.status(403).json({ error: 'Cannot delete root admin' });
    }

    await Promise.all([
      User.findByIdAndDelete(req.params.id),
      Scan.deleteMany({ userId: req.params.id }),
      ActivityLog.deleteMany({ userId: req.params.id }),
      VaultAsset.deleteMany({ userId: req.params.id }),
      Watchlist.deleteMany({ userId: req.params.id }),
      CommunityNote.deleteMany({ authorId: req.params.id }),
    ]);

    logger.info(`[AUDIT] Admin ${req.user._id} deleted User ${req.params.id} and associated data`);
    res.json({ message: 'User and associated data deleted' });
  } catch (error) {
    next(error);
  }
};

const toggleBanUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.email === 'official.cybershieldx@gmail.com') {
      return res.status(403).json({ error: 'Cannot ban root admin' });
    }

    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ error: 'Cannot ban yourself' });
    }

    user.isBanned = !user.isBanned;
    await user.save();

    await ActivityLog.create({
      userId: user._id,
      action: user.isBanned ? 'ADMIN_BAN_APPLIED' : 'ADMIN_BAN_LIFTED',
      metadata: { adminId: req.user._id, ip: req.ip }
    });

    logger.info(`[AUDIT] Admin ${req.user._id} ${user.isBanned ? 'banned' : 'unbanned'} User ${req.params.id}`);

    res.json({ message: user.isBanned ? 'User banned' : 'User unbanned', user });
  } catch (error) {
    next(error);
  }
};

const getUserReport = async (req, res, next) => {
  try {
    const userId = req.params.id;

    const user = await User.findById(userId).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });

    const [activities, scans] = await Promise.all([
      ActivityLog.find({ userId }).sort({ timestamp: -1 }).limit(100),
      Scan.find({ userId }).sort({ createdAt: -1 }).limit(50),
    ]);

    await ActivityLog.create({
      userId,
      action: 'ADMIN_VIEW_REPORT',
      metadata: {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        adminId: req.user._id,
        details: `Access granted to administrator: ${req.user.username}`
      }
    });

    res.json({ user, activities, scans });
  } catch (error) {
    next(error);
  }
};

// ─── TOOL 1: Global Firewall — Block/Unblock an IP ──────────────────────────
const getFirewallRules = async (req, res, next) => {
  try {
    const settings = await SystemSettings.findById('global') || { blockedIPs: [] };
    res.json({ blockedIPs: settings.blockedIPs || [] });
  } catch (error) { next(error); }
};

const addFirewallRule = async (req, res, next) => {
  try {
    const { ip } = req.body;
    if (!ip || !/^[\d.:a-fA-F/]+$/.test(ip)) {
      return res.status(400).json({ error: 'Invalid IP address format' });
    }
    const settings = await SystemSettings.findByIdAndUpdate(
      'global',
      { $addToSet: { blockedIPs: ip }, lastUpdatedBy: req.user._id },
      { upsert: true, new: true }
    );
    await ActivityLog.create({
      userId: req.user._id,
      action: 'ADMIN_FIREWALL_BLOCK',
      metadata: { ip, adminId: req.user._id }
    });
    res.json({ message: `IP ${ip} blocked`, blockedIPs: settings.blockedIPs });
  } catch (error) { next(error); }
};

const removeFirewallRule = async (req, res, next) => {
  try {
    const { ip } = req.params;
    const settings = await SystemSettings.findByIdAndUpdate(
      'global',
      { $pull: { blockedIPs: ip }, lastUpdatedBy: req.user._id },
      { new: true }
    );
    await ActivityLog.create({
      userId: req.user._id,
      action: 'ADMIN_FIREWALL_UNBLOCK',
      metadata: { ip, adminId: req.user._id }
    });
    res.json({ message: `IP ${ip} unblocked`, blockedIPs: settings?.blockedIPs || [] });
  } catch (error) { next(error); }
};

// ─── TOOL 2: Maintenance Mode Toggle ────────────────────────────────────────
const getMaintenanceStatus = async (req, res, next) => {
  try {
    const settings = await SystemSettings.findById('global');
    res.json({
      maintenanceMode: settings?.maintenanceMode || false,
      maintenanceMessage: settings?.maintenanceMessage || '',
    });
  } catch (error) { next(error); }
};

const toggleMaintenanceMode = async (req, res, next) => {
  try {
    const { maintenanceMode, maintenanceMessage } = req.body;
    const settings = await SystemSettings.findByIdAndUpdate(
      'global',
      {
        maintenanceMode,
        ...(maintenanceMessage && { maintenanceMessage }),
        lastUpdatedBy: req.user._id
      },
      { upsert: true, new: true }
    );
    await ActivityLog.create({
      userId: req.user._id,
      action: maintenanceMode ? 'ADMIN_MAINTENANCE_ON' : 'ADMIN_MAINTENANCE_OFF',
      metadata: { adminId: req.user._id }
    });
    res.json({ maintenanceMode: settings.maintenanceMode, maintenanceMessage: settings.maintenanceMessage });
  } catch (error) { next(error); }
};

// ─── TOOL 3: Admin Audit Logs ────────────────────────────────────────────────
const getAuditLogs = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const skip = (page - 1) * limit;
    const actionFilter = req.query.action ? { action: req.query.action } : {};

    const [logs, total] = await Promise.all([
      ActivityLog.find({ action: { $regex: /^ADMIN_/i }, ...actionFilter })
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'username email'),
      ActivityLog.countDocuments({ action: { $regex: /^ADMIN_/i }, ...actionFilter }),
    ]);

    res.json({ logs, pagination: { page, limit, total } });
  } catch (error) { next(error); }
};

// ─── TOOL 4: Threat Injection (Simulate Attack for Testing) ──────────────────
const injectTestThreat = async (req, res, next) => {
  try {
    const { target, type, riskLevel } = req.body;
    if (!target || !type) {
      return res.status(400).json({ error: 'Target and type are required' });
    }
    const validTypes = ['url', 'domain', 'ip', 'hash'];
    const validRisk  = ['safe', 'low', 'medium', 'dangerous'];
    if (!validTypes.includes(type))  return res.status(400).json({ error: 'Invalid scan type' });
    if (riskLevel && !validRisk.includes(riskLevel)) return res.status(400).json({ error: 'Invalid risk level' });
    const normalizedTarget = normalizeScanTarget(target);
    const inferredType = normalizedTarget ? detectInputType(normalizedTarget) : null;
    if (!normalizedTarget || inferredType !== type) {
      return res.status(400).json({ error: 'Target must be valid and match the selected scan type' });
    }

    const scoreMap = { safe: 5, low: 30, medium: 60, dangerous: 90 };
    const scan = await Scan.create({
      userId: req.user._id,
      target: normalizedTarget,
      targetType: type,
      riskLevel: riskLevel || 'dangerous',
      threatScore: scoreMap[riskLevel] || 90,
      breakdown: {
        synthetic: {
          source: 'admin-injection',
          summary: '[ADMIN THREAT SIMULATION] This is a synthetic test threat injected by administrator.',
          injectedAt: new Date().toISOString(),
        },
      },
      sourceScores: {
        synthetic: scoreMap[riskLevel] || 90,
      },
      notes: '[ADMIN THREAT SIMULATION] This is a synthetic test threat injected by administrator.',
      tags: ['admin-injection', 'synthetic'],
      createdAt: new Date(),
    });

    await ActivityLog.create({
      userId: req.user._id,
      action: 'ADMIN_THREAT_INJECTED',
      metadata: { target: normalizedTarget, type, riskLevel, scanId: scan._id }
    });

    res.json({ message: 'Test threat injected successfully', scan });
  } catch (error) { next(error); }
};
// ─── TOOL 5: Security Headers Dashboard (C) ──────────────────────────────────
const getSecurityMetrics = async (req, res, next) => {
  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Aggregate metrics from ActivityLog
    const [
      honeypotHits,
      cspViolations,
      loginAnomalies,
      failedLogins,
      settings
    ] = await Promise.all([
      ActivityLog.countDocuments({ action: 'HONEYPOT_TRIPPED', timestamp: { $gte: oneDayAgo } }),
      ActivityLog.countDocuments({ action: 'CSP_VIOLATION', timestamp: { $gte: oneDayAgo } }), // Assuming CSP endpoint logs this
      ActivityLog.countDocuments({ action: 'LOGIN_ANOMALY', timestamp: { $gte: oneDayAgo } }),
      ActivityLog.countDocuments({ action: 'LOGIN_FAILED', timestamp: { $gte: oneDayAgo } }),
      SystemSettings.findById('global').select('blockedIPs')
    ]);

    const activeBlockedIPs = settings?.blockedIPs?.length || 0;

    res.json({
      metrics: {
        honeypotHits,
        cspViolations,
        loginAnomalies,
        failedLogins,
        activeBlockedIPs,
        timeframe: 'last_24_hours'
      }
    });
  } catch (error) {
    next(error);
  }
};

const getProductionTelemetry = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalScans = await Scan.countDocuments();
    
    // Aggregate Activity Logs for Telemetry
    const telemetry = await ActivityLog.aggregate([
      { $limit: 1000 }, // Analyze last 1000 signals
      {
        $group: {
          _id: null,
          totalSignals: { $sum: 1 },
          successRate: { $avg: { $cond: [{ $eq: ["$status", "success"] }, 1, 0] } },
          mobileNodes: { $sum: { $cond: [{ $regexMatch: { input: "$metadata.userAgent", regex: /Mobile/i } }, 1, 0] } },
          desktopNodes: { $sum: { $cond: [{ $regexMatch: { input: "$metadata.userAgent", regex: /Mobile/i } }, 0, 1] } }
        }
      }
    ]);

    // Geo Distribution
    const geoPoints = await ActivityLog.aggregate([
      { $match: { "metadata.location.country": { $exists: true } } },
      { $group: { _id: "$metadata.location.country", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      system: {
        totalUsers,
        totalScans,
        healthScore: 98,
        apiLatency: "42ms",
        uptime: "14d 6h 22m"
      },
      nodes: telemetry[0] || { mobileNodes: 0, desktopNodes: 0 },
      geography: geoPoints
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAllUsers,
  getPlatformStats,
  updateUserRole,
  deleteUser,
  toggleBanUser,
  getUserReport,
  getFirewallRules,
  addFirewallRule,
  removeFirewallRule,
  getMaintenanceStatus,
  toggleMaintenanceMode,
  getAuditLogs,
  injectTestThreat,
  getSecurityMetrics,
  getProductionTelemetry,
};
