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

const testUserId = new mongoose.Types.ObjectId();
let authToken = '';

beforeAll(async () => {
  const testDbUri = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/cybershield-test';
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(testDbUri);
  }

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
  // Clean up
  await User.deleteMany({ email: 'testadmin@cybershield-test.com' });
  await Scan.deleteMany({ userId: testUserId });
  await AIAnalysis.deleteMany({});
  await IOCRecord.deleteMany({ source: /Test/ });
  await mongoose.disconnect();
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
    expect(res.body.record.value).toBe('198.51.100.42');
    expect(res.body.record.reputation).toBe(95);
    expect(res.body.record.tags).toContain('botnet');
  });

  it('GET /api/ioc should successfully search for existing IOC reputation', async () => {
    const res = await request(app)
      .get('/api/ioc?target=198.51.100.42')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.record.value).toBe('198.51.100.42');
    expect(res.body.record.reputation).toBe(95);
  });

  it('GET /api/ioc/recent should list recently queried and manual threat intelligence logs', async () => {
    const res = await request(app)
      .get('/api/ioc/recent')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.records)).toBe(true);
    expect(res.body.records.length).toBeGreaterThan(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// BACKGROUND SCAN WORKER QUEUE TESTS
// ══════════════════════════════════════════════════════════════════════════════
describe('Background Task queue for Nmap Execution', () => {
  it('POST /api/toolkit/execute should immediately queue Nmap scans in background and return pending, and complete', async () => {
    const res = await request(app)
      .post('/api/toolkit/execute')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        toolId: 'nmap',
        target: '127.0.0.1',
        scanMode: 'quick'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.status).toBe('pending');
    expect(res.body.scanId).toBeDefined();

    const scanId = res.body.scanId;

    // Verify DB Scan state is saved as pending
    let scan = await Scan.findById(scanId);
    expect(scan).toBeDefined();
    expect(scan.status).toBe('pending');
    expect(scan.scanType).toBe('nmap');

    // Poll the scan status until completed/failed to let the background queue job finish
    let attempts = 0;
    while (scan && scan.status === 'pending' && attempts < 50) {
      await new Promise(resolve => setTimeout(resolve, 100));
      scan = await Scan.findById(scanId);
      attempts++;
    }

    expect(scan.status).not.toBe('pending');
  }, 10000);
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
  });

  it('POST /api/ai/analyze-scan should analyze completion logs and store decoupled reports', async () => {
    const res = await request(app)
      .post('/api/ai/analyze-scan')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        scanId,
        model: 'llama3'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.analysis.scanId.toString()).toBe(scanId.toString());
    expect(res.body.analysis.model).toBe('llama3');
    expect(res.body.analysis.executiveSummary).toBeDefined();
    expect(Array.isArray(res.body.analysis.findings)).toBe(true);
    expect(Array.isArray(res.body.analysis.recommendations)).toBe(true);
    expect(res.body.analysis.remediationPlan).toBeDefined();

    // Confirm it is not stored directly in the Scan record itself
    const scan = await Scan.findById(scanId);
    expect(scan.aiAnalysis).toBeUndefined();
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

  it('GET /api/reports/generate-pdf/:scanId should stream pdf buffer headers', async () => {
    const res = await request(app)
      .get(`/api/reports/generate-pdf/${scanId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toBe('application/pdf');
    expect(res.headers['content-disposition']).toContain('attachment');
    expect(res.headers['content-disposition']).toContain(`CyberShield_Enterprise_Report_${scanId}.pdf`);
  });
});
