/**
 * CyberShield X — Phase 7 Vulnerability Management Platform Tests
 * Covers: SLA computation, SLA breach detection, assignment workflow,
 * dashboard analytics, bulk status update, filtering, and full regression.
 */

const request = require('supertest');
const mongoose = require('mongoose');
const { app } = require('../index');
const User = require('../models/User');
const Organization = require('../models/Organization');
const Membership = require('../models/Membership');
const Asset = require('../models/Asset');
const Vulnerability = require('../models/Vulnerability');
const { SLA_DAYS } = require('../models/Vulnerability');
const {
  computeSLADeadline,
  computePriority,
  computeSLAStatus,
} = require('../services/vulnerabilityService');
const { checkVulnerabilitySLABreaches } = require('../services/cronService');
const { generateToken } = require('../utils/jwt');

// ─── Test Fixtures ────────────────────────────────────────────────────────────
const ownerId   = new mongoose.Types.ObjectId();
const analystId = new mongoose.Types.ObjectId();
const viewerId  = new mongoose.Types.ObjectId();
const outsiderId = new mongoose.Types.ObjectId();

let ownerToken, analystToken, viewerToken, outsiderToken;
let testOrgId, testAssetId, testVulnId, criticalVulnId;

const PREFIX = 'p7test-';

beforeAll(async () => {
  const uri = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/cybershield-test';
  if (mongoose.connection.readyState === 0) await mongoose.connect(uri);

  // Cleanup
  await User.deleteMany({ username: { $regex: /^p7test-/ } });
  await Organization.deleteMany({ name: 'P7TestOrg' });
  await Membership.deleteMany({});
  await Asset.deleteMany({ hostname: { $regex: /^p7-/ } });
  await Vulnerability.deleteMany({ cve: { $regex: /^CVE-P7/ } });

  // Create users
  for (const [id, username, email] of [
    [ownerId,    'p7test-owner',    'p7owner@test.com'],
    [analystId,  'p7test-analyst',  'p7analyst@test.com'],
    [viewerId,   'p7test-viewer',   'p7viewer@test.com'],
    [outsiderId, 'p7test-outsider', 'p7outsider@test.com'],
  ]) {
    await User.create({ _id: id, username, email, password: 'Password123!', emailVerified: true, role: 'user', twoFactorEnabled: false });
  }

  // Create org + memberships
  const org = await Organization.create({ name: 'P7TestOrg', ownerId });
  testOrgId = org._id;

  await Membership.create({ organizationId: testOrgId, userId: ownerId, role: 'owner' });
  await Membership.create({ organizationId: testOrgId, userId: analystId, role: 'analyst' });
  await Membership.create({ organizationId: testOrgId, userId: viewerId, role: 'viewer' });

  // Create asset
  const asset = await Asset.create({
    userId: ownerId,
    organizationId: testOrgId,
    hostname: 'p7-server.example.com',
    assetType: 'Server',
    criticality: 'Critical',
    status: 'active',
  });
  testAssetId = asset._id;

  // Tokens
  ownerToken   = generateToken({ id: ownerId,   username: 'p7test-owner',    role: 'user' });
  analystToken = generateToken({ id: analystId,  username: 'p7test-analyst',  role: 'user' });
  viewerToken  = generateToken({ id: viewerId,   username: 'p7test-viewer',   role: 'user' });
  outsiderToken = generateToken({ id: outsiderId, username: 'p7test-outsider', role: 'user' });

  // Seed base vulnerability
  const vuln = await Vulnerability.create({
    organizationId: testOrgId,
    assetId: testAssetId,
    cve: 'CVE-P7-001',
    severity: 'High',
    priority: 'P2-High',
    status: 'Open',
    source: 'Test',
    firstSeen: new Date(),
    lastSeen: new Date(),
    riskScore: 75,
    slaDeadline: computeSLADeadline('High', new Date()),
    slaStatus: 'Within SLA',
  });
  testVulnId = vuln._id;

  // Seed critical vulnerability (already breached — backdated)
  const pastDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
  const critVuln = await Vulnerability.create({
    organizationId: testOrgId,
    assetId: testAssetId,
    cve: 'CVE-P7-002',
    severity: 'Critical',
    priority: 'P1-Critical',
    status: 'Open',
    source: 'Test',
    firstSeen: pastDate,
    lastSeen: pastDate,
    riskScore: 95,
    slaDeadline: computeSLADeadline('Critical', pastDate), // should already be past
    slaStatus: 'Within SLA', // intentionally wrong so cron can fix it
    assignedTo: analystId,
  });
  criticalVulnId = critVuln._id;
});

afterAll(async () => {
  await User.deleteMany({ username: { $regex: /^p7test-/ } });
  await Organization.deleteMany({ name: 'P7TestOrg' });
  await Membership.deleteMany({ organizationId: testOrgId });
  await Asset.deleteMany({ hostname: { $regex: /^p7-/ } });
  await Vulnerability.deleteMany({ cve: { $regex: /^CVE-P7/ } });
  if (mongoose.connection.readyState === 1) await mongoose.connection.close();
});

// ─────────────────────────────────────────────────────────────────────────────
// 1. SLA COMPUTATION UNIT TESTS
// ─────────────────────────────────────────────────────────────────────────────

describe('SLA Computation — Unit Tests', () => {
  const base = new Date('2025-01-01T00:00:00Z');

  test('computeSLADeadline: Critical = 7 days', () => {
    const deadline = computeSLADeadline('Critical', base);
    const diff = Math.round((deadline - base) / (1000 * 60 * 60 * 24));
    expect(diff).toBe(7);
  });

  test('computeSLADeadline: High = 14 days', () => {
    const deadline = computeSLADeadline('High', base);
    const diff = Math.round((deadline - base) / (1000 * 60 * 60 * 24));
    expect(diff).toBe(14);
  });

  test('computeSLADeadline: Medium = 30 days', () => {
    const deadline = computeSLADeadline('Medium', base);
    const diff = Math.round((deadline - base) / (1000 * 60 * 60 * 24));
    expect(diff).toBe(30);
  });

  test('computeSLADeadline: Low = 90 days', () => {
    const deadline = computeSLADeadline('Low', base);
    const diff = Math.round((deadline - base) / (1000 * 60 * 60 * 24));
    expect(diff).toBe(90);
  });

  test('computeSLADeadline: Unknown severity defaults to 30 days', () => {
    const deadline = computeSLADeadline('Unknown', base);
    const diff = Math.round((deadline - base) / (1000 * 60 * 60 * 24));
    expect(diff).toBe(30);
  });

  test('computePriority: severity → priority mapping', () => {
    expect(computePriority('Critical')).toBe('P1-Critical');
    expect(computePriority('High')).toBe('P2-High');
    expect(computePriority('Medium')).toBe('P3-Medium');
    expect(computePriority('Low')).toBe('P4-Low');
    expect(computePriority('Unknown')).toBe('P3-Medium');
  });

  test('computeSLAStatus: past deadline → Breached', () => {
    const pastDeadline = new Date(Date.now() - 1000);
    expect(computeSLAStatus(pastDeadline)).toBe('Breached');
  });

  test('computeSLAStatus: < 48h remaining → At Risk', () => {
    const soonDeadline = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h from now
    expect(computeSLAStatus(soonDeadline)).toBe('At Risk');
  });

  test('computeSLAStatus: plenty of time → Within SLA', () => {
    const futureDeadline = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000); // 10 days
    expect(computeSLAStatus(futureDeadline)).toBe('Within SLA');
  });

  test('computeSLAStatus: null deadline → Within SLA', () => {
    expect(computeSLAStatus(null)).toBe('Within SLA');
  });

  test('SLA_DAYS constants are correct', () => {
    expect(SLA_DAYS.Critical).toBe(7);
    expect(SLA_DAYS.High).toBe(14);
    expect(SLA_DAYS.Medium).toBe(30);
    expect(SLA_DAYS.Low).toBe(90);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. SLA BREACH DETECTION (CRON)
// ─────────────────────────────────────────────────────────────────────────────

describe('SLA Breach Escalation — Cron Job', () => {
  test('checkVulnerabilitySLABreaches marks overdue vulns as Breached', async () => {
    // CVE-P7-002 has a slaDeadline 30 days ago and slaStatus is 'Within SLA' (intentionally wrong)
    const before = await Vulnerability.findById(criticalVulnId);
    expect(before.slaStatus).toBe('Within SLA');
    expect(before.slaDeadline < new Date()).toBe(true); // already past

    await checkVulnerabilitySLABreaches();

    const after = await Vulnerability.findById(criticalVulnId);
    expect(after.slaStatus).toBe('Breached');
    expect(after.overdueAt).toBeTruthy();
  });

  test('Resolved vulnerabilities are NOT escalated', async () => {
    // Create a resolved vuln with past SLA deadline
    const resolvedVuln = await Vulnerability.create({
      organizationId: testOrgId,
      assetId: testAssetId,
      cve: 'CVE-P7-RESOLVED',
      severity: 'Critical',
      priority: 'P1-Critical',
      status: 'Resolved',
      source: 'Test',
      firstSeen: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      lastSeen: new Date(),
      riskScore: 90,
      slaDeadline: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      slaStatus: 'Within SLA',
      closedAt: new Date(),
    });

    await checkVulnerabilitySLABreaches();

    const after = await Vulnerability.findById(resolvedVuln._id);
    // Should NOT be Breached since it's Resolved
    expect(after.slaStatus).toBe('Within SLA');

    await Vulnerability.findByIdAndDelete(resolvedVuln._id);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. VULNERABILITY DASHBOARD API
// ─────────────────────────────────────────────────────────────────────────────

describe('Vulnerability Dashboard API', () => {
  test('GET /api/vulnerabilities/dashboard — returns analytics', async () => {
    const res = await request(app)
      .get('/api/vulnerabilities/dashboard')
      .set('Cookie', [`token=${ownerToken}`])
      .set('x-organization-id', String(testOrgId));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.summary).toBeTruthy();
    expect(res.body.summary.total).toBeGreaterThanOrEqual(2);
    expect(res.body.summary.byStatus).toHaveProperty('Open');
    expect(res.body.summary.bySeverity).toHaveProperty('Critical');
    expect(res.body.summary.bySLAStatus).toHaveProperty('Breached');
    expect(res.body.summary.byPriority).toHaveProperty('P1-Critical');
    expect(typeof res.body.summary.mttrDays).toBe('number');
    expect(res.body.trend30d).toBeInstanceOf(Array);
  });

  test('Viewer can access dashboard (read permission)', async () => {
    const res = await request(app)
      .get('/api/vulnerabilities/dashboard')
      .set('Cookie', [`token=${viewerToken}`])
      .set('x-organization-id', String(testOrgId));

    expect(res.status).toBe(200);
  });

  test('Outsider cannot access dashboard — 403', async () => {
    const res = await request(app)
      .get('/api/vulnerabilities/dashboard')
      .set('Cookie', [`token=${outsiderToken}`])
      .set('x-organization-id', String(testOrgId));

    expect(res.status).toBe(403);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. VULNERABILITY LIST + FILTER API
// ─────────────────────────────────────────────────────────────────────────────

describe('Vulnerability List & Filter API', () => {
  test('GET /api/vulnerabilities — returns list for owner', async () => {
    const res = await request(app)
      .get('/api/vulnerabilities')
      .set('Cookie', [`token=${ownerToken}`])
      .set('x-organization-id', String(testOrgId));

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.vulnerabilities).toBeInstanceOf(Array);
    expect(res.body.total).toBeGreaterThanOrEqual(2);
  });

  test('Filter by severity=Critical', async () => {
    const res = await request(app)
      .get('/api/vulnerabilities?severity=Critical')
      .set('Cookie', [`token=${ownerToken}`])
      .set('x-organization-id', String(testOrgId));

    expect(res.status).toBe(200);
    res.body.vulnerabilities.forEach(v => expect(v.severity).toBe('Critical'));
  });

  test('Filter by status=Open', async () => {
    const res = await request(app)
      .get('/api/vulnerabilities?status=Open')
      .set('Cookie', [`token=${ownerToken}`])
      .set('x-organization-id', String(testOrgId));

    expect(res.status).toBe(200);
    res.body.vulnerabilities.forEach(v => expect(v.status).toBe('Open'));
  });

  test('Filter by slaStatus=Breached', async () => {
    const res = await request(app)
      .get('/api/vulnerabilities?slaStatus=Breached')
      .set('Cookie', [`token=${ownerToken}`])
      .set('x-organization-id', String(testOrgId));

    expect(res.status).toBe(200);
    res.body.vulnerabilities.forEach(v => expect(v.slaStatus).toBe('Breached'));
  });

  test('GET /api/vulnerabilities/:id — single vuln detail', async () => {
    const res = await request(app)
      .get(`/api/vulnerabilities/${testVulnId}`)
      .set('Cookie', [`token=${ownerToken}`])
      .set('x-organization-id', String(testOrgId));

    expect(res.status).toBe(200);
    expect(res.body.vulnerability.cve).toBe('CVE-P7-001');
    expect(res.body.vulnerability.priority).toBe('P2-High');
    expect(res.body.vulnerability.slaStatus).toBeTruthy();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. VULNERABILITY ASSIGNMENT
// ─────────────────────────────────────────────────────────────────────────────

describe('Vulnerability Assignment', () => {
  test('Owner can assign vulnerability to org member', async () => {
    const res = await request(app)
      .put(`/api/vulnerabilities/${testVulnId}/assign`)
      .set('Cookie', [`token=${ownerToken}`])
      .set('x-organization-id', String(testOrgId))
      .send({
        assignedTo: String(analystId),
        priority: 'P2-High',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        resolutionNotes: 'Patch being prepared.',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.vulnerability.assignedTo).toBeTruthy();
    expect(res.body.vulnerability.priority).toBe('P2-High');
  });

  test('Analyst can self-assign vulnerability', async () => {
    const res = await request(app)
      .put(`/api/vulnerabilities/${testVulnId}/assign`)
      .set('Cookie', [`token=${analystToken}`])
      .set('x-organization-id', String(testOrgId))
      .send({ assignedTo: String(analystId) });

    expect(res.status).toBe(200);
  });

  test('Viewer cannot assign vulnerability — 403', async () => {
    const res = await request(app)
      .put(`/api/vulnerabilities/${testVulnId}/assign`)
      .set('Cookie', [`token=${viewerToken}`])
      .set('x-organization-id', String(testOrgId))
      .send({ assignedTo: String(viewerId) });

    expect(res.status).toBe(403);
  });

  test('Cannot assign to non-member user', async () => {
    const res = await request(app)
      .put(`/api/vulnerabilities/${testVulnId}/assign`)
      .set('Cookie', [`token=${ownerToken}`])
      .set('x-organization-id', String(testOrgId))
      .send({ assignedTo: String(outsiderId) });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/not a member/i);
  });

  test('Can unassign vulnerability (assignedTo: null)', async () => {
    const res = await request(app)
      .put(`/api/vulnerabilities/${testVulnId}/assign`)
      .set('Cookie', [`token=${ownerToken}`])
      .set('x-organization-id', String(testOrgId))
      .send({ assignedTo: null });

    expect(res.status).toBe(200);
    expect(res.body.vulnerability.assignedTo).toBeFalsy();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. STATUS UPDATE + LIFECYCLE
// ─────────────────────────────────────────────────────────────────────────────

describe('Vulnerability Status Lifecycle', () => {
  test('Analyst can move vulnerability to In Progress', async () => {
    const res = await request(app)
      .put(`/api/vulnerabilities/${testVulnId}`)
      .set('Cookie', [`token=${analystToken}`])
      .set('x-organization-id', String(testOrgId))
      .send({ status: 'In Progress' });

    expect(res.status).toBe(200);
    expect(res.body.vulnerability.status).toBe('In Progress');
  });

  test('Analyst can resolve vulnerability', async () => {
    const res = await request(app)
      .put(`/api/vulnerabilities/${testVulnId}`)
      .set('Cookie', [`token=${analystToken}`])
      .set('x-organization-id', String(testOrgId))
      .send({ status: 'Resolved', resolutionNotes: 'Patched via apt upgrade.' });

    expect(res.status).toBe(200);
    expect(res.body.vulnerability.status).toBe('Resolved');
    expect(res.body.vulnerability.closedAt).toBeTruthy();
  });

  test('Owner can verify resolved vulnerability', async () => {
    const res = await request(app)
      .put(`/api/vulnerabilities/${testVulnId}`)
      .set('Cookie', [`token=${ownerToken}`])
      .set('x-organization-id', String(testOrgId))
      .send({ status: 'Verified' });

    expect(res.status).toBe(200);
    expect(res.body.vulnerability.status).toBe('Verified');
    expect(res.body.vulnerability.verificationDate).toBeTruthy();
  });

  test('Priority field can be updated via status update', async () => {
    // Reset vuln to Open first
    await Vulnerability.findByIdAndUpdate(testVulnId, { status: 'Open' });

    const res = await request(app)
      .put(`/api/vulnerabilities/${testVulnId}`)
      .set('Cookie', [`token=${analystToken}`])
      .set('x-organization-id', String(testOrgId))
      .send({ priority: 'P1-Critical' });

    expect(res.status).toBe(200);
    expect(res.body.vulnerability.priority).toBe('P1-Critical');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. BULK STATUS UPDATE
// ─────────────────────────────────────────────────────────────────────────────

describe('Bulk Status Update', () => {
  let bulkVulnIds = [];

  beforeAll(async () => {
    // Create 3 test vulns for bulk ops
    for (let i = 3; i <= 5; i++) {
      const v = await Vulnerability.create({
        organizationId: testOrgId,
        assetId: testAssetId,
        cve: `CVE-P7-00${i}`,
        severity: 'Medium',
        priority: 'P3-Medium',
        status: 'Open',
        source: 'Test',
        firstSeen: new Date(),
        lastSeen: new Date(),
        riskScore: 50,
      });
      bulkVulnIds.push(String(v._id));
    }
  });

  afterAll(async () => {
    await Vulnerability.deleteMany({ cve: { $in: ['CVE-P7-003', 'CVE-P7-004', 'CVE-P7-005'] } });
  });

  test('POST /api/vulnerabilities/bulk-status — analyst can bulk update', async () => {
    const res = await request(app)
      .post('/api/vulnerabilities/bulk-status')
      .set('Cookie', [`token=${analystToken}`])
      .set('x-organization-id', String(testOrgId))
      .send({ vulnIds: bulkVulnIds, status: 'In Progress' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.modified).toBe(3);
  });

  test('Viewer cannot bulk update — 403', async () => {
    const res = await request(app)
      .post('/api/vulnerabilities/bulk-status')
      .set('Cookie', [`token=${viewerToken}`])
      .set('x-organization-id', String(testOrgId))
      .send({ vulnIds: bulkVulnIds, status: 'Resolved' });

    expect(res.status).toBe(403);
  });

  test('Bulk update with empty vulnIds returns 400', async () => {
    const res = await request(app)
      .post('/api/vulnerabilities/bulk-status')
      .set('Cookie', [`token=${analystToken}`])
      .set('x-organization-id', String(testOrgId))
      .send({ vulnIds: [], status: 'Resolved' });

    expect(res.status).toBe(400);
  });

  test('Bulk update with invalid status returns 400', async () => {
    const res = await request(app)
      .post('/api/vulnerabilities/bulk-status')
      .set('Cookie', [`token=${analystToken}`])
      .set('x-organization-id', String(testOrgId))
      .send({ vulnIds: bulkVulnIds, status: 'Hacked' });

    expect(res.status).toBe(400);
  });

  test('Bulk Resolved sets closedAt', async () => {
    const res = await request(app)
      .post('/api/vulnerabilities/bulk-status')
      .set('Cookie', [`token=${analystToken}`])
      .set('x-organization-id', String(testOrgId))
      .send({ vulnIds: bulkVulnIds, status: 'Resolved' });

    expect(res.status).toBe(200);
    const updated = await Vulnerability.find({ _id: { $in: bulkVulnIds } });
    updated.forEach(v => expect(v.closedAt).toBeTruthy());
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 8. VULNERABILITY MODEL SCHEMA (REGRESSION)
// ─────────────────────────────────────────────────────────────────────────────

describe('Vulnerability Model Schema Regression', () => {
  test('New fields have correct defaults', async () => {
    const v = await Vulnerability.create({
      assetId: testAssetId,
      cve: 'CVE-P7-SCHEMA-TEST',
      severity: 'Low',
      source: 'Test',
    });

    expect(v.priority).toBe('P3-Medium'); // default (not derived from Low)
    expect(v.status).toBe('Open');
    expect(v.slaStatus).toBe('Within SLA');
    expect(v.slaDeadline).toBeNull();
    expect(v.overdueAt).toBeNull();
    expect(v.closedAt).toBeNull();

    await Vulnerability.findByIdAndDelete(v._id);
  });

  test('Priority enum validation', async () => {
    try {
      await Vulnerability.create({
        assetId: testAssetId,
        cve: 'CVE-P7-PRIORITY-FAIL',
        severity: 'High',
        source: 'Test',
        priority: 'P0-Emergency', // invalid
      });
      fail('Should have thrown ValidationError');
    } catch (err) {
      expect(err.name).toBe('ValidationError');
    }
  });

  test('slaStatus enum validation', async () => {
    try {
      await Vulnerability.create({
        assetId: testAssetId,
        cve: 'CVE-P7-SLA-FAIL',
        severity: 'High',
        source: 'Test',
        slaStatus: 'Overdue', // invalid
      });
      fail('Should have thrown ValidationError');
    } catch (err) {
      expect(err.name).toBe('ValidationError');
    }
  });
});
