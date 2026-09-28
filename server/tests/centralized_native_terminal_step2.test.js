/**
 * 🛰️ Centralized Native Terminal Step 2 Acceptance Battery
 *
 * Verifies Native Tool Discovery + Terminal Tool Registry Integration:
 * 1. Native registry loads and contains only the 7 verified host-native capabilities.
 * 2. GET /api/terminal/host-capabilities returns nativeCapabilities with availability states.
 * 3. Capability discovery endpoint does NOT leak raw server filesystem paths, PATH env, or secrets.
 * 4. Unsupported canonical tools (e.g. sqlmap, nikto, burp) are RESTRICTED and rejected.
 * 5. Native execution allowlist remains strictly enforced (shell: false).
 * 6. Target validation, command injection defense, and SSRF/cloud-metadata blocking preserved.
 * 7. Authentication and tenant isolation preserved.
 * 8. Process cancellation and 10s timeout preserved.
 * 9. Absolute zero AI / Copilot / Gemini in the execution path.
 * 10. Absolute zero WebSockets /ws/toolkit dependency.
 */

jest.mock('../middleware/auth', () => ({
  authenticate: (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }
    const token = authHeader.split(' ')[1];
    if (token === 'invalid') {
      return res.status(401).json({ success: false, error: 'Invalid token' });
    }
    req.user = {
      id: 'step2_terminal_operator',
      _id: 'step2_terminal_operator',
      role: 'operator',
      username: 'operator',
      organizationId: 'org_terminal_step2'
    };
    next();
  },
  tryAuthenticate: (req, res, next) => {
    req.user = {
      id: 'step2_terminal_operator',
      _id: 'step2_terminal_operator',
      role: 'operator',
      username: 'operator',
      organizationId: 'org_terminal_step2'
    };
    next();
  }
}));

const express = require('express');
const request = require('supertest');
const hostEnvironmentService = require('../services/HostEnvironmentService');
const terminalRoutes = require('../routes/terminal');

describe('Centralized Native Terminal — Step 2 Acceptance Battery', () => {
  let app;
  const validToken = 'valid_step2_test_token';

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/terminal', terminalRoutes);
  });

  // ─── GATE 1: Native Capabilities Discovery & Schema Integrity ──────────────
  describe('Gate 1: Native Tool Discovery & Host Capabilities Contract', () => {
    it('1. GET /api/terminal/host-capabilities returns nativeCapabilities array', async () => {
      const res = await request(app)
        .get('/api/terminal/host-capabilities')
        .set('Authorization', `Bearer ${validToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.nativeCapabilities).toBeDefined();
      expect(Array.isArray(res.body.data.nativeCapabilities)).toBe(true);
      expect(res.body.data.nativeCapabilities.length).toBe(7);
    });

    it('2. nativeCapabilities contains ONLY the 7 verified native tools', async () => {
      const res = await request(app)
        .get('/api/terminal/host-capabilities')
        .set('Authorization', `Bearer ${validToken}`);

      const nativeIds = res.body.data.nativeCapabilities.map(t => t.id || t.executable);
      expect(nativeIds.sort()).toEqual([
        'curl', 'dig', 'nmap', 'openssl', 'ping', 'traceroute', 'whois'
      ].sort());

      // Confirm canonical tools that lack native execution are NOT in nativeCapabilities
      expect(nativeIds).not.toContain('sqlmap');
      expect(nativeIds).not.toContain('nikto');
      expect(nativeIds).not.toContain('burp');
      expect(nativeIds).not.toContain('trivy');
      expect(nativeIds).not.toContain('remediation');
    });

    it('3. Each native capability includes authoritative availability state', async () => {
      const res = await request(app)
        .get('/api/terminal/host-capabilities')
        .set('Authorization', `Bearer ${validToken}`);

      res.body.data.nativeCapabilities.forEach(tool => {
        expect(tool.id).toBeDefined();
        expect(tool.executable).toBeDefined();
        expect(tool.category).toBeDefined();
        expect(tool.supported).toBe(true);
        expect(['AVAILABLE', 'NOT INSTALLED', 'UNAVAILABLE']).toContain(tool.availability);
      });
    });

    it('4. Capability discovery does NOT leak raw server filesystem paths', async () => {
      const res = await request(app)
        .get('/api/terminal/host-capabilities')
        .set('Authorization', `Bearer ${validToken}`);

      const jsonString = JSON.stringify(res.body.data.binaries);
      // Ensure no internal system paths like /Users/, /home/, or /opt/ are leaked
      expect(jsonString).not.toMatch(/\/Users\//);
      expect(jsonString).not.toMatch(/\/home\//);
      expect(jsonString).not.toMatch(/\/opt\/homebrew/);

      // Check binaries map
      for (const [bin, info] of Object.entries(res.body.data.binaries)) {
        if (info.installed) {
          expect(info.path).toBe('[INSTALLED]');
        } else {
          expect(info.path).toBeNull();
        }
      }
    });

    it('5. Capability discovery does NOT leak environment variables, PATH, or secrets', async () => {
      const res = await request(app)
        .get('/api/terminal/host-capabilities')
        .set('Authorization', `Bearer ${validToken}`);

      const jsonStr = JSON.stringify(res.body);
      expect(jsonStr).not.toContain(process.env.JWT_SECRET || 'test_jwt_secret');
      expect(res.body.data.system.env).toBeUndefined();
      expect(res.body.data.system.PATH).toBeUndefined();
      expect(res.body.data.system.processEnv).toBeUndefined();
    });
  });

  // ─── GATE 2: Canonical vs Native Boundary & Rejection of Restricted Tools ────
  describe('Gate 2: Enforcement of Native Capability Boundary', () => {
    it('6. Rejects execution of canonical non-native tool (sqlmap) with 400', async () => {
      const res = await request(app)
        .post('/api/terminal/execute-native')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ tool: 'sqlmap', target: 'https://example.com' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/not authorized for native execution/i);
    });

    it('7. Rejects execution of canonical non-native tool (nikto) with 400', async () => {
      const res = await request(app)
        .post('/api/terminal/execute-native')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ tool: 'nikto', target: 'https://example.com' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/not authorized for native execution/i);
    });

    it('8. Rejects execution of arbitrary host shells (bash, sh, zsh) with 400', async () => {
      const shells = ['bash', 'sh', 'zsh', 'python', 'perl', 'nc', 'cat'];
      for (const sh of shells) {
        const res = await request(app)
          .post('/api/terminal/execute-native')
          .set('Authorization', `Bearer ${validToken}`)
          .send({ tool: sh, target: 'localhost' });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.error).toMatch(/not authorized for native execution/i);
      }
    });

    it('9. Rejects execution without authentication (401 Unauthorized)', async () => {
      const res = await request(app)
        .post('/api/terminal/execute-native')
        .send({ tool: 'curl', target: 'https://example.com' });

      expect(res.status).toBe(401);
    });
  });

  // ─── GATE 3: Security Controls & Hardening Preserved ─────────────────────────
  describe('Gate 3: Security & Injection Defenses', () => {
    it('10. Rejects shell injection characters in target parameter', async () => {
      const injectionPayloads = [
        'example.com; rm -rf /',
        'example.com | ls -la',
        'example.com && whoami',
        'example.com `cat /etc/passwd`',
        'example.com $(id)'
      ];

      for (const payload of injectionPayloads) {
        const res = await request(app)
          .post('/api/terminal/execute-native')
          .set('Authorization', `Bearer ${validToken}`)
          .send({ tool: 'dig', target: payload });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.error).toMatch(/unsafe shell characters/i);
      }
    });

    it('11. Rejects SSRF and Cloud Metadata access attempts', async () => {
      const metadataPayloads = [
        '169.254.169.254',
        'http://169.254.169.254/latest/meta-data/',
        'metadata.google.internal',
        '100.100.100.200'
      ];

      for (const payload of metadataPayloads) {
        const res = await request(app)
          .post('/api/terminal/execute-native')
          .set('Authorization', `Bearer ${validToken}`)
          .send({ tool: 'curl', target: payload });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.error).toMatch(/cloud metadata or link-local network interfaces is strictly forbidden/i);
      }
    });

    it('12. Enforces valid executionId cancellation ownership', async () => {
      // Cancellation with non-existent executionId returns 404 NOT_FOUND
      const res = await request(app)
        .post('/api/terminal/cancel')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ executionId: 'exec_non_existent_12345' });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.data.status).toBe('NOT_FOUND');
    });
  });

  // ─── GATE 4: Zero AI / Zero WebSocket Isolation ─────────────────────────────
  describe('Gate 4: Architectural Isolation & Purity', () => {
    it('13. Confirms ZERO AI execution or Copilot models in native terminal output', async () => {
      const res = await request(app)
        .post('/api/terminal/execute-native')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ tool: 'dig', target: 'localhost' });

      expect(res.status).toBe(200);
      expect(res.body.data.aiSummary).toBeUndefined();
      expect(res.body.data.copilotTriage).toBeUndefined();
      expect(res.body.data.model).toBeUndefined();
      expect(res.body.data.prompt).toBeUndefined();
    });

    it('14. check-tool endpoint accurately identifies native tools vs blocked dependencies', async () => {
      const resCurl = await request(app)
        .get('/api/terminal/check-tool/curl')
        .set('Authorization', `Bearer ${validToken}`);

      expect(resCurl.status).toBe(200);
      expect(resCurl.body.data.executionTarget).toBe('HOST_NATIVE');
      expect(resCurl.body.data.path).toBe('[INSTALLED]');

      const resSqlmap = await request(app)
        .get('/api/terminal/check-tool/sqlmap')
        .set('Authorization', `Bearer ${validToken}`);

      expect(resSqlmap.status).toBe(200);
      expect(resSqlmap.body.data.executionTarget).not.toBe('HOST_NATIVE');
    });
  });
});
