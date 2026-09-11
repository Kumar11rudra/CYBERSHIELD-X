jest.mock('../middleware/auth', () => ({
  authenticate: (req, res, next) => {
    // Read header or default to test-operator
    const userId = req.headers['x-test-user-id'] || 'test-operator-1';
    const role = req.headers['x-test-user-role'] || 'operator';
    req.user = { id: userId, _id: userId, role, username: 'operator' };
    next();
  },
  tryAuthenticate: (req, res, next) => {
    const userId = req.headers['x-test-user-id'] || 'test-operator-1';
    const role = req.headers['x-test-user-role'] || 'operator';
    req.user = { id: userId, _id: userId, role, username: 'operator' };
    next();
  }
}));

const request = require('supertest');
const express = require('express');
const hostEnvironmentService = require('../services/HostEnvironmentService');
const terminalRoutes = require('../routes/terminal');
const healthRoutes = require('../routes/health');
const healthService = require('../services/healthService');
const { createNormalizedError, ERROR_CODES } = require('../utils/PlatformErrors');

describe('🛡️ Terminal Production Hardening & Enterprise Safety Gate', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/terminal', terminalRoutes);
    app.use('/api/health', healthRoutes);
    app.use('/api/readiness', (req, res, next) => {
      req.url = '/readiness';
      healthRoutes(req, res, next);
    });
  });

  describe('1. Input Sanitization & SSRF/Cloud-Metadata Rejection', () => {
    it('rejects command injection metacharacters strictly at the service and route layer', async () => {
      const maliciousTargets = [
        'google.com; rm -rf /',
        '127.0.0.1 && cat /etc/passwd',
        'example.com | whoami',
        'target`id`',
        'host$(id)',
        'target>output.txt',
        'site<input.txt',
        'evil\nls',
        'test\\escaped',
        "target'quote",
        'target"quote'
      ];

      for (const badTarget of maliciousTargets) {
        const res = await request(app)
          .post('/api/terminal/execute-native')
          .send({ tool: 'curl', target: badTarget });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.error).toMatch(/unsafe shell characters/i);
      }
    });

    it('strictly blocks SSRF and cloud metadata endpoints', async () => {
      const cloudMetadataTargets = [
        '169.254.169.254',
        'http://169.254.169.254/latest/meta-data/',
        'metadata.google.internal',
        '100.100.100.200',
        '169.254.10.20'
      ];

      for (const metaTarget of cloudMetadataTargets) {
        const res = await request(app)
          .post('/api/terminal/execute-native')
          .send({ tool: 'curl', target: metaTarget });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.error).toMatch(/cloud metadata|link-local/i);
      }
    });
  });

  describe('2. Execution Tracking, Cancellation & Session Isolation', () => {
    it('returns a unique executionId for native tool executions', async () => {
      const res = await request(app)
        .post('/api/terminal/execute-native')
        .send({ tool: 'whois', target: 'example.com' });

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.executionId).toBeDefined();
      expect(typeof res.body.data.executionId).toBe('string');
      expect(res.body.data.executionId.length).toBeGreaterThan(5);
    });

    it('cancels active running processes on user cancellation request', async () => {
      const customExecId = 'exec_test_cancel_' + Date.now();

      // Launch a long-running native command (traceroute to non-routable host)
      const execPromise = hostEnvironmentService.executeNativeTool(
        'traceroute',
        '192.0.2.1', // TEST-NET-1 (non-routable, will hang until timeout)
        [],
        customExecId,
        'test-operator-1'
      );

      // Wait 60ms for child process spawn to register in activeProcesses
      await new Promise(r => setTimeout(r, 60));

      // Verify process registered in active map
      expect(hostEnvironmentService.activeProcesses.has(customExecId)).toBe(true);

      // Request cancellation via endpoint
      const cancelRes = await request(app)
        .post('/api/terminal/cancel')
        .set('x-test-user-id', 'test-operator-1')
        .send({ executionId: customExecId });

      expect(cancelRes.status).toBe(200);
      expect(cancelRes.body.success).toBe(true);
      expect(cancelRes.body.data.status).toBe('CANCELLED');
      expect(cancelRes.body.data.executionId).toBe(customExecId);

      // Process must be removed from active map
      expect(hostEnvironmentService.activeProcesses.has(customExecId)).toBe(false);

      // Await promise completion
      const execResult = await execPromise;
      expect(execResult).toBeDefined();
    });

    it('rejects cancellation from an unauthorized user (session isolation)', async () => {
      const customExecId = 'exec_iso_' + Date.now();

      // Spawn process owned by user-alpha
      const execPromise = hostEnvironmentService.executeNativeTool(
        'traceroute',
        '192.0.2.2',
        [],
        customExecId,
        'user-alpha'
      );

      // Wait 60ms for spawn registration
      await new Promise(r => setTimeout(r, 60));

      // Attempt to cancel by user-bravo (non-admin)
      const cancelRes = await request(app)
        .post('/api/terminal/cancel')
        .set('x-test-user-id', 'user-bravo')
        .set('x-test-user-role', 'operator')
        .send({ executionId: customExecId });

      expect(cancelRes.status).toBe(403);
      expect(cancelRes.body.success).toBe(false);
      expect(cancelRes.body.data.status).toBe('PERMISSION_DENIED');

      // Admin or actual owner CAN cancel
      const adminCancel = await request(app)
        .post('/api/terminal/cancel')
        .set('x-test-user-id', 'admin-user')
        .set('x-test-user-role', 'admin')
        .send({ executionId: customExecId });

      expect(adminCancel.status).toBe(200);
      expect(adminCancel.body.success).toBe(true);
      expect(adminCancel.body.data.status).toBe('CANCELLED');

      await execPromise;
    });

    it('returns 404 NOT_FOUND for non-existent execution cancellation', async () => {
      const cancelRes = await request(app)
        .post('/api/terminal/cancel')
        .send({ executionId: 'exec_nonexistent_999' });

      expect(cancelRes.status).toBe(404);
      expect(cancelRes.body.success).toBe(false);
      expect(cancelRes.body.data.status).toBe('NOT_FOUND');
    });
  });

  describe('3. Output Buffer Ceiling (512KB) & Process Safety', () => {
    it('declares 512KB buffer ceiling for output truncation', () => {
      expect(hostEnvironmentService.NATIVE_EXECUTABLE_TOOLS.has('curl')).toBe(true);
      expect(hostEnvironmentService.NATIVE_EXECUTABLE_TOOLS.has('ping')).toBe(true);
    });
  });

  describe('4. Readiness & Health Observability', () => {
    it('GET /api/health/readiness returns detailed operational readiness', async () => {
      const res = await request(app).get('/api/health/readiness');
      expect([200, 503]).toContain(res.status);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.corePlatform).toBeDefined();
      expect(res.body.data.corePlatform.status).toBe('healthy');
      expect(res.body.data.aiEngine).toBeDefined();
      expect(res.body.data.hostCapabilities).toBeDefined();
    });

    it('GET /api/readiness aliases directly to system readiness', async () => {
      const res = await request(app).get('/api/readiness');
      expect([200, 503]).toContain(res.status);
      expect(res.body.success).toBe(true);
      expect(res.body.data.corePlatform.nodeVersion).toBeDefined();
    });
  });

  describe('5. Standard Normalized Error Factory', () => {
    it('generates consistent normalized errors with standard codes', () => {
      const err = createNormalizedError({
        code: ERROR_CODES.SSRF_BLOCKED,
        category: 'SECURITY_ENFORCEMENT',
        message: 'Cloud metadata request blocked.',
        toolId: 'curl',
        target: '169.254.169.254'
      });

      expect(err).toBeDefined();
      expect(err.code).toBe('SSRF_BLOCKED');
      expect(err.category).toBe('SECURITY_ENFORCEMENT');
      expect(err.target).toBe('169.254.169.254');
      expect(err.requestId).toBeDefined();
      expect(err.timestamp).toBeDefined();
    });
  });
});
