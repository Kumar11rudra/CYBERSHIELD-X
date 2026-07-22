const crypto = require('crypto');
const Session = require('../models/Session');
const cache = require('../utils/cache');

const hashSessionId = (sessionId) => {
  return crypto.createHash('sha256').update(String(sessionId)).digest('hex');
};

class SessionService {
  async createSession(userId, sessionId, ipAddress, userAgent, maxAgeMs = 7 * 24 * 60 * 60 * 1000) {
    const tokenHash = hashSessionId(sessionId);
    const expiresAt = new Date(Date.now() + maxAgeMs);

    const session = await Session.create({
      userId,
      tokenHash,
      ipAddress,
      userAgent,
      expiresAt,
    });

    // Cache session state: isRevoked = false
    const cacheKey = `session:${tokenHash}`;
    await cache.set(cacheKey, { isRevoked: false, userId: String(userId) }, maxAgeMs / 1000);

    return session;
  }

  async isValid(sessionId) {
    if (!sessionId) return false;
    const tokenHash = hashSessionId(sessionId);
    const cacheKey = `session:${tokenHash}`;

    // Read from cache first to avoid DB hits
    const cached = await cache.get(cacheKey);
    if (cached !== undefined && cached !== null) {
      return !cached.isRevoked;
    }

    // Fallback to database query
    const session = await Session.findOne({ tokenHash });
    if (!session) return false;

    // Cache the query result
    const ttlSeconds = Math.max(0, Math.ceil((new Date(session.expiresAt) - new Date()) / 1000));
    await cache.set(cacheKey, { isRevoked: session.isRevoked, userId: String(session.userId) }, ttlSeconds);

    return !session.isRevoked;
  }

  async revokeSession(sessionId) {
    if (!sessionId) return false;
    const tokenHash = hashSessionId(sessionId);
    const cacheKey = `session:${tokenHash}`;

    await Session.updateOne({ tokenHash }, { isRevoked: true });

    // Cache the revoked status for 24h to avoid DB lookups on rejected requests
    await cache.set(cacheKey, { isRevoked: true }, 24 * 3600);
    return true;
  }

  async revokeAllUserSessions(userId, exceptSessionId = null) {
    const query = { userId, isRevoked: false };
    if (exceptSessionId) {
      query.tokenHash = { $ne: hashSessionId(exceptSessionId) };
    }

    const activeSessions = await Session.find(query).select('tokenHash');
    await Session.updateMany(query, { isRevoked: true });

    // Update cache status for all revoked sessions
    for (const session of activeSessions) {
      const cacheKey = `session:${session.tokenHash}`;
      await cache.set(cacheKey, { isRevoked: true, userId: String(userId) }, 24 * 3600);
    }
    return true;
  }

  async getUserActiveSessions(userId) {
    return Session.find({ userId, isRevoked: false, expiresAt: { $gt: new Date() } })
      .select('tokenHash ipAddress userAgent createdAt')
      .sort({ createdAt: -1 });
  }
}

module.exports = new SessionService();
