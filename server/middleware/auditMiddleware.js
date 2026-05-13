const ActivityLog = require('../models/ActivityLog');

/**
 * auditMiddleware - Logs security-relevant events to the ActivityLog
 * @param {string} eventCategory - e.g., 'AUTH', 'SCAN', 'SECURITY'
 */
const auditLog = (eventCategory) => {
  return async (req, res, next) => {
    const originalJson = res.json;
    
    // Override res.json to capture the response and log it
    res.json = function (data) {
      const logEntry = {
        userId: req.user ? req.user.id : null,
        type: eventCategory,
        action: req.method + ' ' + req.originalUrl,
        status: res.statusCode >= 400 ? 'FAILED' : 'SUCCESS',
        metadata: {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          path: req.originalUrl,
          method: req.method,
          statusCode: res.statusCode,
          compromised: res.statusCode >= 400
        },
        timestamp: new Date()
      };

      // Fire and forget logging to avoid blocking the response
      ActivityLog.create(logEntry).catch(err => console.error('Audit Log Error:', err));

      return originalJson.call(this, data);
    };

    next();
  };
};

module.exports = auditLog;
