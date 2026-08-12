const crypto = require('crypto');
const mongoose = require('mongoose');
const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');
const SystemSettings = require('../models/SystemSettings');

const resolveUser = async (id) => {
  try {
    const { getAuthModule } = require('../services/authComposition');
    const authModule = getAuthModule();
    if (authModule && authModule.userRepo) {
      const user = await authModule.userRepo.findById(id);
      if (user) return user;
    }
  } catch {}
  return await User.findById(id).select('-password');
};

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

    // Enforce session revocation verification
    if (decoded.sessionId) {
      const sessionService = require('../services/sessionService');
      const isSessionValid = await sessionService.isValid(decoded.sessionId);
      if (!isSessionValid) {
        return res.status(401).json({ error: 'Session has been revoked. Please re-authenticate.', code: 'SESSION_REVOKED' });
      }
    }

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

    const user = await resolveUser(decoded.id);
    if (!user) {
      return res.status(401).json({ error: 'User not found or no longer exists' });
    }

    // ─── BANNED USER CHECK ─────────────────────────────────────────────────────
    if (user.isBanned) {
      return res.status(403).json({
        error: 'Your account has been suspended. Please contact support.',
        code: 'ACCOUNT_BANNED',
      });
    }

    req.user = user;
    req.sessionId = decoded.sessionId;
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
    if (decoded.sessionId) {
      const sessionService = require('../services/sessionService');
      const isSessionValid = await sessionService.isValid(decoded.sessionId);
      if (!isSessionValid) {
        req.user = null;
        return next();
      }
    }
    const user = await resolveUser(decoded.id);
    // Set to null if banned or not found
    req.user = (user && !user.isBanned) ? user : null;
    next();
  } catch {
    req.user = null;
    next();
  }
};

// ─── RBAC Middleware Factories ────────────────────────────────────────────────
const getAuthorizationService = () => {
  const { storageManager, eventPublisher, activeStorageProvider, permissionManager, capabilityResolver } = require('../controllers/chatbot/chatbotController');
  const { getAuthModule } = require('../services/authComposition');
  const { authorizationService } = getAuthModule({ storageManager, eventPublisher, activeStorageProvider, permissionManager, capabilityResolver });
  return authorizationService;
};

const getCapabilityAuthorizationService = () => {
  const { storageManager, eventPublisher, activeStorageProvider, permissionManager, capabilityResolver } = require('../controllers/chatbot/chatbotController');
  const { getAuthModule } = require('../services/authComposition');
  const { capabilityAuthorizationService } = getAuthModule({ storageManager, eventPublisher, activeStorageProvider, permissionManager, capabilityResolver });
  return capabilityAuthorizationService;
};

const requireRole = (role) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const authorizationService = getAuthorizationService();
    const result = await authorizationService.authorize({
      userId: req.user._id || req.user.id,
      requiredRole: role,
      action: 'access_route'
    }, req.user, { ip: req.ip });

    if (!result.isGranted) {
      const errorMsg = role === 'admin' ? 'Admin access required' : (result.reason || 'Access denied');
      return res.status(403).json({ error: errorMsg });
    }
    next();
  };
};

const requirePermission = (permission) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const authorizationService = getAuthorizationService();
    const result = await authorizationService.authorize({
      userId: req.user._id || req.user.id,
      requiredPermission: permission,
      action: 'access_route'
    }, req.user, { ip: req.ip });

    if (!result.isGranted) {
      return res.status(403).json({ error: result.reason || 'Access denied' });
    }
    next();
  };
};

const requireCapability = (capabilitySource) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const capAuthService = getCapabilityAuthorizationService();
    const CapabilityExecutionContext = require('../services/runtime/dto/CapabilityExecutionContext');
    
    const capabilityId = typeof capabilitySource === 'function' ? capabilitySource(req) : capabilitySource;

    if (!capabilityId) {
      return res.status(400).json({ error: 'Capability ID is required' });
    }

    const context = new CapabilityExecutionContext({
      userId: req.user._id || req.user.id,
      capabilityId: capabilityId,
      parameters: req.body || {},
      environment: { ip: req.ip }
    });

    const result = await capAuthService.authorizeExecution(context, req.user);

    if (!result.isGranted) {
      return res.status(403).json({ error: result.reason || 'Capability access denied' });
    }
    next();
  };
};

// ─── IP Firewall: Enforce globally blocked IPs ─────────────────────────────────
const ipFirewall = async (req, res, next) => {
  try {
    // Get real IP (account for proxies)
    const clientIP = req.ip || req.connection?.remoteAddress || '';
    
    // Skip for health check and status (avoid DB call on monitoring pings)
    if (req.path === '/health' || req.path === '/api/status' || req.path === '/api/admin/system-health' || req.path.startsWith('/api/admin/deployments')) return next();
    if (mongoose.connection.readyState !== 1) return next();

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

const requireAdmin = requireRole('admin');
module.exports = { authenticate, tryAuthenticate, requireRole, requirePermission, requireCapability, ipFirewall, requireAdmin };

