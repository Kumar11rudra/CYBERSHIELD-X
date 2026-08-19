const request = require('supertest');
const mongoose = require('mongoose');
const { app } = require('../index');
const Scan = require('../models/Scan');
const User = require('../models/User');
const AIAnalysis = require('../models/AIAnalysis');
const jwt = require('jsonwebtoken');
const { connectTestDb, closeTestDb, clearTestDb } = require('./helpers/testDbHelper');

describe('Multi-Format Report Export API (/api/reports/export/:format/:scanId)', () => {
    let testUser;
    let otherUser;
    let userToken;
    let otherToken;
    let testScan;

    beforeAll(async () => {
        await connectTestDb();
    });

    afterAll(async () => {
        await closeTestDb();
    });

    beforeEach(async () => {
        await clearTestDb();

        testUser = await User.create({
            username: 'reporter_user',
            email: 'reporter@example.com',
            password: 'Password123!',
            role: 'user'
        });

        otherUser = await User.create({
            username: 'other_user',
            email: 'other@example.com',
            password: 'Password123!',
            role: 'user'
        });

        const secret = process.env.JWT_SECRET || 'testsecret1234567890123456789012';
        userToken = jwt.sign({ id: testUser._id, role: testUser.role }, secret, { expiresIn: '1h' });
        otherToken = jwt.sign({ id: otherUser._id, role: otherUser.role }, secret, { expiresIn: '1h' });

        testScan = await Scan.create({
            userId: testUser._id,
            target: 'api.enterprise-sec.com',
            targetType: 'domain',
            scanType: 'vulnerability',
            threatScore: 78,
            riskLevel: 'dangerous',
            status: 'completed'
        });

        await AIAnalysis.create({
            scanId: testScan._id,
            userId: testUser._id,
            executiveSummary: 'Multiple vulnerabilities detected on external perimeter.',
            remediationPlan: '1. Patch OpenSSL to 3.x\n2. Disable actuator endpoints in production',
            findings: [
                {
                    title: 'Exposed Debug Endpoint',
                    severity: 'HIGH',
                    evidence: 'GET /actuator/env exposed publicly'
                },
                {
                    title: 'Outdated OpenSSL Version',
                    severity: 'MEDIUM',
                    evidence: 'OpenSSL 1.1.1u found on port 443'
                }
            ]
        });
    });

    describe('SARIF v2.1.0 Export', () => {
        it('should export scan findings in OASIS SARIF v2.1.0 format', async () => {
            const res = await request(app)
                .get(`/api/reports/export/sarif/${testScan._id}`)
                .set('Authorization', `Bearer ${userToken}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.format).toBe('sarif');
            expect(res.body.content.version).toBe('2.1.0');
            expect(res.body.content.runs).toHaveLength(1);
            expect(res.body.content.runs[0].results.length).toBeGreaterThanOrEqual(2);
            expect(res.body.content.runs[0].results[0].ruleId).toContain('CSX-vulnerability');
        });
    });

    describe('STIX 2.1 Threat Object Export', () => {
        it('should export scan findings in STIX 2.1 Threat Bundle format', async () => {
            const res = await request(app)
                .get(`/api/reports/export/stix/${testScan._id}`)
                .set('Authorization', `Bearer ${userToken}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.format).toBe('stix');
            expect(res.body.content.type).toBe('bundle');
            expect(res.body.content.spec_version).toBe('2.1');
            expect(res.body.content.objects.length).toBeGreaterThanOrEqual(2);
            expect(res.body.content.objects[0].type).toBe('indicator');
        });
    });

    describe('CSV Tabular Export', () => {
        it('should export scan findings in CSV format', async () => {
            const res = await request(app)
                .get(`/api/reports/export/csv/${testScan._id}`)
                .set('Authorization', `Bearer ${userToken}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.format).toBe('csv');
            expect(res.body.content).toContain('ID,Target,ScanType,Severity,Title,ThreatScore,Timestamp');
            expect(res.body.content).toContain('Exposed Debug Endpoint');
        });
    });

    describe('JSON & Markdown Export', () => {
        it('should export scan dossier in structured JSON format', async () => {
            const res = await request(app)
                .get(`/api/reports/export/json/${testScan._id}`)
                .set('Authorization', `Bearer ${userToken}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.format).toBe('json');
            expect(res.body.content.target).toBe('api.enterprise-sec.com');
            expect(res.body.content.threatScore).toBe(78);
        });

        it('should export scan report in Markdown format', async () => {
            const res = await request(app)
                .get(`/api/reports/export/markdown/${testScan._id}`)
                .set('Authorization', `Bearer ${userToken}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.format).toBe('markdown');
            expect(res.body.content).toContain('# CyberShield X — Security Audit Dossier');
        });
    });

    describe('Security & Access Controls (IDOR, Auth, Validation)', () => {
        it('should block unauthenticated requests with 401', async () => {
            const res = await request(app)
                .get(`/api/reports/export/sarif/${testScan._id}`);

            expect(res.status).toBe(401);
        });

        it('should block unauthorized users from accessing scans they do not own (IDOR 403)', async () => {
            const res = await request(app)
                .get(`/api/reports/export/sarif/${testScan._id}`)
                .set('Authorization', `Bearer ${otherToken}`);

            expect(res.status).toBe(403);
            expect(res.body.error).toContain('not authorized');
        });

        it('should return 400 for invalid ObjectId format', async () => {
            const res = await request(app)
                .get('/api/reports/export/sarif/invalid-id-123')
                .set('Authorization', `Bearer ${userToken}`);

            expect(res.status).toBe(400);
            expect(res.body.error).toContain('Invalid scan identifier format');
        });

        it('should return 404 for non-existent scan', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const res = await request(app)
                .get(`/api/reports/export/sarif/${fakeId}`)
                .set('Authorization', `Bearer ${userToken}`);

            expect(res.status).toBe(404);
            expect(res.body.error).toContain('Scan report not found');
        });
    });
});
