const crypto = require('crypto');
const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');
const SystemSettings = require('../models/SystemSettings');

// ─── Authenticate: Verify token + check banned status ─────────────────────────
const authenticate = async (req, res, next) => {
  try {
    let token = req.cookies?.token;
    
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      }
    }

    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = verifyToken(token);

    // ─── #11: Session Fingerprinting (Anti-Hijacking) ─────────────────────────
    if (decoded.fingerprintHash) {
      const nexusToken = req.headers['x-nexus-session-token'];
      const isSafeMethod = ['get', 'head', 'options'].includes(req.method.toLowerCase());
      
      if (!nexusToken && !isSafeMethod) {
        return res.status(401).json({ error: 'Session fingerprint missing. Please re-authenticate.' });
      }
      
      if (nexusToken) {
        const currentHash = crypto.createHash('sha256').update(nexusToken).digest('hex');
        if (currentHash !== decoded.fingerprintHash) {
          console.warn(`[SECURITY] Session Hijacking Attempt? Token fingerprint mismatch for user ${decoded.id}`);
          return res.status(401).json({ error: 'Session context mismatch. Please re-authenticate.' });
        }
      }
    }

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // ─── BANNED USER CHECK ─────────────────────────────────────────────────────
    if (user.isBanned) {
      return res.status(403).json({
        error: 'Your account has been suspended. Please contact support.',
        code: 'ACCOUNT_BANNED',
      });
    }

    req.user = user;
    // ─── RED TEAM HARDENING: Session Tamper Detection ───────────────────────
    const currentFingerprint = crypto.createHash('sha256').update(req.get('User-Agent') + req.ip).digest('hex');
    
    // In a production scenario, we'd compare this against the stored session fingerprint
    // For now, we log any suspicious variance in the audit logs
    if (req.user.lastFingerprint && req.user.lastFingerprint !== currentFingerprint) {
      logger.warn(`[TAMPER ALERT] Session mismatch for user ${req.user._id}. Possible Hijack attempt from ${req.ip}`);
      await ActivityLog.create({
        userId: req.user._id,
        action: 'SESSION_TAMPER_DETECTED',
        status: 'warning',
        metadata: { ip: req.ip, userAgent: req.get('User-Agent'), details: 'Fingerprint mismatch detected' }
      });
    }

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' });
    }
    next(error);
  }
};

// ─── Try Authenticate: Optional auth (doesn't fail if no token) ───────────────
const tryAuthenticate = async (req, res, next) => {
  try {
    let token = req.cookies?.token;
    
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      }
    }

    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = verifyToken(token);
    const user = await User.findById(decoded.id).select('-password');
    // Set to null if banned or not found
    req.user = (user && !user.isBanned) ? user : null;
    next();
  } catch {
    req.user = null;
    next();
  }
};

// ─── Require Admin Role ────────────────────────────────────────────────────────
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// ─── IP Firewall: Enforce globally blocked IPs ─────────────────────────────────
const ipFirewall = async (req, res, next) => {
  try {
    // Get real IP (account for proxies)
    const clientIP = req.ip || req.connection?.remoteAddress || '';
    
    // Skip for health check and status (avoid DB call on monitoring pings)
    if (req.path === '/health' || req.path === '/api/status') return next();

    const settings = await SystemSettings.findById('global').select('blockedIPs').lean();
    const blockedIPs = settings?.blockedIPs || [];

    if (blockedIPs.includes(clientIP)) {
      console.warn(`[FIREWALL] Blocked request from IP: ${clientIP} → ${req.path}`);
      return res.status(403).json({
        error: 'Access denied. Your IP address has been blocked.',
        code: 'IP_BLOCKED',
      });
    }
    next();
  } catch (err) {
    // Don't fail the request if firewall lookup fails — fail open safely
    console.error('[FIREWALL ERROR]', err.message);
    next();
  }
};

module.exports = { authenticate, tryAuthenticate, requireAdmin, ipFirewall };

