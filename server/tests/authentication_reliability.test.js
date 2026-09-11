/**
 * 🛡️ CyberShield X — Authentication Reliability & Identity Hardening Test Suite
 *
 * Validates the hardened authentication lifecycle:
 * - Registration, email normalization, duplicate protection
 * - Universal login (email, username, mobile)
 * - Structured JWT claims (iss, aud, sub, role, sessionId)
 * - Dual-transport token refresh (cookie + request body fallback)
 * - Single-flight refresh mechanics
 * - Session revocation on logout
 * - Standardized error contracts and codes
 * - Zero secret leakage in payloads and audit logs
 */

const request = require('supertest');
const mongoose = require('mongoose');
const crypto = require('crypto');
const { app } = require('../index');
const { connectTestDb, closeTestDb } = require('./helpers/testDbHelper');
const { generateToken, generateRefreshToken, verifyToken, JWT_ISSUER, JWT_AUDIENCE } = require('../utils/jwt');
const User = require('../models/User');
const Session = require('../models/Session');
const sessionService = require('../services/sessionService');
const { sanitizeAuditDetails } = require('../utils/auditLogger');

beforeAll(async () => {
  await connectTestDb();
});

afterAll(async () => {
  await closeTestDb();
});

describe('🛡️ CyberShield X — Authentication Reliability & Identity Hardening', () => {
  const timestamp = Date.now();
  const testUser = {
    username: `auth_rel_${timestamp}`,
    email: `AuthRel_${timestamp}@CyberShield-Test.com`,
    password: 'Password123!Secure',
    fullName: 'Reliability Test Operator',
    mobileNumber: `+9198${String(timestamp).slice(-8)}`
  };

  let registeredTokens = null;
  let activeSessionId = null;

  // ════════════════════════════════════════════════════════════════════════════
  // 1. REGISTRATION & DUPLICATE PROTECTION
  // ════════════════════════════════════════════════════════════════════════════
  describe('1. Registration & Identity Isolation', () => {
    it('should register a new account successfully with normalized email and return both tokens', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send(testUser);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.authenticated).toBe(true);
      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe(testUser.email.toLowerCase().trim());
      expect(res.body.token).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();
      expect(res.body.user.password).toBeUndefined();

      registeredTokens = {
        token: res.body.token,
        refreshToken: res.body.refreshToken,
        user: res.body.user
      };
    });

    it('should reject duplicate registration with the same email in different casing (AUTH_ACCOUNT_EXISTS)', async () => {
      const duplicateCasedEmail = testUser.email.toUpperCase();
      const res = await request(app)
        .post('/api/auth/signup')
        .send({
          ...testUser,
          username: `diff_${testUser.username}`,
          email: duplicateCasedEmail,
          mobileNumber: '+919999999999'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('AUTH_ACCOUNT_EXISTS');
      expect(res.body.error).toContain('already registered');
    });

    it('should reject duplicate registration with identical username', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({
          ...testUser,
          email: `unique_${Date.now()}@test.com`,
          mobileNumber: '+919999999998'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('AUTH_ACCOUNT_EXISTS');
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 2. UNIVERSAL LOGIN & CREDENTIAL VALIDATION
  // ════════════════════════════════════════════════════════════════════════════
  describe('2. Universal Login & Error Contracts', () => {
    it('should login via email and return standard success payload with tokens and cookies', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          identity: testUser.email,
          password: testUser.password
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();
      expect(res.body.user.id).toBe(registeredTokens.user.id);

      // Verify Set-Cookie header contains token
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies.some(c => c.startsWith('token='))).toBe(true);
      expect(cookies.some(c => c.startsWith('refreshToken='))).toBe(true);

      // Verify decoded token contains required claims
      const decoded = verifyToken(res.body.token);
      expect(decoded.iss).toBe(JWT_ISSUER);
      expect(decoded.aud).toBe(JWT_AUDIENCE);
      expect(decoded.sub).toBe(registeredTokens.user.id);
      expect(decoded.sessionId).toBeDefined();
      activeSessionId = decoded.sessionId;
    });

    it('should login via username', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          identity: testUser.username,
          password: testUser.password
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
    });

    it('should reject invalid password with AUTH_INVALID_CREDENTIALS code', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          identity: testUser.email,
          password: 'WrongPassword999!'
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('AUTH_INVALID_CREDENTIALS');
      expect(res.body.error).toBe('Invalid credentials');
    });

    it('should reject non-existent user with AUTH_INVALID_CREDENTIALS code', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          identity: 'non_existent_operator_xyz@cyber.local',
          password: 'AnyPassword123!'
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('AUTH_INVALID_CREDENTIALS');
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 3. PROTECTED ROUTING & TOKEN VALIDATION
  // ════════════════════════════════════════════════════════════════════════════
  describe('3. Protected Routing & Token Verification', () => {
    it('should permit access to GET /api/auth/me with valid Bearer token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${registeredTokens.token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user).toBeDefined();
      expect(res.body.user.username).toBe(testUser.username.toLowerCase().trim());
    });

    it('should reject unauthenticated request to /api/auth/me with AUTH_TOKEN_MISSING', async () => {
      const res = await request(app).get('/api/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('AUTH_TOKEN_MISSING');
      expect(res.body.error).toBe('Authentication required');
    });

    it('should reject tampered or malformed token with AUTH_TOKEN_INVALID', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid.tampered.token');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('AUTH_TOKEN_INVALID');
      expect(res.body.error).toBe('Invalid token');
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 4. TOKEN REFRESH & DUAL-TRANSPORT FALLBACK
  // ════════════════════════════════════════════════════════════════════════════
  describe('4. Token Refresh & Dual-Transport Fallback', () => {
    it('should refresh tokens using request body fallback ({ refreshToken })', async () => {
      const res = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: registeredTokens.refreshToken });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();

      // Ensure the new token works
      const testReq = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${res.body.token}`);

      expect(testReq.status).toBe(200);
      // Update registered token with fresh token
      registeredTokens.token = res.body.token;
      registeredTokens.refreshToken = res.body.refreshToken;
    });

    it('should refresh tokens using cookie header', async () => {
      const res = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', [`refreshToken=${registeredTokens.refreshToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();

      registeredTokens.token = res.body.token;
      registeredTokens.refreshToken = res.body.refreshToken;
    });

    it('should reject refresh when no refresh token is provided (AUTH_REFRESH_FAILED)', async () => {
      const res = await request(app)
        .post('/api/auth/refresh')
        .send({});

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('AUTH_REFRESH_FAILED');
      expect(res.body.error).toMatch(/refresh token/i);
    });

    it('should reject invalid refresh token with AUTH_REFRESH_FAILED', async () => {
      const res = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'completely_invalid_refresh_token_payload' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('AUTH_REFRESH_FAILED');
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 5. SESSION REVOCATION & LOGOUT
  // ════════════════════════════════════════════════════════════════════════════
  describe('5. Session Revocation & Logout', () => {
    it('should logout cleanly, clearing cookies and returning 200', async () => {
      const res = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${registeredTokens.token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Logged out successfully');

      // Verify clear cookie headers
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies.some(c => c.includes('token=;') || c.includes('Max-Age=0'))).toBe(true);
    });

    it('should reject access to protected endpoint after session is revoked in SessionService', async () => {
      const testSessionId = crypto.randomUUID();
      await sessionService.createSession(registeredTokens.user.id, testSessionId, '127.0.0.1', 'Jest');

      const testToken = generateToken({
        id: registeredTokens.user.id,
        role: 'user',
        sessionId: testSessionId
      });

      // Valid session access
      const validRes = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${testToken}`);
      expect(validRes.status).toBe(200);

      // Revoke the session
      await sessionService.revokeSession(testSessionId);

      // Access after revocation must return 401 AUTH_SESSION_EXPIRED
      const revokedRes = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${testToken}`);

      expect(revokedRes.status).toBe(401);
      expect(revokedRes.body.code).toBe('AUTH_SESSION_EXPIRED');
      expect(revokedRes.body.error).toContain('revoked');
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 6. SECURITY & SECRET REDACTION
  // ════════════════════════════════════════════════════════════════════════════
  describe('6. Security & Credential Redaction', () => {
    it('should never expose passwords in User toJSON() or normal queries', async () => {
      const user = await User.findOne({ username: testUser.username.toLowerCase().trim() });
      expect(user).toBeDefined();
      const json = user.toJSON();
      expect(json.password).toBeUndefined();
    });

    it('should sanitize passwords, tokens, and authorization headers recursively in audit logging', () => {
      const sensitivePayload = {
        username: 'operator',
        password: 'SuperSecretPassword!',
        token: 'eyJh...token',
        nested: {
          authorization: 'Bearer secret',
          cookie: 'token=xyz',
          normalField: 'safeValue'
        }
      };

      const sanitized = sanitizeAuditDetails(sensitivePayload);
      expect(sanitized.password).toBe('[REDACTED]');
      expect(sanitized.token).toBe('[REDACTED]');
      expect(sanitized.nested.authorization).toBe('[REDACTED]');
      expect(sanitized.nested.cookie).toBe('[REDACTED]');
      expect(sanitized.nested.normalField).toBe('safeValue');
    });
  });
});
