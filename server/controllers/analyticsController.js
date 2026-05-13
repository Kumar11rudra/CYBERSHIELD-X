/**
 * analyticsController.js
 * Admin-only analytics aggregations for the Nexus Command Center.
 * Provides daily user activity, scan trends, breach sources, and live session estimates.
 */

const User = require('../models/User');
const Scan = require('../models/Scan');
const ActivityLog = require('../models/ActivityLog');

/**
 * GET /api/admin/analytics/overview
 * Returns platform-wide analytics summary
 */
const getAnalyticsOverview = async (req, res, next) => {
  try {
    const now = new Date();
    const last7Days = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(now - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      newUsersLast7Days,
      totalScans,
      scansLast7Days,
      loginEventsLast7Days,
      twoFAEnabledUsers,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ createdAt: { $gte: last7Days } }),
      Scan.countDocuments(),
      Scan.countDocuments({ createdAt: { $gte: last7Days } }),
      ActivityLog.countDocuments({ action: 'LOGIN', timestamp: { $gte: last7Days } }),
      User.countDocuments({ twoFactorEnabled: true }),
    ]);

    res.json({
      overview: {
        totalUsers,
        newUsersLast7Days,
        totalScans,
        scansLast7Days,
        loginEventsLast7Days,
        twoFAEnabledUsers,
        twoFAAdoptionRate: totalUsers > 0 ? ((twoFAEnabledUsers / totalUsers) * 100).toFixed(1) + '%' : '0%',
      },
    });
  } catch (e) {
    next(e);
  }
};

/**
 * GET /api/admin/analytics/daily-activity
 * Returns daily registrations and scan counts for the last 14 days
 */
const getDailyActivity = async (req, res, next) => {
  try {
    const days = 14;
    const results = [];

    for (let i = days - 1; i >= 0; i--) {
      const dayStart = new Date();
      dayStart.setDate(dayStart.getDate() - i);
      dayStart.setHours(0, 0, 0, 0);

      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);

      const [users, scans, logins] = await Promise.all([
        User.countDocuments({ createdAt: { $gte: dayStart, $lte: dayEnd } }),
        Scan.countDocuments({ createdAt: { $gte: dayStart, $lte: dayEnd } }),
        ActivityLog.countDocuments({ action: 'LOGIN', timestamp: { $gte: dayStart, $lte: dayEnd } }),
      ]);

      results.push({
        date: dayStart.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
        users,
        scans,
        logins,
      });
    }

    res.json({ dailyActivity: results });
  } catch (e) {
    next(e);
  }
};

/**
 * GET /api/admin/analytics/scan-types
 * Returns scan type distribution
 */
const getScanTypes = async (req, res, next) => {
  try {
    const typeDistribution = await Scan.aggregate([
      { $group: { _id: '$targetType', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    res.json({ scanTypes: typeDistribution.map(t => ({ type: t._id || 'Unknown', count: t.count })) });
  } catch (e) {
    next(e);
  }
};

/**
 * GET /api/admin/analytics/security-events  
 * Returns recent high-severity security events from ActivityLog
 */
const getSecurityEvents = async (req, res, next) => {
  try {
    const events = await ActivityLog.find({
      action: { $in: ['LOGIN', '2FA_ENABLED', '2FA_DISABLED', 'PROFILE_UPDATE', 'LOGOUT'] },
    })
      .sort({ timestamp: -1 })
      .limit(20)
      .populate('userId', 'username email role');

    res.json({ events });
  } catch (e) {
    next(e);
  }
};

module.exports = {
  getAnalyticsOverview,
  getDailyActivity,
  getScanTypes,
  getSecurityEvents,
};
