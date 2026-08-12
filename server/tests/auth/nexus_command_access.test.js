// Set test secrets before loading app modules
process.env.JWT_SECRET = process.env.JWT_SECRET || 'a_very_long_test_secret_that_is_at_least_64_characters_long_for_security_12345678901234567890';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'a_very_long_test_refresh_secret_that_is_at_least_64_characters_long_1234567890';

const request = require('supertest');
const mongoose = require('mongoose');
const express = require('express');
const cookieParser = require('cookie-parser');
const User = require('../../models/User');
const authRoutes = require('../../routes/auth');
const seedAdmin = require('../../scripts/seedAdmin');

describe('Nexus Command & Founder Admin Access Flow Security Audit', () => {
  let app;

  beforeAll(async () => {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cybershield';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }

    app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.use('/api/auth', authRoutes);

    await User.deleteMany({
      $or: [
        { role: 'admin' },
        { username: { $in: ['normal_nexus_user', 'founder_admin'] } },
        { email: { $in: ['normal_nexus@test.com', 'official.cybershieldx@gmail.com'] } }
      ]
    });

    // Create normal user
    await User.create({
      username: 'normal_nexus_user',
      email: 'normal_nexus@test.com',
      password: 'NormalUser123!Pass',
      role: 'user',
      status: 'active'
    });

    // Run seedAdmin to verify idempotent admin initialization
    await seedAdmin({ autoClose: false });
  });

  afterAll(async () => {
    await User.deleteMany({
      $or: [
        { role: 'admin' },
        { username: { $in: ['normal_nexus_user', 'founder_admin'] } },
        { email: { $in: ['normal_nexus@test.com', 'official.cybershieldx@gmail.com'] } }
      ]
    });
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  });

  test('TEST 1: Production safety gate fails fast if MONGODB_URI missing in production', async () => {
    const origEnv = process.env.NODE_ENV;
    const origUri = process.env.MONGODB_URI;

    process.env.NODE_ENV = 'production';
    delete process.env.MONGODB_URI;

    await expect(seedAdmin({ autoClose: false })).rejects.toThrow(/MONGODB_URI environment variable is required in production/i);

    process.env.NODE_ENV = origEnv;
    if (origUri) process.env.MONGODB_URI = origUri;
  });

  test('TEST 3: Anonymous admin login with invalid credentials should be rejected (401)', async () => {
    const res = await request(app)
      .post('/api/auth/admin-login')
      .send({ identity: 'invalid@admin.com', password: 'WrongPassword123!' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('TEST 4: Normal user attempting admin login should receive 403 Forbidden', async () => {
    const res = await request(app)
      .post('/api/auth/admin-login')
      .send({ identity: 'normal_nexus@test.com', password: 'NormalUser123!Pass' });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/Admin access required/i);
  });

  test('TEST 5: Authorized Founder Admin should authenticate successfully via admin-login', async () => {
    const res = await request(app)
      .post('/api/auth/admin-login')
      .send({ identity: 'official.cybershieldx@gmail.com', password: 'CyberShieldAdmin2026!Root' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.role).toBe('admin');
    expect(res.body.token).toBeDefined();
  });

  test('TEST 8: Admin password MUST NOT be stored in plaintext', async () => {
    const dbUser = await User.findOne({ role: 'admin' });
    expect(dbUser).not.toBeNull();
    expect(dbUser.password).toBeDefined();
    expect(dbUser.password).not.toEqual('CyberShieldAdmin2026!Root');
    expect(dbUser.password.startsWith('$2a$') || dbUser.password.startsWith('$2b$')).toBe(true);
  });

  test('TEST 9 & 10: Idempotent seed script should skip if admin already exists', async () => {
    const initialCount = await User.countDocuments({ role: 'admin' });
    await seedAdmin({ autoClose: false });
    const finalCount = await User.countDocuments({ role: 'admin' });
    expect(finalCount).toEqual(initialCount);
  });
});
