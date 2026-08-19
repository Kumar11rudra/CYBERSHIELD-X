/**
 * CyberShield X — Phase 3 Enterprise & Intelligence Integration Tests
 * Validates IOC records, background task queue for Nmap, AI Triage Analyst, and PDF generator.
 */

const request = require('supertest');
const mongoose = require('mongoose');
const { app } = require('../index');
const User = require('../models/User');
const Scan = require('../models/Scan');
const IOCRecord = require('../models/IOCRecord');
const AIAnalysis = require('../models/AIAnalysis');
const { generateToken } = require('../utils/jwt');

const { connectTestDb, closeTestDb } = require('./helpers/testDbHelper');

const testUserId = new mongoose.Types.ObjectId();
let authToken = '';

beforeAll(async () => {
  await connectTestDb();

  // Ensure no stale users remain with either test email or test username
  await User.deleteMany({
    $or: [
      { email: 'testadmin@cybershield-test.com' },
      { username: 'testadmin' }
    ]
  });

  // Create a mock admin user for route access
  await User.create({
    _id: testUserId,
    username: 'testadmin',
    email: 'testadmin@cybershield-test.com',
    password: 'Password123!',
    emailVerified: true,
    role: 'admin',
    twoFactorEnabled: false
  });

  authToken = generateToken({ id: testUserId, username: 'testadmin', role: 'admin' });
});

afterAll(async () => {
  await closeTestDb();
});

// ══════════════════════════════════════════════════════════════════════════════
// IOC THREAT INTELLIGENCE PORTAL TESTS
// ══════════════════════════════════════════════════════════════════════════════
describe('Threat Intelligence IOC Portal API', () => {
  it('GET /api/ioc should require authorization', async () => {
    const res = await request(app).get('/api/ioc');
    expect(res.statusCode).toBe(401);
  });

  it('POST /api/ioc/add should insert a new future-proof IOC record', async () => {
    const res = await request(app)
      .post('/api/ioc/add')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        type: 'ip',
        value: '198.51.100.42',
        reputation: 95,
        confidence: 95,
        source: 'Test Threat Feed',
        sourceType: 'feed',
        tags: ['botnet', 'c2']
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.ioc.value).toBe('198.51.100.42');
    expect(res.body.ioc.reputation).toBe(95);
    expect(res.body.ioc.tags).toContain('botnet');
  });

  it('GET /api/ioc should successfully search for existing IOC reputation', async () => {
    const res = await request(app)
      .get('/api/ioc?query=198.51.100.42')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.ioc.value).toBe('198.51.100.42');
    expect(res.body.ioc.reputation).toBe(95);
  });

  it('GET /api/ioc/recent should list recently queried and manual threat intelligence logs', async () => {
    const res = await request(app)
      .get('/api/ioc/recent')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.iocs)).toBe(true);
    expect(res.body.iocs.length).toBeGreaterThan(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// BACKGROUND SCAN WORKER & TOOLKIT EXECUTION TESTS
// ══════════════════════════════════════════════════════════════════════════════
describe('Toolkit Execution & Diagnostic Engine', () => {
  it('POST /api/toolkit/execute should execute security tools and return results', async () => {
    const res = await request(app)
      .post('/api/toolkit/execute')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        toolId: 'whois',
        target: 'example.com'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.whois || res.body.results).toBeDefined();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// DECOUPLED AI SECURITY ANALYST PORTAL
// ══════════════════════════════════════════════════════════════════════════════
describe('AI Incident Triage Analyst API', () => {
  let scanId;

  beforeAll(async () => {
    const scan = await Scan.create({
      userId: testUserId,
      target: 'cybershield-node.net',
      targetType: 'domain',
      status: 'completed',
      scanType: 'subfinder',
      threatScore: 35,
      riskLevel: 'medium',
      breakdown: { rawOutput: 'Exposed subdomains: dev.cybershield-node.net' }
    });
    scanId = scan._id;

    await AIAnalysis.create({
      scanId,
      userId: testUserId,
      executiveSummary: 'Automated AI incident triage summary.',
      findings: [{ title: 'Subdomain exposure', severity: 'MEDIUM', evidence: 'dev.cybershield-node.net' }],
      recommendations: ['Enforce DNS access controls'],
      remediationPlan: 'Update DNS records',
      durationMs: 150
    });
  });

  it('POST /api/ai/analyze-scan should analyze completion logs and store decoupled reports', async () => {
    const res = await request(app)
      .post('/api/ai/analyze-scan')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        scanId
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.analysis.executiveSummary).toBeDefined();
    expect(Array.isArray(res.body.analysis.findings)).toBe(true);
    expect(Array.isArray(res.body.analysis.recommendations)).toBe(true);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// ENTERPRISE PDF ENGINE TESTS
// ══════════════════════════════════════════════════════════════════════════════
describe('Enterprise Server-Side PDF Reporting Engine', () => {
  let scanId;

  beforeAll(async () => {
    const scan = await Scan.create({
      userId: testUserId,
      target: 'secure-gateway.net',
      targetType: 'domain',
      status: 'completed',
      scanType: 'ssl',
      threatScore: 10,
      riskLevel: 'low',
      breakdown: { rawOutput: 'TLS 1.3 enabled. Cipher: TLS_AES_256_GCM_SHA384' }
    });
    scanId = scan._id;
  });

  it('GET /api/reports/generate-pdf/:scanId should generate executive report successfully', async () => {
    const res = await request(app)
      .get(`/api/reports/generate-pdf/${scanId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.url).toBeDefined();
    expect(res.body.generatedAt).toBeDefined();
  });
});
