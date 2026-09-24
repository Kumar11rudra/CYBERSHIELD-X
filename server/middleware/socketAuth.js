'use strict';

/**
 * 🛡️ CyberShield X — Socket.IO Canonical Authentication & Tenant Room Middleware
 *
 * Implements authoritative identity verification and tenant isolation for Socket.IO:
 * 1. Reuses canonical verifyToken() (server/utils/jwt.js).
 * 2. Reuses canonical session-revocation checks (server/services/sessionService.js).
 * 3. Resolves the authenticated User from the verified identity.
 * 4. Rejects missing, invalid, or expired authentication.
 * 5. Rejects banned or suspended accounts.
 * 6. Resolves authoritative organization membership using existing Membership architecture.
 * 7. Strictly rejects client-supplied organizationId if user is not an active member (TENANT_MISMATCH).
 * 8. Resolves default membership when no organizationId is provided.
 * 9. Attaches only verified values to socket.user, socket.organizationId, and socket.membership.
 * 10. Strictly forbids logging of tokens, cookies, secrets, or authorization headers.
 */

const mongoose = require('mongoose');
const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');
const Membership = require('../models/Membership');
const logger = require('../utils/logger');

/**
 * Resolves a User document via authComposition if available, falling back to User model.
 * Matches canonical auth.js resolution pattern.
 *
 * @param {string|mongoose.Types.ObjectId} id
 * @returns {Promise<object|null>}
 */
const resolveUser = async (id) => {
  try {
    const { getAuthModule } = require('../services/authComposition');
    const authModule = getAuthModule();
    if (authModule && authModule.userRepo) {
      const user = await authModule.userRepo.findById(id);
      if (user) return user;
    }
  } catch {
    // Graceful fallback to Mongoose User model
  }
  return await User.findById(id).select('-password');
};

/**
 * Extracts the authentication token from socket handshake without logging secrets.
 *
 * @param {object} handshake - socket.handshake
 * @returns {string|null}
 */
const extractToken = (handshake) => {
  if (!handshake) return null;

  // 1. Check handshake.auth.token
  if (handshake.auth && typeof handshake.auth.token === 'string') {
    const t = handshake.auth.token.trim();
    if (t) return t.startsWith('Bearer ') ? t.slice(7).trim() : t;
  }

  // 2. Check HTTP Authorization header
  if (handshake.headers && typeof handshake.headers.authorization === 'string') {
    const authHeader = handshake.headers.authorization.trim();
    if (authHeader.startsWith('Bearer ')) {
      const t = authHeader.slice(7).trim();
      if (t) return t;
    }
  }

  // 3. Check Cookie header (token=<jwt>)
  if (handshake.headers && typeof handshake.headers.cookie === 'string') {
    const match = handshake.headers.cookie.match(/(?:^|;\s*)token=([^;]+)/);
    if (match && match[1]) {
      try {
        return decodeURIComponent(match[1].trim());
      } catch {
        return match[1].trim();
      }
    }
  }

  return null;
};

/**
 * Socket.IO authentication and tenant isolation middleware.
 *
 * @param {import('socket.io').Socket} socket
 * @param {function} next
 */
const socketAuth = async (socket, next) => {
  try {
    // 1. Extract token
    const token = extractToken(socket.handshake);
    if (!token) {
      const err = new Error('Authentication required: Token missing');
      err.data = { code: 'AUTH_TOKEN_MISSING' };
      return next(err);
    }

    // 2. Verify JWT token using canonical verifyToken
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (jwtErr) {
      const isExpired = jwtErr.name === 'TokenExpiredError';
      const err = new Error(
        isExpired ? 'Authentication failed: Token expired' : 'Authentication failed: Invalid token'
      );
      err.data = { code: isExpired ? 'AUTH_SESSION_EXPIRED' : 'AUTH_TOKEN_INVALID' };
      return next(err);
    }

    const userId = decoded.id || decoded.sub;
    if (!userId) {
      const err = new Error('Authentication failed: Invalid token payload');
      err.data = { code: 'AUTH_TOKEN_INVALID' };
      return next(err);
    }

    // 3. Enforce session revocation verification if sessionId is present
    if (decoded.sessionId) {
      try {
        const sessionService = require('../services/sessionService');
        const isSessionValid = await sessionService.isValid(decoded.sessionId);
        if (!isSessionValid) {
          const err = new Error('Authentication failed: Session expired or revoked');
          err.data = { code: 'AUTH_SESSION_EXPIRED' };
          return next(err);
        }
      } catch (sessionErr) {
        logger.warn(`[SOCKET-AUTH] Session verification error: ${sessionErr.message}`);
        const err = new Error('Authentication failed: Session expired or revoked');
        err.data = { code: 'AUTH_SESSION_EXPIRED' };
        return next(err);
      }
    }

    // 4. Resolve User and verify active status
    const user = await resolveUser(userId);
    if (!user) {
      const err = new Error('Authentication failed: User not found or no longer exists');
      err.data = { code: 'AUTH_UNAUTHORIZED' };
      return next(err);
    }

    // Reject banned or suspended users using canonical model fields
    if (user.isBanned || user.status === 'suspended') {
      const err = new Error('Authentication failed: Account disabled or suspended');
      err.data = { code: 'AUTH_ACCOUNT_DISABLED' };
      return next(err);
    }

    // 5. Resolve Authoritative Organization Membership
    const requestedOrgId =
      socket.handshake?.auth?.organizationId ||
      socket.handshake?.headers?.['x-organization-id'] ||
      socket.handshake?.query?.orgId ||
      null;

    let authoritativeOrgId = null;
    let authoritativeMembership = null;

    if (requestedOrgId) {
      if (!mongoose.Types.ObjectId.isValid(requestedOrgId)) {
        const err = new Error('Tenant isolation violation: Invalid organization identifier');
        err.data = { code: 'TENANT_MISMATCH' };
        return next(err);
      }

      // Verify membership against the authenticated user (NEVER trust client selection alone)
      const membership = await Membership.findOne({
        organizationId: requestedOrgId,
        userId: user._id,
      });

      if (!membership) {
        const err = new Error('Tenant isolation violation: Not an authorized member of requested organization');
        err.data = { code: 'TENANT_MISMATCH' };
        return next(err);
      }

      authoritativeOrgId = requestedOrgId.toString();
      authoritativeMembership = membership;
    } else {
      // Resolve user's established default membership
      const defaultMembership = await Membership.findOne({ userId: user._id }).sort({ createdAt: 1 });
      if (!defaultMembership) {
        const err = new Error('Tenant context missing: User has no active organization membership');
        err.data = { code: 'NO_ACTIVE_MEMBERSHIP' };
        return next(err);
      }

      authoritativeOrgId = defaultMembership.organizationId.toString();
      authoritativeMembership = defaultMembership;
    }

    // 6. Attach only verified values to socket
    socket.user = user;
    socket.organizationId = authoritativeOrgId;
    socket.membership = authoritativeMembership;

    return next();
  } catch (error) {
    logger.error(`[SOCKET-AUTH] Internal authentication error during socket handshake: ${error.message}`);
    const err = new Error('Internal authentication error during socket handshake');
    err.data = { code: 'AUTH_INTERNAL_ERROR' };
    return next(err);
  }
};

module.exports = socketAuth;
module.exports.socketAuth = socketAuth;
module.exports.extractToken = extractToken;
