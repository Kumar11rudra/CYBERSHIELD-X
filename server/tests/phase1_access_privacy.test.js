const request = require('supertest');
const fs = require('fs');
const path = require('path');
const User = require('../models/User');

describe('Phase 1 — Access Gating, Team Privacy & Sushant Member Verification', () => {
  let validToken;
  let app;
  let findByIdSpy;

  beforeAll(() => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || '0123456789012345678901234567890123456789012345678901234567890123456789';
    process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || '0123456789012345678901234567890123456789012345678901234567890123456789';
    const { generateToken } = require('../utils/jwt');
    validToken = generateToken({ id: '507f1f77bcf86cd799439011', role: 'user' });

    process.env.NODE_ENV = 'test';
    
    // Mock User.findById to resolve instantly
    findByIdSpy = jest.spyOn(User, 'findById').mockImplementation(() => ({
      select: jest.fn().mockResolvedValue({
        _id: '507f1f77bcf86cd799439011',
        id: '507f1f77bcf86cd799439011',
        role: 'user',
        isBanned: false
      })
    }));

    const serverModule = require('../index');
    app = serverModule.app || serverModule;
  });

  afterAll(() => {
    if (findByIdSpy) findByIdSpy.mockRestore();
  });

  describe('Server Access Gating (HTTP 401 for Unauthenticated Executions)', () => {
    test('Unauthenticated POST /api/scan returns HTTP 401 Unauthorized', async () => {
      const res = await request(app)
        .post('/api/scan')
        .send({ target: 'example.com' });
      
      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error', 'Authentication required');
    });

    test('Unauthenticated POST /api/toolkit/execute returns HTTP 401 Unauthorized', async () => {
      const res = await request(app)
        .post('/api/toolkit/execute')
        .send({ toolId: 'dns', target: 'example.com' });
      
      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error', 'Authentication required');
    });

    test('Unauthenticated POST /api/tools/whois returns HTTP 401 Unauthorized', async () => {
      const res = await request(app)
        .post('/api/tools/whois')
        .send({ domain: 'example.com' });
      
      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error', 'Authentication required');
    });

    test('Unauthenticated POST /api/ai/chat returns HTTP 401 Unauthorized', async () => {
      const res = await request(app)
        .post('/api/ai/chat')
        .send({ message: 'hello' });
      
      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error', 'Authentication required');
    });

    test('Unauthenticated POST /api/breach/email returns HTTP 401 Unauthorized', async () => {
      const res = await request(app)
        .post('/api/breach/email')
        .send({ email: 'test@example.com' });
      
      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error', 'Authentication required');
    });

    test('Unauthenticated POST /api/chatbot/chat returns HTTP 401 Unauthorized', async () => {
      const res = await request(app)
        .post('/api/chatbot/chat')
        .send({ message: 'test' });
      
      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error', 'Authentication required');
    });

    test('Authenticated request passes auth middleware (returns non-401 status code)', async () => {
      const res = await request(app)
        .post('/api/breach/email')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ email: 'test@example.com' });
      
      expect(res.status).not.toBe(401);
    });
  });

  describe('Public Route Accessibility', () => {
    test('Public GET /health remains accessible (HTTP 200)', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status', 'ok');
    });

    test('Public GET /api/status remains accessible (HTTP 200)', async () => {
      const res = await request(app).get('/api/status');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('services');
    });
  });

  describe('Team Privacy & Sushant Member Static Data Verification', () => {
    test('TeamPage.jsx does not expose public email or phone properties in team array', () => {
      const teamPagePath = path.join(__dirname, '../../client/src/pages/TeamPage.jsx');
      const content = fs.readFileSync(teamPagePath, 'utf8');

      expect(content).not.toContain("email: 'pandeysuryansh560@gmail.com'");
      expect(content).not.toContain("phone: '+917565813054'");
      expect(content).not.toContain("email: 'aryanpatel9171235114@gmail.com'");
      expect(content).not.toContain("email: 'official.cybershieldx@gmail.com'");
      expect(content).not.toContain("mailto:${selectedMember.email}");
      expect(content).not.toContain("tel:${selectedMember.phone}");
    });

    test('homeData.js does not expose public email or phone properties in team array', () => {
      const homeDataPath = path.join(__dirname, '../../client/src/data/homeData.js');
      const content = fs.readFileSync(homeDataPath, 'utf8');

      expect(content).not.toContain("pandeysuryansh560@gmail.com");
      expect(content).not.toContain("+917565813054");
      expect(content).not.toContain("aryanpatel9171235114@gmail.com");
    });

    test('TeamPage.jsx includes Sushant as Data Analyst', () => {
      const teamPagePath = path.join(__dirname, '../../client/src/pages/TeamPage.jsx');
      const content = fs.readFileSync(teamPagePath, 'utf8');

      expect(content).toContain("name: 'Sushant'");
      expect(content).toContain("role: 'Data Analyst'");
      expect(content).toContain("id: 'sushant'");
    });

    test('homeData.js includes Sushant as Data Analyst', () => {
      const homeDataPath = path.join(__dirname, '../../client/src/data/homeData.js');
      const content = fs.readFileSync(homeDataPath, 'utf8');

      expect(content).toContain("name: 'Sushant'");
      expect(content).toContain("role: 'Data Analyst'");
    });
  });
});
