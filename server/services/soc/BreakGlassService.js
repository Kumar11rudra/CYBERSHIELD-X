/**
 * 🛡️ CyberShield X — BreakGlassService (Phase 75)
 *
 * Privileged Break-Glass Emergency Access Engine:
 * - Scoped emergency capability delegation (NO blanket admin elevation)
 * - Mandatory administrative approval gate
 * - Automatic time-bounded expiration (5-240 minutes)
 * - Immediate administrative revocation
 * - Real-time action audit and socket notification
 */

const crypto = require('crypto');
const BreakGlassSession = require('../../models/BreakGlassSession');
const AuditEvent = require('../../models/AuditEvent');
const logger = require('../../utils/logger');

class BreakGlassService {
  constructor() {
    this.io = null;
  }

  setIO(ioInstance) {
    this.io = ioInstance;
  }

  _broadcast(eventName, payload, customIO = null) {
    const io = customIO || this.io;
    if (!io) return;
    try {
      io.emit(eventName, payload);
    } catch (err) {
      logger.warn(`Failed to broadcast ${eventName}: ${err.message}`);
    }
  }

  async _recordAudit({ organizationId, actor, action, resourceId, details, outcome = 'SUCCESS' }) {
    try {
      const eventId = 'AUD-' + crypto.randomBytes(6).toString('hex');
      await AuditEvent.create({
        eventId,
        organizationId,
        actor: {
          userId: actor?.id || actor?._id || actor?.userId || 'system',
          username: actor?.username || 'SYSTEM',
          email: actor?.email || 'system@cybershield.local',
          role: actor?.role || 'OPERATOR',
          ip: actor?.ip || '127.0.0.1',
        },
        action,
        resource: {
          resourceType: 'BREAK_GLASS_SESSION',
          resourceId: String(resourceId),
          type: 'BREAK_GLASS_SESSION',
          id: String(resourceId),
        },
        outcome,
        details: details || {},
        timestamp: new Date(),
      });
      return eventId;
    } catch (err) {
      logger.warn(`BreakGlassService audit recording failed: ${err.message}`);
      return null;
    }
  }

  /**
   * Submits an emergency break-glass access request
   */
  async requestSession({
    organizationId,
    reason,
    requester,
    durationMinutes = 30,
    scope = [],
  }) {
    if (!organizationId) throw new Error('organizationId is required');
    if (!reason || reason.trim().length < 10) {
      throw new Error('A detailed operational emergency justification (min 10 characters) is required');
    }
    if (!requester || (!requester.id && !requester._id)) {
      throw new Error('Valid requester identity is required');
    }

    const duration = Math.min(Math.max(5, parseInt(durationMinutes, 10) || 30), 240);
    const sessionId = 'BG-' + crypto.randomBytes(6).toString('hex').toUpperCase();

    // Default emergency actions if none provided
    const requestedScope = Array.isArray(scope) && scope.length > 0
      ? scope
      : ['EMERGENCY_INCIDENT_ISOLATION', 'EMERGENCY_LOG_ACCESS'];

    const session = await BreakGlassSession.create({
      sessionId,
      organizationId,
      reason: reason.trim(),
      requester: {
        id: String(requester._id || requester.id),
        username: requester.username || 'REQUESTER',
        role: requester.role || 'OPERATOR',
        email: requester.email || '',
      },
      status: 'REQUESTED',
      durationMinutes: duration,
      scope: requestedScope,
    });

    await this._recordAudit({
      organizationId,
      actor: requester,
      action: 'BREAK_GLASS_REQUESTED',
      resourceId: sessionId,
      details: { durationMinutes: duration, scope: requestedScope, reason: session.reason },
    });

    return session;
  }

  /**
   * Approves and activates a break-glass emergency session (ADMIN only)
   */
  async approveSession({ sessionId, organizationId, approver, customIO = null }) {
    if (!approver || approver.role !== 'ADMIN') {
      throw new Error('UNAUTHORIZED: Break-glass activation requires explicit ADMIN approval');
    }

    const session = await BreakGlassSession.findOne({ sessionId, organizationId });
    if (!session) throw new Error(`BreakGlassSession not found: ${sessionId}`);

    if (session.status !== 'REQUESTED') {
      throw new Error(`BreakGlassSession in status '${session.status}' cannot be approved`);
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + session.durationMinutes * 60 * 1000);

    session.status = 'ACTIVE';
    session.approver = {
      id: String(approver._id || approver.id),
      username: approver.username || 'ADMIN',
      role: approver.role || 'ADMIN',
      email: approver.email || '',
    };
    session.startedAt = now;
    session.expiresAt = expiresAt;

    await session.save();

    await this._recordAudit({
      organizationId,
      actor: approver,
      action: 'BREAK_GLASS_APPROVED',
      resourceId: sessionId,
      details: {
        requester: session.requester.username,
        scope: session.scope,
        durationMinutes: session.durationMinutes,
        expiresAt,
      },
    });

    this._broadcast(
      'breakglass:started',
      {
        sessionId,
        organizationId,
        requester: session.requester.username,
        scope: session.scope,
        expiresAt,
      },
      customIO
    );

    return session;
  }

  /**
   * Immediately revokes an active or requested break-glass session
   */
  async revokeSession({ sessionId, organizationId, revoker, reason = '', customIO = null }) {
    const session = await BreakGlassSession.findOne({ sessionId, organizationId });
    if (!session) throw new Error(`BreakGlassSession not found: ${sessionId}`);

    if (session.status === 'EXPIRED' || session.status === 'REVOKED') {
      throw new Error(`Session is already ${session.status}`);
    }

    // Must be admin or the original requester
    const isRequester = String(session.requester?.id) === String(revoker?._id || revoker?.id);
    const isAdmin = revoker?.role === 'ADMIN';

    if (!isAdmin && !isRequester) {
      throw new Error('UNAUTHORIZED: Revocation requires ADMIN role or original requester identity');
    }

    session.status = 'REVOKED';
    session.revokedAt = new Date();
    session.revocationReason = reason || 'Emergency session terminated by administrator';

    await session.save();

    await this._recordAudit({
      organizationId,
      actor: revoker,
      action: 'BREAK_GLASS_REVOKED',
      resourceId: sessionId,
      details: { reason: session.revocationReason, previousStatus: session.status },
    });

    this._broadcast(
      'breakglass:revoked',
      { sessionId, organizationId, reason: session.revocationReason },
      customIO
    );

    return session;
  }

  /**
   * Validates if a user currently holds valid, scoped break-glass permission for an action.
   * Enforces immediate expiration if time window has lapsed.
   */
  async validatePrivilegedAction({ organizationId, userId, requestedAction, customIO = null }) {
    if (!organizationId || !userId || !requestedAction) {
      return { allowed: false, reason: 'INVALID_PARAMETERS' };
    }

    // Find active session for this user
    const session = await BreakGlassSession.findOne({
      organizationId,
      'requester.id': String(userId),
      status: 'ACTIVE',
    });

    if (!session) {
      return { allowed: false, reason: 'NO_ACTIVE_BREAK_GLASS_SESSION' };
    }

    const now = new Date();

    // Check expiration
    if (session.expiresAt && session.expiresAt <= now) {
      session.status = 'EXPIRED';
      await session.save();

      this._broadcast(
        'breakglass:expired',
        { sessionId: session.sessionId, organizationId, expiredAt: session.expiresAt },
        customIO
      );

      return { allowed: false, reason: 'BREAK_GLASS_SESSION_EXPIRED', sessionId: session.sessionId };
    }

    // Check scope
    if (!session.scope.includes(requestedAction) && !session.scope.includes('*')) {
      return {
        allowed: false,
        reason: 'ACTION_NOT_IN_APPROVED_SCOPE',
        sessionId: session.sessionId,
        approvedScope: session.scope,
      };
    }

    return {
      allowed: true,
      sessionId: session.sessionId,
      scope: session.scope,
      expiresAt: session.expiresAt,
    };
  }

  /**
   * Records an audited action performed under an active break-glass session
   */
  async recordAction({ sessionId, action, target = '', auditEventId = null, status = 'SUCCESS' }) {
    const session = await BreakGlassSession.findOne({ sessionId });
    if (!session) return null;

    session.actionsTaken.push({
      action,
      target,
      timestamp: new Date(),
      status,
      auditEventId,
    });

    if (auditEventId && !session.auditReferences.includes(auditEventId)) {
      session.auditReferences.push(auditEventId);
    }

    await session.save();
    return session;
  }

  /**
   * Lists break-glass sessions with automatic lazy expiration update
   */
  async listSessions(organizationId, filter = {}) {
    const query = { organizationId };
    if (filter.status) query.status = filter.status;

    const sessions = await BreakGlassSession.find(query).sort({ createdAt: -1 });

    const now = new Date();
    // Lazy expire any active sessions whose time has passed
    for (const s of sessions) {
      if (s.status === 'ACTIVE' && s.expiresAt && s.expiresAt <= now) {
        s.status = 'EXPIRED';
        await s.save();
      }
    }

    return sessions;
  }

  /**
   * Returns currently active sessions
   */
  async getActiveSessions(organizationId) {
    const now = new Date();
    const sessions = await BreakGlassSession.find({
      organizationId,
      status: 'ACTIVE',
      expiresAt: { $gt: now },
    }).sort({ startedAt: -1 });

    return sessions;
  }
}

module.exports = new BreakGlassService();
