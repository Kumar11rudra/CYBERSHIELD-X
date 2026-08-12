/**
 * CyberShield X — Phase 17 Security Hardening Test Suite
 * Tests: Public Access, Direct Activation, IDOR Prevention, Redirect Security, and SSRF loopback hardening.
 */

const request = require('supertest');
const mongoose = require('mongoose');
const { app } = require('../../index');
const User = require('../../models/User');
const Scan = require('../../models/Scan');
const Organization = require('../../models/Organization');
const Membership = require('../../models/Membership');
const { isPrivateOrLoopback } = require('../../controllers/toolsController');

// ─── Test DB connection ────────────────────────────────────────────────────────
beforeAll(async () => {
  const testDbUri = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/cybershield-test';
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(testDbUri);
  }
});

afterAll(async () => {
  // Clean up database records
  const db = mongoose.connection.db;
  if (db) {
    await db.collection('users').deleteMany({ email: /@cybershield-test-hardened\.com$/ });
    await db.collection('scans').deleteMany({ target: 'cybershield-test-target.com' });
    await db.collection('organizations').deleteMany({ name: 'Test Org Hardened' });
    await db.collection('memberships').deleteMany({});
  }
  await mongoose.disconnect();
});

// ─── Helper redirect validation ────────────────────────────────────────────────
const getSafeReturnUrl = (url) => {
  if (!url) return '/dashboard';
  if (url.startsWith('/') && !url.startsWith('//')) {
    return url;
  }
  return '/dashboard';
};

describe('Phase 17 — Authentication & Hardening Gates', () => {
  const uniqueId = Date.now();
  const testUserEmail = `user-${uniqueId}@cybershield-test-hardened.com`;
  const testUsername = `user_${uniqueId}`;
  const testPassword = 'Test@1234Secure';
  const testMobile = '+919876543210';
  let userToken = '';
  let userId = '';
  let secondUserId = '';
  let otherUserToken = '';
  let scanId = '';
  let orgId = '';

  // 1. SIGNUP & DIRECT ACTIVATION
  it('POST /api/auth/signup should register directly to active status without OTP', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({
        username: testUsername,
        email: testUserEmail,
        password: testPassword,
        mobileNumber: testMobile,
        fullName: 'Hardened Operator'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.authenticated).toBe(true);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.status).toBe('active');

    userToken = res.body.token;
    userId = res.body.user.id;
  });

  // 2. ENUMERATION RESISTANCE
  it('POST /api/auth/signup duplicate keys must return generic error', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({
        username: testUsername,
        email: testUserEmail,
        password: testPassword,
        mobileNumber: testMobile,
        fullName: 'Hardened Operator'
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('Username, email, or mobile number is already registered.');
  });

  // 3. SECURE LOGIN
  it('POST /api/auth/login succeeds with correct password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUserEmail,
        password: testPassword
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body).toHaveProperty('token');
  });

  it('POST /api/auth/login fails generically on bad password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUserEmail,
        password: 'WrongPassword123'
      });

    expect(res.statusCode).toBe(401);
    expect(res.body.error).toBe('Invalid credentials');
  });

  // 4. GUEST / PUBLIC ACCESS
  it('POST /api/scan is accessible anonymously (returns 400 for validation instead of 401)', async () => {
    const res = await request(app)
      .post('/api/scan')
      .send({}); // Missing target fails validators instead of auth

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('Validation failed');
  });

  // 5. REPORT DOWNLOAD GATE & IDOR PREVENTION
  it('GET /api/reports/generate-pdf/:scanId blocks anonymous request with 401', async () => {
    const fakeScanId = new mongoose.Types.ObjectId();
    const res = await request(app).get(`/api/reports/generate-pdf/${fakeScanId}`);
    expect(res.statusCode).toBe(401);
  });

  it('GET /api/reports/generate-pdf/:scanId blocks non-existent scan with 404', async () => {
    const fakeScanId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .get(`/api/reports/generate-pdf/${fakeScanId}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(404);
  });

  it('GET /api/reports/generate-pdf/:scanId verifies ownership and prevents IDOR (403)', async () => {
    // 5a. Register a second user to test cross-user access
    const secondUserRes = await request(app)
      .post('/api/auth/signup')
      .send({
        username: `${testUsername}x`,
        email: `x-${testUserEmail}`,
        password: testPassword,
        mobileNumber: `${testMobile}0`,
        fullName: 'Second Operator'
      });
    otherUserToken = secondUserRes.body.token;
    secondUserId = secondUserRes.body.user.id;

    // 5b. Establish mock organization and membership roles for both users
    const org = await Organization.create({
      name: 'Test Org Hardened',
      slug: `test-org-hardened-${uniqueId}`,
      ownerId: new mongoose.Types.ObjectId(userId),
      tenantType: 'enterprise',
      status: 'active'
    });
    orgId = org._id;

    await Membership.create({
      organizationId: orgId,
      userId: new mongoose.Types.ObjectId(userId),
      role: 'owner',
      status: 'active'
    });

    await Membership.create({
      organizationId: orgId,
      userId: new mongoose.Types.ObjectId(secondUserId),
      role: 'viewer',
      status: 'active'
    });

    // 5c. Create a scan result belonging to the first user
    const dbScan = await Scan.create({
      userId: new mongoose.Types.ObjectId(userId),
      organizationId: orgId,
      target: 'cybershield-test-target.com',
      targetType: 'domain',
      threatScore: 0,
      riskLevel: 'safe',
      status: 'completed'
    });
    scanId = dbScan._id;

    // 5d. Access using first user token (Success)
    const successRes = await request(app)
      .get(`/api/reports/generate-pdf/${scanId}`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(successRes.statusCode).toBe(200);

    // 5e. Access using second user token (403 Forbidden IDOR Block)
    const idorRes = await request(app)
      .get(`/api/reports/generate-pdf/${scanId}`)
      .set('Authorization', `Bearer ${otherUserToken}`);
    expect(idorRes.statusCode).toBe(403);
    expect(idorRes.body.error).toBe('You are not authorized to download this report.');
  });
});

describe('Phase 17 — Redirection & Input Validation Hardening', () => {
  // 1. SAFE RETURN PATHS
  it('Redirection path validation allows relative URLs and blocks open redirects', () => {
    expect(getSafeReturnUrl('/dashboard')).toBe('/dashboard');
    expect(getSafeReturnUrl('/tool/dns/result/123')).toBe('/tool/dns/result/123');
    expect(getSafeReturnUrl('//evil.com')).toBe('/dashboard');
    expect(getSafeReturnUrl('https://evil.com')).toBe('/dashboard');
    expect(getSafeReturnUrl('javascript:alert(1)')).toBe('/dashboard');
  });

  // 2. SSRF TARGET HARDENING
  it('isPrivateOrLoopback blocks private IPs, loopback domains, cloud metadata, and URL port bypasses', async () => {
    // Basic loopbacks
    await expect(isPrivateOrLoopback('localhost')).resolves.toBe(true);
    await expect(isPrivateOrLoopback('127.0.0.1')).resolves.toBe(true);
    
    // Cloud metadata targets
    await expect(isPrivateOrLoopback('169.254.169.254')).resolves.toBe(true);
    await expect(isPrivateOrLoopback('metadata.google.internal')).resolves.toBe(true);
    
    // URL variants
    await expect(isPrivateOrLoopback('http://localhost')).resolves.toBe(true);
    await expect(isPrivateOrLoopback('http://127.0.0.1:8080/path')).resolves.toBe(true);
    await expect(isPrivateOrLoopback('//127.0.0.1')).resolves.toBe(true);

    // Ports stripping
    await expect(isPrivateOrLoopback('127.0.0.1:80')).resolves.toBe(true);

    // Valid public domains should pass (returns false)
    await expect(isPrivateOrLoopback('google.com')).resolves.toBe(false);
  });
});
