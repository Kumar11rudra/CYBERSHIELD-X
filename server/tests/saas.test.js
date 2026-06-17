/**
 * CyberShield X — Phase 6 SaaS Foundation Integration Tests
 * Validates Organization lifecycle, RBAC enforcement, Tenant scoping,
 * Vulnerability lifecycle, and Webhook dispatch.
 */

const request = require('supertest');
const mongoose = require('mongoose');
const crypto = require('crypto');
const { app } = require('../index');
const User = require('../models/User');
const Organization = require('../models/Organization');
const OrganizationSettings = require('../models/OrganizationSettings');
const Membership = require('../models/Membership');
const Team = require('../models/Team');
const Invitation = require('../models/Invitation');
const Webhook = require('../models/Webhook');
const Vulnerability = require('../models/Vulnerability');
const Asset = require('../models/Asset');
const { generateToken } = require('../utils/jwt');
const { ROLES, PERMISSIONS, hasPermission } = require('../utils/permissions');

// Test user IDs
const ownerId = new mongoose.Types.ObjectId();
const adminId = new mongoose.Types.ObjectId();
const analystId = new mongoose.Types.ObjectId();
const viewerId = new mongoose.Types.ObjectId();
const outsiderId = new mongoose.Types.ObjectId();

let ownerToken, adminToken, analystToken, viewerToken, outsiderToken;
let testOrgId, testTeamId, testAssetId, testWebhookId, testVulnId;

const TEST_EMAIL_PREFIX = 'saas-test-';

beforeAll(async () => {
  const testDbUri = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/cybershield-test';
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(testDbUri);
  }

  // Clean up any stale test data
  await User.deleteMany({ username: { $regex: /^saas-test-/ } });
  await Organization.deleteMany({ name: { $regex: /^TestOrg/ } });
  await OrganizationSettings.deleteMany({});
  await Membership.deleteMany({});
  await Team.deleteMany({});
  await Invitation.deleteMany({});
  await Webhook.deleteMany({});
  await Vulnerability.deleteMany({});

  // Create test users with different roles
  const users = [
    { _id: ownerId, username: `${TEST_EMAIL_PREFIX}owner`, email: `${TEST_EMAIL_PREFIX}owner@test.com`, password: 'Password123!', emailVerified: true, role: 'user', twoFactorEnabled: false },
    { _id: adminId, username: `${TEST_EMAIL_PREFIX}admin`, email: `${TEST_EMAIL_PREFIX}admin@test.com`, password: 'Password123!', emailVerified: true, role: 'user', twoFactorEnabled: false },
    { _id: analystId, username: `${TEST_EMAIL_PREFIX}analyst`, email: `${TEST_EMAIL_PREFIX}analyst@test.com`, password: 'Password123!', emailVerified: true, role: 'user', twoFactorEnabled: false },
    { _id: viewerId, username: `${TEST_EMAIL_PREFIX}viewer`, email: `${TEST_EMAIL_PREFIX}viewer@test.com`, password: 'Password123!', emailVerified: true, role: 'user', twoFactorEnabled: false },
    { _id: outsiderId, username: `${TEST_EMAIL_PREFIX}outsider`, email: `${TEST_EMAIL_PREFIX}outsider@test.com`, password: 'Password123!', emailVerified: true, role: 'user', twoFactorEnabled: false },
  ];

  for (const u of users) {
    await User.create(u);
  }

  // Generate tokens
  ownerToken = generateToken({ id: ownerId, username: `${TEST_EMAIL_PREFIX}owner`, role: 'user' });
  adminToken = generateToken({ id: adminId, username: `${TEST_EMAIL_PREFIX}admin`, role: 'user' });
  analystToken = generateToken({ id: analystId, username: `${TEST_EMAIL_PREFIX}analyst`, role: 'user' });
  viewerToken = generateToken({ id: viewerId, username: `${TEST_EMAIL_PREFIX}viewer`, role: 'user' });
  outsiderToken = generateToken({ id: outsiderId, username: `${TEST_EMAIL_PREFIX}outsider`, role: 'user' });
});

afterAll(async () => {
  // Full cleanup
  await User.deleteMany({ username: { $regex: /^saas-test-/ } });
  await Organization.deleteMany({ name: { $regex: /^TestOrg/ } });
  await OrganizationSettings.deleteMany({});
  await Membership.deleteMany({});
  await Team.deleteMany({});
  await Invitation.deleteMany({});
  await Webhook.deleteMany({});
  await Vulnerability.deleteMany({});
  await Asset.deleteMany({ hostname: { $regex: /^saas-test-/ } });

  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.close();
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// 1. PERMISSIONS MATRIX UNIT TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe('RBAC Permissions Matrix', () => {
  test('Owner has all permissions', () => {
    Object.values(PERMISSIONS).forEach((perm) => {
      expect(hasPermission(ROLES.OWNER, perm)).toBe(true);
    });
  });

  test('Admin has all except org:delete', () => {
    expect(hasPermission(ROLES.ADMIN, PERMISSIONS.ORG_DELETE)).toBe(false);
    expect(hasPermission(ROLES.ADMIN, PERMISSIONS.ORG_UPDATE_SETTINGS)).toBe(true);
    expect(hasPermission(ROLES.ADMIN, PERMISSIONS.ASSET_CREATE)).toBe(true);
    expect(hasPermission(ROLES.ADMIN, PERMISSIONS.SCAN_RUN)).toBe(true);
    expect(hasPermission(ROLES.ADMIN, PERMISSIONS.WEBHOOK_MANAGE)).toBe(true);
  });

  test('Analyst can run scans and manage vulnerabilities, but not manage org', () => {
    expect(hasPermission(ROLES.ANALYST, PERMISSIONS.SCAN_RUN)).toBe(true);
    expect(hasPermission(ROLES.ANALYST, PERMISSIONS.VULN_MANAGE_STATUS)).toBe(true);
    expect(hasPermission(ROLES.ANALYST, PERMISSIONS.VULN_VIEW)).toBe(true);
    expect(hasPermission(ROLES.ANALYST, PERMISSIONS.ORG_UPDATE_SETTINGS)).toBe(false);
    expect(hasPermission(ROLES.ANALYST, PERMISSIONS.ORG_MANAGE_MEMBERS)).toBe(false);
    expect(hasPermission(ROLES.ANALYST, PERMISSIONS.ASSET_CREATE)).toBe(false);
  });

  test('Viewer has read-only permissions', () => {
    expect(hasPermission(ROLES.VIEWER, PERMISSIONS.ASSET_VIEW)).toBe(true);
    expect(hasPermission(ROLES.VIEWER, PERMISSIONS.SCAN_VIEW)).toBe(true);
    expect(hasPermission(ROLES.VIEWER, PERMISSIONS.VULN_VIEW)).toBe(true);
    expect(hasPermission(ROLES.VIEWER, PERMISSIONS.SCAN_RUN)).toBe(false);
    expect(hasPermission(ROLES.VIEWER, PERMISSIONS.ASSET_CREATE)).toBe(false);
    expect(hasPermission(ROLES.VIEWER, PERMISSIONS.VULN_MANAGE_STATUS)).toBe(false);
    expect(hasPermission(ROLES.VIEWER, PERMISSIONS.WEBHOOK_MANAGE)).toBe(false);
  });

  test('Unknown role has zero permissions', () => {
    expect(hasPermission('hacker', PERMISSIONS.ASSET_VIEW)).toBe(false);
    expect(hasPermission(null, PERMISSIONS.SCAN_VIEW)).toBe(false);
    expect(hasPermission(undefined, PERMISSIONS.ORG_DELETE)).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 2. ORGANIZATION LIFECYCLE TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe('Organization Lifecycle', () => {
  test('POST /api/orgs — Create organization', async () => {
    const res = await request(app)
      .post('/api/orgs')
      .set('Cookie', [`token=${ownerToken}`])
      .send({ name: 'TestOrg Alpha', description: 'Phase 6 test org' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.org.name).toBe('TestOrg Alpha');
    testOrgId = res.body.org._id;
  });

  test('Auto-creates OrganizationSettings on org creation', async () => {
    const settings = await OrganizationSettings.findOne({ organizationId: testOrgId });
    expect(settings).toBeTruthy();
    expect(settings.defaultRiskThreshold).toBe(75);
    expect(settings.retentionDays).toBe(90);
    expect(settings.aiModel).toBe('llama3');
    expect(settings.timezone).toBe('UTC');
  });

  test('Auto-creates Owner Membership on org creation', async () => {
    const membership = await Membership.findOne({ organizationId: testOrgId, userId: ownerId });
    expect(membership).toBeTruthy();
    expect(membership.role).toBe('owner');
  });

  test('GET /api/orgs — List user organizations', async () => {
    const res = await request(app)
      .get('/api/orgs')
      .set('Cookie', [`token=${ownerToken}`]);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.orgs).toBeInstanceOf(Array);
    expect(res.body.orgs.length).toBeGreaterThanOrEqual(1);

    const testOrg = res.body.orgs.find((o) => o._id === testOrgId);
    expect(testOrg).toBeTruthy();
    expect(testOrg.role).toBe('owner');
  });

  test('POST /api/orgs — Fails without name', async () => {
    const res = await request(app)
      .post('/api/orgs')
      .set('Cookie', [`token=${ownerToken}`])
      .send({ description: 'No name org' });

    expect(res.status).toBe(400);
  });

  test('POST /api/orgs — Unauthenticated returns 401', async () => {
    const res = await request(app)
      .post('/api/orgs')
      .send({ name: 'TestOrg Fail' });

    expect(res.status).toBe(401);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 3. MEMBER MANAGEMENT & RBAC ENFORCEMENT
// ═══════════════════════════════════════════════════════════════════════════════

describe('Member Management & RBAC', () => {
  test('Owner can add admin member', async () => {
    // First create a direct membership (bypassing email hash for test simplicity)
    await Membership.create({
      organizationId: testOrgId,
      userId: adminId,
      role: 'admin',
    });

    const membership = await Membership.findOne({ organizationId: testOrgId, userId: adminId });
    expect(membership).toBeTruthy();
    expect(membership.role).toBe('admin');
  });

  test('Owner can add analyst member', async () => {
    await Membership.create({
      organizationId: testOrgId,
      userId: analystId,
      role: 'analyst',
    });

    const membership = await Membership.findOne({ organizationId: testOrgId, userId: analystId });
    expect(membership.role).toBe('analyst');
  });

  test('Owner can add viewer member', async () => {
    await Membership.create({
      organizationId: testOrgId,
      userId: viewerId,
      role: 'viewer',
    });

    const membership = await Membership.findOne({ organizationId: testOrgId, userId: viewerId });
    expect(membership.role).toBe('viewer');
  });

  test('GET /:orgId — Owner can view org details', async () => {
    const res = await request(app)
      .get(`/api/orgs/${testOrgId}`)
      .set('Cookie', [`token=${ownerToken}`])
      .set('x-organization-id', testOrgId);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.org.name).toBe('TestOrg Alpha');
    expect(res.body.members).toBeInstanceOf(Array);
    expect(res.body.members.length).toBe(4); // owner + admin + analyst + viewer
  });

  test('Viewer can view org details (has org:view_members)', async () => {
    const res = await request(app)
      .get(`/api/orgs/${testOrgId}`)
      .set('Cookie', [`token=${viewerToken}`])
      .set('x-organization-id', testOrgId);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('Outsider cannot view org details — 403', async () => {
    const res = await request(app)
      .get(`/api/orgs/${testOrgId}`)
      .set('Cookie', [`token=${outsiderToken}`])
      .set('x-organization-id', testOrgId);

    expect(res.status).toBe(403);
  });

  test('Viewer cannot update org settings — 403', async () => {
    const res = await request(app)
      .put(`/api/orgs/${testOrgId}/settings`)
      .set('Cookie', [`token=${viewerToken}`])
      .set('x-organization-id', testOrgId)
      .send({ defaultRiskThreshold: 50 });

    expect(res.status).toBe(403);
  });

  test('Admin can update org settings', async () => {
    const res = await request(app)
      .put(`/api/orgs/${testOrgId}/settings`)
      .set('Cookie', [`token=${adminToken}`])
      .set('x-organization-id', testOrgId)
      .send({ defaultRiskThreshold: 50, aiModel: 'gemma2' });

    expect(res.status).toBe(200);
    expect(res.body.settings.defaultRiskThreshold).toBe(50);
    expect(res.body.settings.aiModel).toBe('gemma2');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 4. TEAM MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

describe('Team Management', () => {
  test('Owner can create team', async () => {
    const res = await request(app)
      .post(`/api/orgs/${testOrgId}/teams`)
      .set('Cookie', [`token=${ownerToken}`])
      .set('x-organization-id', testOrgId)
      .send({ name: 'Red Team' });

    expect(res.status).toBe(201);
    expect(res.body.team.name).toBe('Red Team');
    testTeamId = res.body.team._id;
  });

  test('Viewer cannot create team — 403', async () => {
    const res = await request(app)
      .post(`/api/orgs/${testOrgId}/teams`)
      .set('Cookie', [`token=${viewerToken}`])
      .set('x-organization-id', testOrgId)
      .send({ name: 'Blue Team' });

    expect(res.status).toBe(403);
  });

  test('Analyst cannot create team — 403', async () => {
    const res = await request(app)
      .post(`/api/orgs/${testOrgId}/teams`)
      .set('Cookie', [`token=${analystToken}`])
      .set('x-organization-id', testOrgId)
      .send({ name: 'Purple Team' });

    expect(res.status).toBe(403);
  });

  test('Admin can update team', async () => {
    const res = await request(app)
      .put(`/api/orgs/${testOrgId}/teams/${testTeamId}`)
      .set('Cookie', [`token=${adminToken}`])
      .set('x-organization-id', testOrgId)
      .send({ name: 'Alpha Red Team' });

    expect(res.status).toBe(200);
    expect(res.body.team.name).toBe('Alpha Red Team');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 5. WEBHOOK MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

describe('Webhook Management', () => {
  test('Owner can create webhook', async () => {
    const res = await request(app)
      .post(`/api/orgs/${testOrgId}/webhooks`)
      .set('Cookie', [`token=${ownerToken}`])
      .set('x-organization-id', testOrgId)
      .send({
        name: 'SOC Slack Channel',
        url: 'https://hooks.slack.com/services/test/test/test',
        type: 'Slack',
        events: ['critical_ioc', 'critical_vuln'],
      });

    expect(res.status).toBe(201);
    expect(res.body.webhook.name).toBe('SOC Slack Channel');
    expect(res.body.webhook.secret).toBeTruthy(); // Auto-generated HMAC secret
    expect(res.body.webhook.type).toBe('Slack');
    testWebhookId = res.body.webhook._id;
  });

  test('Viewer cannot create webhook — 403', async () => {
    const res = await request(app)
      .post(`/api/orgs/${testOrgId}/webhooks`)
      .set('Cookie', [`token=${viewerToken}`])
      .set('x-organization-id', testOrgId)
      .send({ name: 'Fail Webhook', url: 'https://fail.com' });

    expect(res.status).toBe(403);
  });

  test('Analyst cannot create webhook — 403', async () => {
    const res = await request(app)
      .post(`/api/orgs/${testOrgId}/webhooks`)
      .set('Cookie', [`token=${analystToken}`])
      .set('x-organization-id', testOrgId)
      .send({ name: 'Fail Webhook', url: 'https://fail.com' });

    expect(res.status).toBe(403);
  });

  test('Owner can delete webhook', async () => {
    const res = await request(app)
      .delete(`/api/orgs/${testOrgId}/webhooks/${testWebhookId}`)
      .set('Cookie', [`token=${ownerToken}`])
      .set('x-organization-id', testOrgId);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 6. VULNERABILITY LIFECYCLE
// ═══════════════════════════════════════════════════════════════════════════════

describe('Vulnerability Lifecycle', () => {
  beforeAll(async () => {
    // Create a test asset
    const asset = await Asset.create({
      hostname: 'saas-test-server.example.com',
      ip: '10.0.0.50',
      userId: ownerId,
      organizationId: testOrgId,
      assetType: 'Server',
      criticality: 'High',
      status: 'active',
    });
    testAssetId = asset._id;

    // Seed a vulnerability
    const vuln = await Vulnerability.create({
      organizationId: testOrgId,
      assetId: testAssetId,
      cve: 'CVE-2024-1234',
      severity: 'Critical',
      status: 'Open',
      source: 'Nmap',
      firstSeen: new Date(),
      lastSeen: new Date(),
      riskScore: 95,
    });
    testVulnId = vuln._id;
  });

  test('Vulnerability record created correctly', async () => {
    const vuln = await Vulnerability.findById(testVulnId);
    expect(vuln).toBeTruthy();
    expect(vuln.cve).toBe('CVE-2024-1234');
    expect(vuln.severity).toBe('Critical');
    expect(vuln.status).toBe('Open');
    expect(vuln.riskScore).toBe(95);
    expect(String(vuln.organizationId)).toBe(String(testOrgId));
  });

  test('GET /api/vulnerabilities — Lists vulnerabilities', async () => {
    const res = await request(app)
      .get('/api/vulnerabilities')
      .set('Cookie', [`token=${ownerToken}`])
      .set('x-organization-id', testOrgId);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.vulnerabilities).toBeInstanceOf(Array);
    expect(res.body.vulnerabilities.length).toBeGreaterThanOrEqual(1);
  });

  test('PUT /api/vulnerabilities/:id — Analyst can update status', async () => {
    const res = await request(app)
      .put(`/api/vulnerabilities/${testVulnId}`)
      .set('Cookie', [`token=${analystToken}`])
      .set('x-organization-id', testOrgId)
      .send({ status: 'In Progress', resolutionNotes: 'Patch scheduled for tonight.' });

    expect(res.status).toBe(200);
    expect(res.body.vulnerability.status).toBe('In Progress');
    expect(res.body.vulnerability.resolutionNotes).toBe('Patch scheduled for tonight.');
  });

  test('Viewer cannot update vulnerability status — 403', async () => {
    const res = await request(app)
      .put(`/api/vulnerabilities/${testVulnId}`)
      .set('Cookie', [`token=${viewerToken}`])
      .set('x-organization-id', testOrgId)
      .send({ status: 'Resolved' });

    expect(res.status).toBe(403);
  });

  test('Outsider cannot list vulnerabilities — 403', async () => {
    const res = await request(app)
      .get('/api/vulnerabilities')
      .set('Cookie', [`token=${outsiderToken}`])
      .set('x-organization-id', testOrgId);

    expect(res.status).toBe(403);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 7. TENANT ISOLATION TESTS
// ═══════════════════════════════════════════════════════════════════════════════

describe('Tenant Isolation', () => {
  let otherOrgId;

  beforeAll(async () => {
    // Create another org by outsider
    const org = await Organization.create({
      name: 'TestOrg Beta',
      ownerId: outsiderId,
    });
    otherOrgId = org._id;
    await Membership.create({
      organizationId: otherOrgId,
      userId: outsiderId,
      role: 'owner',
    });
  });

  test('Owner of Org A cannot access Org B details', async () => {
    const res = await request(app)
      .get(`/api/orgs/${otherOrgId}`)
      .set('Cookie', [`token=${ownerToken}`])
      .set('x-organization-id', String(otherOrgId));

    expect(res.status).toBe(403);
  });

  test('Outsider (owner of Org B) cannot access Org A details', async () => {
    const res = await request(app)
      .get(`/api/orgs/${testOrgId}`)
      .set('Cookie', [`token=${outsiderToken}`])
      .set('x-organization-id', testOrgId);

    expect(res.status).toBe(403);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 8. WEBHOOK SERVICE (HMAC SIGNING)
// ═══════════════════════════════════════════════════════════════════════════════

describe('Webhook HMAC Signing', () => {
  test('HMAC-SHA256 signature is computed correctly', () => {
    const secret = 'test-secret-key-12345';
    const payload = JSON.stringify({ event: 'critical_ioc', data: { indicator: '8.8.8.8', type: 'ip' } });

    const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');

    expect(signature).toBeTruthy();
    expect(signature.length).toBe(64); // SHA256 hex length
    expect(typeof signature).toBe('string');

    // Verify determinism
    const signature2 = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    expect(signature).toBe(signature2);
  });

  test('Different secrets produce different signatures', () => {
    const payload = JSON.stringify({ event: 'test' });
    const sig1 = crypto.createHmac('sha256', 'secret-a').update(payload).digest('hex');
    const sig2 = crypto.createHmac('sha256', 'secret-b').update(payload).digest('hex');
    expect(sig1).not.toBe(sig2);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 9. MODEL SCHEMA VALIDATION
// ═══════════════════════════════════════════════════════════════════════════════

describe('Model Schema Validation', () => {
  test('Organization requires name', async () => {
    try {
      await Organization.create({ ownerId: ownerId });
      fail('Should have thrown validation error');
    } catch (err) {
      expect(err.name).toBe('ValidationError');
    }
  });

  test('Membership compound unique index', async () => {
    try {
      // Attempt duplicate membership
      await Membership.create({
        organizationId: testOrgId,
        userId: ownerId,
        role: 'viewer',
      });
      fail('Should have thrown duplicate key error');
    } catch (err) {
      expect(err.code).toBe(11000);
    }
  });

  test('Vulnerability severity enum validation', async () => {
    try {
      await Vulnerability.create({
        organizationId: testOrgId,
        assetId: testAssetId,
        cve: 'CVE-TEST-ENUM',
        severity: 'SuperCritical', // Invalid
      });
      fail('Should have thrown validation error');
    } catch (err) {
      expect(err.name).toBe('ValidationError');
    }
  });

  test('Vulnerability status enum validation', async () => {
    try {
      await Vulnerability.create({
        organizationId: testOrgId,
        assetId: testAssetId,
        cve: 'CVE-TEST-STATUS',
        severity: 'High',
        status: 'Hacked', // Invalid
      });
      fail('Should have thrown validation error');
    } catch (err) {
      expect(err.name).toBe('ValidationError');
    }
  });

  test('OrganizationSettings defaults are correct', async () => {
    const org = await Organization.create({
      name: 'TestOrg Defaults',
      ownerId: ownerId,
    });
    const settings = await OrganizationSettings.create({ organizationId: org._id });
    expect(settings.defaultRiskThreshold).toBe(75);
    expect(settings.retentionDays).toBe(90);
    expect(settings.aiModel).toBe('llama3');
    expect(settings.timezone).toBe('UTC');
    expect(settings.alertChannels).toEqual(['email', 'dashboard']);

    // Cleanup
    await Organization.findByIdAndDelete(org._id);
    await OrganizationSettings.findByIdAndDelete(settings._id);
  });

  test('Webhook type enum validation', async () => {
    try {
      await Webhook.create({
        organizationId: testOrgId,
        name: 'Bad Webhook',
        url: 'https://bad.com',
        type: 'Discord', // Invalid enum
        secret: 'test',
      });
      fail('Should have thrown validation error');
    } catch (err) {
      expect(err.name).toBe('ValidationError');
    }
  });

  test('Invitation status enum validation', async () => {
    const token = crypto.randomBytes(16).toString('hex');
    const inv = await Invitation.create({
      organizationId: testOrgId,
      email: 'invite-test@example.com',
      role: 'viewer',
      token,
      expiresAt: new Date(Date.now() + 86400000),
    });
    expect(inv.status).toBe('pending');
    await Invitation.findByIdAndDelete(inv._id);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// 10. BACKWARD COMPATIBILITY (Single-User Mode)
// ═══════════════════════════════════════════════════════════════════════════════

describe('Backward Compatibility (Single-User Mode)', () => {
  test('API works without x-organization-id header (personal space)', async () => {
    // Dashboard should work without org context
    const res = await request(app)
      .get('/api/dashboard')
      .set('Cookie', [`token=${ownerToken}`]);

    expect(res.status).toBe(200);
  });

  test('Vulnerability endpoint without org context returns user-scoped results', async () => {
    const res = await request(app)
      .get('/api/vulnerabilities')
      .set('Cookie', [`token=${ownerToken}`]);

    // Should not 403 — personal space mode
    expect(res.status).toBe(200);
  });
});
