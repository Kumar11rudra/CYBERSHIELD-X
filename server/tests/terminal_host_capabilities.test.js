jest.mock('../middleware/auth', () => ({
  authenticate: (req, res, next) => {
    req.user = { _id: 'test-user-id', role: 'operator', username: 'auditor' };
    next();
  },
  tryAuthenticate: (req, res, next) => {
    req.user = { _id: 'test-user-id', role: 'operator', username: 'auditor' };
    next();
  }
}));

const request = require('supertest');
const express = require('express');
const hostEnvironmentService = require('../services/HostEnvironmentService');
const terminalRoutes = require('../routes/terminal');

describe('🛰️ Host Environment & System-Aware Terminal Capabilities', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/terminal', terminalRoutes);
  });

  describe('HostEnvironmentService unit tests', () => {
    it('should audit host system hardware and OS environment', async () => {
      const caps = await hostEnvironmentService.getHostCapabilities(true);
      expect(caps).toBeDefined();
      expect(caps.system).toBeDefined();
      expect(typeof caps.system.hostOs).toBe('string');
      expect(typeof caps.system.arch).toBe('string');
      expect(caps.system.memory.totalMb).toBeGreaterThan(0);
      expect(caps.system.network.primaryInterface).toBeDefined();
    });

    it('should calculate readiness score and detect native binaries', async () => {
      const caps = await hostEnvironmentService.getHostCapabilities();
      expect(caps.readiness).toBeDefined();
      expect(caps.readiness.totalMonitoredBinaries).toBeGreaterThan(20);
      expect(typeof caps.readiness.readinessScorePercent).toBe('number');
      expect(caps.binaries).toBeDefined();

      // Check common unix system utilities that should exist on mac/linux
      expect(caps.binaries.curl.installed).toBe(true);
      expect(caps.binaries.curl.nativeExecutionSupported).toBe(true);
    });

    it('should resolve tool capability and provide remediation for missing binaries', async () => {
      const cap = await hostEnvironmentService.checkToolCapability('sqlmap');
      expect(cap).toBeDefined();
      expect(cap.toolId).toBe('sqlmap');
      // On this host sqlmap is not installed natively
      if (!cap.installed) {
        expect(cap.executionTarget).toBe('BLOCKED_DEPENDENCY');
        expect(cap.remediation).toBeDefined();
      }
    });

    it('should reject unsafe shell control characters during native tool execution', async () => {
      await expect(
        hostEnvironmentService.executeNativeTool('dig', 'example.com; rm -rf /')
      ).rejects.toThrow(/unsafe shell characters/i);
    });

    it('should reject unauthorized tools from native process execution', async () => {
      await expect(
        hostEnvironmentService.executeNativeTool('rm', 'file.txt')
      ).rejects.toThrow(/not authorized/i);
    });

    it('should safely execute an authorized native binary (dig)', async () => {
      const result = await hostEnvironmentService.executeNativeTool('dig', 'localhost');
      expect(result).toBeDefined();
      expect(result.tool).toBe('dig');
      expect(result.executionTarget).toBe('HOST_NATIVE');
      expect(result.durationMs).toBeGreaterThanOrEqual(0);
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toMatch(/127\.0\.0\.1|localhost|QUESTION/i);
    }, 15000);
  });

  describe('Terminal Express API Endpoints', () => {
    it('GET /api/terminal/host-capabilities returns live host data', async () => {
      const res = await request(app).get('/api/terminal/host-capabilities');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.system.hostOs).toBeDefined();
      expect(res.body.data.readiness).toBeDefined();
    });

    it('GET /api/terminal/check-tool/:toolId returns individual capability check', async () => {
      const res = await request(app).get('/api/terminal/check-tool/curl');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.toolId).toBe('curl');
      expect(res.body.data.installed).toBe(true);
    });

    it('POST /api/terminal/execute-native executes approved native tool', async () => {
      const res = await request(app)
        .post('/api/terminal/execute-native')
        .send({ tool: 'dig', target: 'localhost' });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.executionTarget).toBe('HOST_NATIVE');
      expect(res.body.data.stdout).toBeDefined();
    }, 15000);

    it('POST /api/terminal/execute-native rejects injection attempts', async () => {
      const res = await request(app)
        .post('/api/terminal/execute-native')
        .send({ tool: 'dig', target: 'localhost | cat /etc/passwd' });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/unsafe shell characters/i);
    });
  });
});
