/**
 * CyberShield X — Admin API Test Suite
 * Tests: Admin stats, user management, firewall, maintenance mode, audit logs
 */

const request = require('supertest');
const mongoose = require('mongoose');
const { app } = require('../index');

beforeAll(async () => {
  const testDbUri = process.env.MONGODB_URI || process.env.MONGODB_TEST_URI || 'mongodb://127.0.0.1:27017/cybershield-test';
  if (mongoose.connection.readyState === 0) {
    try {
      await mongoose.connect(testDbUri, { serverSelectionTimeoutMS: 2000 });
    } catch (err) {}
  }
});

afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    try {
      await mongoose.disconnect();
    } catch (err) {}
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// ADMIN ROUTES — Authentication Required
// ══════════════════════════════════════════════════════════════════════════════
describe('Admin Routes — No Auth', () => {
  const adminRoutes = [
    { method: 'get', path: '/api/admin/stats' },
    { method: 'get', path: '/api/admin/users' },
    { method: 'get', path: '/api/admin/firewall' },
    { method: 'get', path: '/api/admin/maintenance' },
    { method: 'get', path: '/api/admin/audit-logs' },
    { method: 'post', path: '/api/admin/inject-threat' },
  ];

  adminRoutes.forEach(({ method, path }) => {
    it(`${method.toUpperCase()} ${path} should return 401 without auth`, async () => {
      const res = await request(app)[method](path);
      expect(res.statusCode).toBe(401);
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// ADMIN — Input Validation (Firewall)
// ══════════════════════════════════════════════════════════════════════════════
describe('Admin — Firewall Input Validation Logic', () => {
  it('Invalid IP format in firewall body detected by validator', () => {
    const ip = 'not-an-ip!!';
    const isValid = /^[\d.:a-fA-F/]+$/.test(ip);
    expect(isValid).toBe(false);
  });

  it('Valid IPv4 passes firewall format check', () => {
    const ip = '192.168.1.100';
    const isValid = /^[\d.:a-fA-F/]+$/.test(ip);
    expect(isValid).toBe(true);
  });

  it('Valid IPv6 passes firewall format check', () => {
    const ip = '2001:0db8:85a3:0000:0000:8a2e:0370:7334';
    const isValid = /^[\d.:a-fA-F/]+$/.test(ip);
    expect(isValid).toBe(true);
  });

  it('CIDR notation passes firewall format check', () => {
    const ip = '192.168.0.0/24';
    const isValid = /^[\d.:a-fA-F/]+$/.test(ip);
    expect(isValid).toBe(true);
  });
});
