/**
 * CyberShield X — Phase 20: Nexus Deployment & Infrastructure Observability
 * Test Suite: Admin System Health & Observability Aggregator
 */

const request = require('supertest');
const mongoose = require('mongoose');
const { app } = require('../index');
const SystemHealthService = require('../services/admin/SystemHealthService');
const { generateToken } = require('../utils/jwt');
const User = require('../models/User');

const UserRepository = require('../services/auth/UserRepository');

describe('Phase 20 — System Health Observability & Admin RBAC', () => {
  const mockAdminId = new mongoose.Types.ObjectId().toString();
  const mockUserId = new mongoose.Types.ObjectId().toString();
  const adminToken = generateToken({ id: mockAdminId });
  const normalToken = generateToken({ id: mockUserId });

  beforeAll(() => {
    const mockAdminUser = { _id: mockAdminId, id: mockAdminId, role: 'admin', isBanned: false };
    const mockNormalUser = { _id: mockUserId, id: mockUserId, role: 'user', isBanned: false };

    jest.spyOn(UserRepository.prototype, 'findById').mockImplementation(async (id) => {
      const idStr = id ? id.toString() : '';
      if (idStr === mockAdminId) return mockAdminUser;
      if (idStr === mockUserId) return mockNormalUser;
      return null;
    });

    jest.spyOn(User, 'findById').mockImplementation((id) => {
      const idStr = id ? id.toString() : '';
      if (idStr === mockAdminId) {
        return {
          select: () => Promise.resolve(mockAdminUser)
        };
      }
      if (idStr === mockUserId) {
        return {
          select: () => Promise.resolve(mockNormalUser)
        };
      }
      return {
        select: () => Promise.resolve(null)
      };
    });
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  describe('RBAC Security Enforcement for /api/admin/system-health', () => {
    it('1. Anonymous request should return 401 Unauthorized', async () => {
      const res = await request(app).get('/api/admin/system-health');
      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('error');
    });

    it('2. Normal user request should return 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/admin/system-health')
        .set('Authorization', `Bearer ${normalToken}`);
      expect(res.statusCode).toBe(403);
      expect(res.body).toHaveProperty('error');
    });

    it('3. Admin user request should return 200 OK with valid health telemetry', async () => {
      const res = await request(app)
        .get('/api/admin/system-health')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('overallStatus');
      expect(res.body).toHaveProperty('timestamp');
      expect(res.body).toHaveProperty('summary');
      expect(res.body).toHaveProperty('backend');
      expect(res.body).toHaveProperty('database');
      expect(res.body).toHaveProperty('authentication');
      expect(res.body).toHaveProperty('ai');
      expect(res.body).toHaveProperty('threatIntelligence');
      expect(res.body).toHaveProperty('deployment');
      expect(Array.isArray(res.body.services)).toBe(true);
    });
  });

  describe('SystemHealthService Aggregator Logic & Security Contract', () => {
    let healthService;

    beforeEach(() => {
      healthService = new SystemHealthService();
    });

    it('4. SystemHealthService should return valid structured contract', async () => {
      const result = await healthService.getDetailedSystemHealth();
      expect(result).toHaveProperty('overallStatus');
      expect(['HEALTHY', 'DEGRADED', 'OFFLINE', 'UNKNOWN']).toContain(result.overallStatus);
      expect(result.backend.status).toBe('HEALTHY');
      expect(typeof result.backend.uptime).toBe('number');
      expect(typeof result.backend.errorRate).toBe('number');
    });

    it('5. Degradation handling — overall status drops to DEGRADED when sub-service is degraded', async () => {
      jest.spyOn(healthService, 'checkDatabaseHealth').mockResolvedValue({
        status: 'HEALTHY',
        connectionState: 'connected',
        latencyMs: 5,
        detail: 'MongoDB cluster operational'
      });
      jest.spyOn(healthService, 'checkThreatIntelligenceHealth').mockReturnValue({
        status: 'DEGRADED',
        configured: true,
        providers: ['Mock Provider'],
        detail: 'Simulated degradation'
      });

      const result = await healthService.getDetailedSystemHealth();
      expect(result.overallStatus).toBe('DEGRADED');
    });

    it('6. Security Data Leakage Audit — Response contains zero sensitive credentials or connection URIs', async () => {
      const result = await healthService.getDetailedSystemHealth();
      const jsonString = JSON.stringify(result);

      if (process.env.MONGODB_URI) {
        expect(jsonString).not.toContain(process.env.MONGODB_URI);
      }
      if (process.env.JWT_SECRET) {
        expect(jsonString).not.toContain(process.env.JWT_SECRET);
      }
      expect(jsonString).not.toContain('password');
      expect(jsonString).not.toContain('bearerToken');
      expect(jsonString).not.toContain('privateKey');
    });

    it('7. Deployment Status — Returns NOT CONFIGURED when CI/CD provider integration is absent', async () => {
      const savedVercel = process.env.VERCEL;
      const savedRender = process.env.RENDER_SERVICE_ID;
      const savedGithub = process.env.GITHUB_SHA;
      const savedGit = process.env.GIT_COMMIT;

      delete process.env.VERCEL;
      delete process.env.RENDER_SERVICE_ID;
      delete process.env.GITHUB_SHA;
      delete process.env.GIT_COMMIT;

      const result = healthService.checkDeploymentHealth();
      expect(result.status).toBe('NOT CONFIGURED');
      expect(result.provider).toBe('DEFERRED — DEPLOYMENT PROVIDER INTEGRATION REQUIRED');

      if (savedVercel) process.env.VERCEL = savedVercel;
      if (savedRender) process.env.RENDER_SERVICE_ID = savedRender;
      if (savedGithub) process.env.GITHUB_SHA = savedGithub;
      if (savedGit) process.env.GIT_COMMIT = savedGit;
    });
  });
});
