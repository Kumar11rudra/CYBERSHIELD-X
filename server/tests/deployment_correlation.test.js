/**
 * CyberShield X — Phase 23: Deployment Health Correlation & Configuration Validation Engine
 * Test Suite: Health Correlation, Provider Configuration Readiness & Security
 */

const request = require('supertest');
const mongoose = require('mongoose');
const { app } = require('../index');
const DeploymentService = require('../services/deployment/DeploymentService');
const DeploymentHealthCorrelator = require('../services/deployment/DeploymentHealthCorrelator');
const DeploymentConfigValidator = require('../services/deployment/DeploymentConfigValidator');
const { generateToken } = require('../utils/jwt');
const User = require('../models/User');
const UserRepository = require('../services/auth/UserRepository');

describe('Phase 23 — Deployment Health Correlation & Config Readiness', () => {
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

  describe('RBAC Security Enforcement for /api/admin/deployments/correlation', () => {
    it('1. Anonymous request should return 401 Unauthorized', async () => {
      const res = await request(app).get('/api/admin/deployments/correlation');
      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('error');
    });

    it('2. Normal user request should return 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/admin/deployments/correlation')
        .set('Authorization', `Bearer ${normalToken}`);
      expect(res.statusCode).toBe(403);
      expect(res.body).toHaveProperty('error');
    });

    it('3. Admin user request should return 200 OK with valid correlation contract', async () => {
      const res = await request(app)
        .get('/api/admin/deployments/correlation')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('timestamp');
      expect(res.body).toHaveProperty('deploymentObservability');
      expect(res.body).toHaveProperty('correlation');
      expect(res.body).toHaveProperty('configReadiness');
    });
  });

  describe('DeploymentHealthCorrelator Engine Logic', () => {
    it('4. Returns NO_RECENT_DEPLOYMENTS when no deployments exist within the 30m window', () => {
      const correlator = new DeploymentHealthCorrelator();
      const systemHealth = { summary: { errorRate: 0, apiLatencyMs: 40 }, services: { database: { status: 'HEALTHY' } } };
      const deploymentData = { history: [] };

      const result = correlator.correlate(systemHealth, deploymentData);
      expect(result.status).toBe('NO_RECENT_DEPLOYMENTS');
      expect(result.recentDeployment).toBeNull();
    });

    it('5. Returns STABLE when deployment exists within 30m and telemetry is within nominal thresholds', () => {
      const correlator = new DeploymentHealthCorrelator();
      const recentDate = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const systemHealth = { summary: { errorRate: 0, apiLatencyMs: 45 }, services: { database: { status: 'HEALTHY' } } };
      const deploymentData = {
        history: [{ id: 'dep-1', provider: 'Vercel', service: 'Frontend', commit: 'abc1234', createdAt: recentDate }]
      };

      const result = correlator.correlate(systemHealth, deploymentData);
      expect(result.status).toBe('STABLE');
      expect(result.recentDeployment.id).toBe('dep-1');
      expect(result.anomalies.length).toBe(0);
    });

    it('6. Returns CORRELATED_DEGRADATION when deployment exists within 30m and error rate exceeds 5%', () => {
      const correlator = new DeploymentHealthCorrelator();
      const recentDate = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      const systemHealth = { summary: { errorRate: 12, apiLatencyMs: 50 }, services: { database: { status: 'HEALTHY' } } };
      const deploymentData = {
        history: [{ id: 'dep-2', provider: 'Render', service: 'Backend API', commit: 'def5678', createdAt: recentDate }]
      };

      const result = correlator.correlate(systemHealth, deploymentData);
      expect(result.status).toBe('CORRELATED_DEGRADATION');
      expect(result.impactedMetrics).toContain('errorRate');
      expect(result.anomalies.length).toBeGreaterThan(0);
    });

    it('7. Returns POST_DEPLOY_LATENCY_SPIKE when deployment exists within 30m and latency exceeds 300ms', () => {
      const correlator = new DeploymentHealthCorrelator();
      const recentDate = new Date(Date.now() - 15 * 60 * 1000).toISOString();
      const systemHealth = { summary: { errorRate: 1, apiLatencyMs: 450 }, services: { database: { status: 'HEALTHY' } } };
      const deploymentData = {
        history: [{ id: 'dep-3', provider: 'GitHub Actions', service: 'CI/CD', commit: '7890ghi', createdAt: recentDate }]
      };

      const result = correlator.correlate(systemHealth, deploymentData);
      expect(result.status).toBe('POST_DEPLOY_LATENCY_SPIKE');
      expect(result.impactedMetrics).toContain('apiLatency');
    });
  });

  describe('DeploymentConfigValidator Diagnostic Readiness Engine', () => {
    it('8. Reports missing required variables when provider tokens are unconfigured', () => {
      const savedGh = process.env.GITHUB_TOKEN;
      delete process.env.GITHUB_TOKEN;

      const validator = new DeploymentConfigValidator();
      const result = validator.validateConfiguration();

      expect(Array.isArray(result.providers)).toBe(true);
      expect(result.readinessScore).toBeDefined();

      const gh = result.providers.find((p) => p.id === 'github');
      expect(gh.configured).toBe(false);
      expect(gh.missingVariables).toContain('GITHUB_TOKEN');

      if (savedGh) process.env.GITHUB_TOKEN = savedGh;
    });

    it('9. Zero Credential Exposure — Output contains zero token values or secrets', () => {
      const savedGh = process.env.GITHUB_TOKEN;
      process.env.GITHUB_TOKEN = 'ghp_secret_token_1234567890_test';

      const validator = new DeploymentConfigValidator();
      const result = validator.validateConfiguration();
      const jsonString = JSON.stringify(result);

      expect(jsonString).not.toContain('ghp_secret_token_1234567890_test');
      expect(jsonString).not.toContain('secret');

      if (savedGh) process.env.GITHUB_TOKEN = savedGh;
      else delete process.env.GITHUB_TOKEN;
    });

    it('10. Calculates deterministic readiness score based on valid configurations', () => {
      const validator = new DeploymentConfigValidator();
      const result = validator.validateConfiguration();
      expect(result.readinessScore).toMatch(/^\d\/\d$/);
    });
  });
});
