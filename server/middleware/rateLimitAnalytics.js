const ActivityLog = require('../models/ActivityLog');
const cache = require('../utils/cache');
const logger = require('../utils/logger');

/**
 * Log a rate-limit block event to both the database and system cache for telemetry metrics.
 */
const logRateLimitBlock = async (req, limiterName) => {
  const clientIp = req.ip || req.connection?.remoteAddress || 'unknown';
  const path = req.path;
  const userAgent = req.get('User-Agent') || '';

  logger.warn(`[RATE LIMIT] IP ${clientIp} blocked on path: ${path} (Limiter: ${limiterName})`);

  try {
    // 1. Log block action to ActivityLog
    await ActivityLog.create({
      userId: req.user?._id || null,
      action: 'RATE_LIMIT_BLOCKED',
      status: 'warning',
      metadata: {
        ip: clientIp,
        path,
        userAgent,
        limiterName,
        timestamp: new Date(),
      },
    }).catch(() => {});

    // 2. Track rate-limit metrics in Cache (for dashboard charts)
    const metricsKey = 'metrics:ratelimits';
    const currentMetrics = (await cache.get(metricsKey)) || {
      totalBlocks: 0,
      blocksByIp: {},
      blocksByLimiter: {},
    };

    currentMetrics.totalBlocks += 1;
    currentMetrics.blocksByIp[clientIp] = (currentMetrics.blocksByIp[clientIp] || 0) + 1;
    currentMetrics.blocksByLimiter[limiterName] = (currentMetrics.blocksByLimiter[limiterName] || 0) + 1;

    // Cache metrics for 30 days
    await cache.set(metricsKey, currentMetrics, 30 * 24 * 3600);
  } catch (err) {
    logger.error(`[rateLimitAnalytics] Error tracking block event: ${err.message}`);
  }
};

/**
 * Returns a custom block handler for express-rate-limit configurations.
 */
const createRateLimitHandler = (limiterName) => {
  return async (req, res, next, options) => {
    await logRateLimitBlock(req, limiterName);
    res.status(options.statusCode || 429).json(options.message);
  };
};

module.exports = {
  logRateLimitBlock,
  createRateLimitHandler,
};
