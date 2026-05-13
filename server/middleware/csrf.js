const logger = require('../utils/logger');

const csrfProtection = (req, res, next) => {
  // Allow safe methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  const origin = req.headers.origin || req.headers.referer;
  const allowedOrigins = [
    process.env.CLIENT_URL,
    process.env.ALT_CLIENT_URL,
    'http://localhost:3000',
    'http://127.0.0.1:3000'
  ].filter(Boolean);

  if (!origin) {
    logger.warn(`[SECURITY] CSRF blocked: Missing origin/referer for ${req.method} ${req.url}`);
    return res.status(403).json({ error: 'CSRF protection: Missing origin' });
  }

  const originUrl = new URL(origin);
  const isAllowed = allowedOrigins.some(allowed => {
    const allowedUrl = new URL(allowed);
    return originUrl.host === allowedUrl.host;
  });

  if (!isAllowed) {
    logger.warn(`[SECURITY] CSRF blocked: Invalid origin ${origin} for ${req.method} ${req.url}`);
    return res.status(403).json({ error: 'CSRF protection: Invalid origin' });
  }

  next();
};

module.exports = { csrfProtection };
