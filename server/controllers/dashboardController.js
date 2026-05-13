const Scan = require('../models/Scan');

const getDashboardStats = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const [
      totalScans,
      riskBreakdown,
      recentScans,
      dailyScans,
      topTargets,
    ] = await Promise.all([
      Scan.countDocuments({ userId }),

      Scan.aggregate([
        { $match: { userId } },
        { $group: { _id: '$riskLevel', count: { $sum: 1 } } },
      ]),

      Scan.find({ userId })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('target targetType threatScore riskLevel createdAt'),

      Scan.aggregate([
        {
          $match: {
            userId,
            createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
            avgScore: { $avg: '$threatScore' },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      Scan.aggregate([
        { $match: { userId } },
        { $group: { _id: '$target', count: { $sum: 1 }, avgScore: { $avg: '$threatScore' }, riskLevel: { $last: '$riskLevel' } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]),
    ]);

    // Normalize risk breakdown
    const riskMap = { safe: 0, low: 0, medium: 0, dangerous: 0 };
    riskBreakdown.forEach(({ _id, count }) => {
      if (_id in riskMap) riskMap[_id] = count;
    });

    const dangerousCount = riskMap.dangerous + riskMap.medium;
    const safeCount = riskMap.safe + riskMap.low;

    res.json({
      overview: {
        totalScans,
        safeCount,
        dangerousCount,
        maliciousRate: totalScans > 0 ? Math.round((dangerousCount / totalScans) * 100) : 0,
      },
      riskBreakdown: riskMap,
      recentScans,
      dailyActivity: dailyScans,
      topTargets,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboardStats };
