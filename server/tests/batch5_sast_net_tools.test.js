const {
  traceRoute,
  auditBgpRoute,
  lintOasSpec,
  runSemgrepSast,
  auditDependencyTrack
} = require('../services/netSastApiToolService');

describe('Batch 5 Network Tracing, SAST & API Spec Tool Service Tests', () => {
  describe('traceRoute', () => {
    it('traces network hops to target domain and measures latency', async () => {
      const res = await traceRoute('example.com');
      expect(res).toBeDefined();
      expect(res.target).toBe('example.com');
      expect(Array.isArray(res.hops)).toBe(true);
      expect(res.hops.length).toBeGreaterThanOrEqual(3);
      expect(res.hops[res.hops.length - 1].status).toBe('DESTINATION_REACHED');
    });
  });

  describe('auditBgpRoute', () => {
    it('audits BGP routing announcements and validates RPKI status', async () => {
      const res = await auditBgpRoute('1.1.1.1');
      expect(res).toBeDefined();
      expect(res.originAsn).toBeDefined();
      expect(res.rpkiRoaStatus).toBe('VALID');
      expect(Array.isArray(res.transitTier1Peers)).toBe(true);
    });
  });

  describe('lintOasSpec', () => {
    it('flags insecure HTTP servers and missing security schemes in OpenAPI JSON', async () => {
      const badSpec = JSON.stringify({
        openapi: '3.0.0',
        info: { title: 'Test Vulnerable API', version: '1.0.0' },
        servers: [{ url: 'http://insecure-api.example.com' }],
        paths: {
          '/users': { get: { summary: 'Get Users' } },
          '/admin/secrets': { get: { summary: 'Get Admin Secrets' } }
        }
      });

      const res = await lintOasSpec(badSpec);
      expect(res).toBeDefined();
      expect(res.grade).toBe('CRITICAL');
      expect(res.findings.some(f => f.rule === 'InsecureServerUrl')).toBe(true);
      expect(res.findings.some(f => f.rule === 'MissingGlobalSecurity')).toBe(true);
      expect(res.findings.some(f => f.rule === 'AdministrativeEndpointsExposed')).toBe(true);
    });

    it('validates compliant secure OpenAPI spec with HTTPS and bearer auth', async () => {
      const goodSpec = JSON.stringify({
        openapi: '3.0.0',
        info: { title: 'Secure API', version: '1.0.0' },
        servers: [{ url: 'https://secure-api.example.com' }],
        security: [{ bearerAuth: [] }],
        paths: {
          '/status': { get: { summary: 'Status Check' } }
        }
      });

      const res = await lintOasSpec(goodSpec);
      expect(res).toBeDefined();
      expect(res.securityScore).toBe('100/100');
      expect(res.grade).toBe('PASSED');
      expect(res.findingsCount).toBe(0);
    });
  });

  describe('runSemgrepSast', () => {
    it('flags dynamic eval, raw SQL concatenation, and command injections in source code', async () => {
      const vulnerableCode = `
        function handleQuery(req, res) {
          const userQuery = "SELECT * FROM accounts WHERE id = " + req.query.id;
          eval(req.body.customCode);
          child_process.exec(\`tar -czf \${req.query.file}.tar.gz /tmp\`);
          return res.send("Done");
        }
      `;

      const res = await runSemgrepSast(vulnerableCode);
      expect(res).toBeDefined();
      expect(res.riskLevel).toBe('CRITICAL');
      expect(res.vulnerabilitiesCount).toBeGreaterThanOrEqual(3);
      expect(res.findings.some(f => f.cwe === 'CWE-89')).toBe(true);
      expect(res.findings.some(f => f.cwe === 'CWE-95')).toBe(true);
    });

    it('returns clean assessment on safe code', async () => {
      const safeCode = `
        async function getUser(id) {
          const user = await db.query('SELECT * FROM accounts WHERE id = $1', [id]);
          return JSON.parse(JSON.stringify(user));
        }
      `;

      const res = await runSemgrepSast(safeCode);
      expect(res).toBeDefined();
      expect(res.riskLevel).toBe('SECURE');
      expect(res.vulnerabilitiesCount).toBe(0);
    });
  });

  describe('auditDependencyTrack', () => {
    it('identifies vulnerable libraries from package.json manifest', async () => {
      const manifest = JSON.stringify({
        name: 'test-app',
        dependencies: {
          lodash: '4.17.15',
          axios: '0.21.1',
          react: '18.2.0'
        }
      });

      const res = await auditDependencyTrack(manifest);
      expect(res).toBeDefined();
      expect(res.totalPackagesAudited).toBe(3);
      expect(res.vulnerabilitiesCount).toBe(2);
      expect(res.alerts.some(a => a.package === 'lodash')).toBe(true);
    });
  });
});
