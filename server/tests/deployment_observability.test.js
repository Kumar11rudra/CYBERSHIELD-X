/**
 * CyberShield X — Phase 21 & Phase 22: Nexus Real Deployment Observability & Data Integrity
 * Test Suite: Deployment Observability, Provider Adapters & Zero-Fabrication Integrity
 */

const request = require('supertest');
const mongoose = require('mongoose');
const { app } = require('../index');
const DeploymentService = require('../services/deployment/DeploymentService');
const GitHubDeploymentAdapter = require('../services/deployment/adapters/GitHubDeploymentAdapter');
const VercelDeploymentAdapter = require('../services/deployment/adapters/VercelDeploymentAdapter');
const RenderDeploymentAdapter = require('../services/deployment/adapters/RenderDeploymentAdapter');
const { generateToken } = require('../utils/jwt');
const User = require('../models/User');
const UserRepository = require('../services/auth/UserRepository');

describe('Phase 21 & Phase 22 — Deployment Observability & Data Integrity', () => {
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

  describe('RBAC Security Enforcement for /api/admin/deployments', () => {
    it('1. Anonymous request should return 401 Unauthorized', async () => {
      const res = await request(app).get('/api/admin/deployments');
      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('error');
    });

    it('2. Normal user request should return 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/admin/deployments')
        .set('Authorization', `Bearer ${normalToken}`);
      expect(res.statusCode).toBe(403);
      expect(res.body).toHaveProperty('error');
    });

    it('3. Admin user request should return 200 OK with valid normalized deployment schema', async () => {
      const res = await request(app)
        .get('/api/admin/deployments')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('overallStatus');
      expect(res.body).toHaveProperty('timestamp');
      expect(Array.isArray(res.body.providers)).toBe(true);
      expect(Array.isArray(res.body.applications)).toBe(true);
      expect(res.body).toHaveProperty('pipeline');
      expect(Array.isArray(res.body.history)).toBe(true);
    });
  });

  describe('Deployment Provider Adapters & Aggregator Contract', () => {
    it('4. GitHubDeploymentAdapter returns NOT_CONFIGURED when token is unconfigured', async () => {
      const savedToken = process.env.GITHUB_TOKEN;
      delete process.env.GITHUB_TOKEN;
      delete process.env.GH_TOKEN;

      const adapter = new GitHubDeploymentAdapter();
      const result = await adapter.getDeploymentData();
      expect(result.configured).toBe(false);
      expect(result.status).toBe('NOT_CONFIGURED');

      if (savedToken) process.env.GITHUB_TOKEN = savedToken;
    });

    it('5. VercelDeploymentAdapter returns NOT_CONFIGURED when token is unconfigured', async () => {
      const savedToken = process.env.VERCEL_TOKEN;
      delete process.env.VERCEL_TOKEN;

      const adapter = new VercelDeploymentAdapter();
      const result = await adapter.getDeploymentData();
      expect(result.configured).toBe(false);
      expect(result.status).toBe('NOT_CONFIGURED');

      if (savedToken) process.env.VERCEL_TOKEN = savedToken;
    });

    it('6. RenderDeploymentAdapter returns NOT_CONFIGURED when API key is unconfigured', async () => {
      const savedKey = process.env.RENDER_API_KEY;
      delete process.env.RENDER_API_KEY;

      const adapter = new RenderDeploymentAdapter();
      const result = await adapter.getDeploymentData();
      expect(result.configured).toBe(false);
      expect(result.status).toBe('NOT_CONFIGURED');

      if (savedKey) process.env.RENDER_API_KEY = savedKey;
    });

    it('7. Provider Failure Isolation — Endpoint handles adapter exceptions gracefully', async () => {
      const service = new DeploymentService();
      jest.spyOn(service.gitHubAdapter, 'getDeploymentData').mockRejectedValue(new Error('Network timeout'));

      const result = await service.getDeploymentObservability();
      expect(result).toHaveProperty('overallStatus');
      expect(Array.isArray(result.providers)).toBe(true);
      const gh = result.providers.find((p) => p.id === 'github');
      expect(gh.status).toBe('DEGRADED');
    });

    it('8. Bounded Deployment History — Limits history records to max 10 items', async () => {
      const service = new DeploymentService();
      const mockHistory = Array.from({ length: 15 }, (_, i) => ({
        id: `run-${i}`,
        name: `Workflow Run ${i}`,
        status: 'PASSING',
        createdAt: new Date().toISOString()
      }));

      jest.spyOn(service.gitHubAdapter, 'getDeploymentData').mockResolvedValue({
        id: 'github',
        name: 'GitHub Actions',
        configured: true,
        status: 'HEALTHY',
        latest: mockHistory[0],
        history: mockHistory
      });

      const result = await service.getDeploymentObservability();
      expect(result.history.length).toBeLessThanOrEqual(10);
    });

    it('9. Security Leak Audit — Response contains zero API tokens, passwords, or DB URIs', async () => {
      const service = new DeploymentService();
      const result = await service.getDeploymentObservability();
      const jsonString = JSON.stringify(result);

      if (process.env.MONGODB_URI) expect(jsonString).not.toContain(process.env.MONGODB_URI);
      if (process.env.JWT_SECRET) expect(jsonString).not.toContain(process.env.JWT_SECRET);
      expect(jsonString).not.toContain('password');
      expect(jsonString).not.toContain('bearerToken');
      expect(jsonString).not.toContain('privateKey');
    });
  });

  describe('Phase 22 — Zero-Fabrication & Authoritative Data Integrity Audits', () => {
    it('10. Backend status cannot become LIVE solely because NODE_ENV=production or RENDER_SERVICE_ID is set', async () => {
      const oldEnv = process.env.NODE_ENV;
      const oldRenderKey = process.env.RENDER_API_KEY;
      delete process.env.RENDER_API_KEY;
      process.env.NODE_ENV = 'production';

      const service = new DeploymentService();
      const result = await service.getDeploymentObservability();
      const backend = result.applications.find((a) => a.id === 'backend');

      expect(backend.deploymentStatus).not.toBe('LIVE');
      expect(backend.deploymentStatus).toBe('NOT_CONFIGURED');

      process.env.NODE_ENV = oldEnv;
      if (oldRenderKey) process.env.RENDER_API_KEY = oldRenderKey;
    });

    it('11. Unconfigured pipeline stages return NOT_CONFIGURED instead of defaulting to PASSED', async () => {
      const oldGhToken = process.env.GITHUB_TOKEN;
      delete process.env.GITHUB_TOKEN;
      delete process.env.GH_TOKEN;

      const service = new DeploymentService();
      const result = await service.getDeploymentObservability();

      expect(result.pipeline.build).toBe('NOT_CONFIGURED');
      expect(result.pipeline.test).toBe('NOT_CONFIGURED');

      if (oldGhToken) process.env.GITHUB_TOKEN = oldGhToken;
    });

    it('12. Missing metadata (commit SHA, branch, timestamps) normalizes to null rather than fake placeholders', async () => {
      const oldGhToken = process.env.GITHUB_TOKEN;
      delete process.env.GITHUB_TOKEN;
      delete process.env.GH_TOKEN;

      const service = new DeploymentService();
      const result = await service.getDeploymentObservability();
      const cicd = result.applications.find((a) => a.id === 'cicd');

      expect(cicd.commitSha).toBeNull();
      expect(cicd.branch).toBeNull();
      expect(cicd.deployedAt).toBeNull();

      if (oldGhToken) process.env.GITHUB_TOKEN = oldGhToken;
    });

    it('13. DEPLOY pipeline stage becomes PASSED only when an authoritative provider confirms LIVE state', async () => {
      const service = new DeploymentService();
      jest.spyOn(service.vercelAdapter, 'getDeploymentData').mockResolvedValue({
        id: 'vercel',
        name: 'Vercel',
        configured: true,
        status: 'HEALTHY',
        latest: { status: 'LIVE', commit: 'abc1234', branch: 'main' },
        history: []
      });

      const result = await service.getDeploymentObservability();
      expect(result.pipeline.deploy).toBe('PASSED');
    });

    it('14. DEPLOY pipeline stage becomes DEGRADED when provider is configured but not LIVE', async () => {
      const service = new DeploymentService();
      jest.spyOn(service.vercelAdapter, 'getDeploymentData').mockResolvedValue({
        id: 'vercel',
        name: 'Vercel',
        configured: true,
        status: 'DEGRADED',
        latest: { status: 'BUILDING', commit: 'abc1234', branch: 'main' },
        history: []
      });

      const result = await service.getDeploymentObservability();
      expect(result.pipeline.deploy).toBe('DEGRADED');
    });
  });
});
