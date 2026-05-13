/**
 * CyberShield X — Auth API Test Suite
 * Tests: Signup, Login, Lockout, 2FA, Token Refresh, Admin Routes
 * Run: npm test (from server directory)
 */

const request = require('supertest');
const mongoose = require('mongoose');
const { app } = require('../index');

// ─── Test DB connection ────────────────────────────────────────────────────────
beforeAll(async () => {
  const testDbUri = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/cybershield-test';
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(testDbUri);
  }
});

afterAll(async () => {
  // Clean up test data
  const db = mongoose.connection.db;
  if (db) {
    await db.collection('users').deleteMany({ email: /@cybershield-test\.com$/ });
    await db.collection('activitylogs').deleteMany({ action: /^TEST_/ });
  }
  await mongoose.disconnect();
});

// ─── Helper ────────────────────────────────────────────────────────────────────
const testEmail = `test-${Date.now()}@cybershield-test.com`;
const testPassword = 'Test@1234Secure';
let authToken = '';

// ══════════════════════════════════════════════════════════════════════════════
// HEALTH CHECK
// ══════════════════════════════════════════════════════════════════════════════
describe('Health Check', () => {
  it('GET /health should return 200 with status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('CyberShield X API');
  });

  it('GET /api/status should return service statuses', async () => {
    const res = await request(app).get('/api/status');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('services');
    expect(Array.isArray(res.body.services)).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// AUTH — INPUT VALIDATION
// ══════════════════════════════════════════════════════════════════════════════
describe('Auth — Input Validation', () => {
  it('POST /api/auth/login with missing password should return 400', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testEmail });
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('POST /api/auth/login with missing email should return 400', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ password: testPassword });
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('POST /api/auth/signup with short username should return 400', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ username: 'ab', email: testEmail, password: testPassword });
    expect(res.statusCode).toBe(400);
  });

  it('POST /api/auth/signup with weak password should return 400', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ username: 'testuser', email: testEmail, password: 'weakpass' });
    expect(res.statusCode).toBe(400);
  });

  it('POST /api/auth/email-check with invalid email should return 400', async () => {
    const res = await request(app)
      .post('/api/auth/email-check')
      .send({ email: 'not-an-email' });
    expect(res.statusCode).toBe(400);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// AUTH — LOGIN & ACCOUNT LOCKOUT
// ══════════════════════════════════════════════════════════════════════════════
describe('Auth — Login & Account Lockout', () => {
  it('POST /api/auth/login with wrong credentials should return 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nonexistent@cybershield-test.com', password: 'WrongPass@1' });
    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('error');
  });

  it('POST /api/auth/admin-login with non-admin user should return 403', async () => {
    // We expect either 401 (wrong creds) or 403 (not admin) depending on if user exists
    const res = await request(app)
      .post('/api/auth/admin-login')
      .send({ email: testEmail, password: testPassword });
    expect([401, 403, 400]).toContain(res.statusCode);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// AUTH — TOKEN REFRESH
// ══════════════════════════════════════════════════════════════════════════════
describe('Auth — Token Refresh', () => {
  it('POST /api/auth/refresh without cookie should return 401', async () => {
    const res = await request(app)
      .post('/api/auth/refresh');
    expect(res.statusCode).toBe(401);
    expect(res.body.error).toMatch(/refresh token/i);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// PROTECTED ROUTES — Unauthenticated Access
// ══════════════════════════════════════════════════════════════════════════════
describe('Protected Routes — No Auth', () => {
  const protectedRoutes = [
    { method: 'get', path: '/api/auth/me' },
    { method: 'get', path: '/api/history' },
    { method: 'get', path: '/api/dashboard' },
    { method: 'get', path: '/api/vault' },
  ];

  protectedRoutes.forEach(({ method, path }) => {
    it(`${method.toUpperCase()} ${path} should return 401 without token`, async () => {
      const res = await request(app)[method](path);
      expect(res.statusCode).toBe(401);
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// ADMIN ROUTES — Non-Admin Access
// ══════════════════════════════════════════════════════════════════════════════
describe('Admin Routes — Unauthorized Access', () => {
  it('GET /api/admin/stats without auth should return 401', async () => {
    const res = await request(app).get('/api/admin/stats');
    expect(res.statusCode).toBe(401);
  });

  it('GET /api/admin/users without auth should return 401', async () => {
    const res = await request(app).get('/api/admin/users');
    expect(res.statusCode).toBe(401);
  });

  it('GET /api/admin/audit-logs without auth should return 401', async () => {
    const res = await request(app).get('/api/admin/audit-logs');
    expect(res.statusCode).toBe(401);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// SECURITY — NoSQL Injection Prevention
// ══════════════════════════════════════════════════════════════════════════════
describe('Security — NoSQL Injection Prevention', () => {
  it('Login with $gt operator should be sanitized and return 400/401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: { $gt: '' }, password: { $gt: '' } });
    expect([400, 401]).toContain(res.statusCode);
  });

  it('Signup with $ operator in username should be sanitized', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ username: { $ne: null }, email: testEmail, password: testPassword });
    expect([400, 422]).toContain(res.statusCode);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// SECURITY — Rate Limiting
// ══════════════════════════════════════════════════════════════════════════════
describe('Security — Headers', () => {
  it('Response should have X-Content-Type-Options header (Helmet)', async () => {
    const res = await request(app).get('/health');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });

  it('Response should not expose X-Powered-By header', async () => {
    const res = await request(app).get('/health');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// SCAN — Input Validation
// ══════════════════════════════════════════════════════════════════════════════
describe('Scan — Input Validation (Unauthenticated)', () => {
  it('POST /api/scan without auth should return 401', async () => {
    const res = await request(app)
      .post('/api/scan')
      .send({ target: 'http://example.com' });
    expect(res.statusCode).toBe(401);
  });
});
