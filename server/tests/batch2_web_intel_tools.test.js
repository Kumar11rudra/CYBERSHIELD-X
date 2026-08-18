const {
  auditCors,
  evaluateCsp,
  resolveDnsx,
  checkAbuseIp,
  profileUsername
} = require('../services/webIntelToolService');

describe('Batch 2 Web Security, DNS & OSINT Tool Service Tests', () => {
  describe('auditCors', () => {
    it('audits CORS policies against multiple origin headers', async () => {
      const res = await auditCors('https://example.com');
      expect(res).toBeDefined();
      expect(res.target).toBeDefined();
      expect(res.overallRisk).toBeDefined();
      expect(Array.isArray(res.tests)).toBe(true);
      expect(res.tests.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('evaluateCsp', () => {
    it('evaluates raw CSP text and calculates security grade', async () => {
      const cspText = "default-src 'self'; script-src 'self' 'unsafe-inline'; object-src 'none'; base-uri 'self'; frame-ancestors 'none';";
      const res = await evaluateCsp(cspText);
      expect(res).toBeDefined();
      expect(res.grade).toBeDefined();
      expect(typeof res.score).toBe('number');
      expect(res.directives).toBeDefined();
      expect(res.directives['default-src']).toContain("'self'");
      expect(res.findings.length).toBeGreaterThan(0);
    });
  });

  describe('resolveDnsx', () => {
    it('resolves multi-record DNS entries in parallel', async () => {
      const res = await resolveDnsx('cloudflare.com');
      expect(res).toBeDefined();
      expect(res.domain).toBe('cloudflare.com');
      expect(res.records).toBeDefined();
      expect(res.records.A).toBeDefined();
      expect(res.latencyMs).toBeDefined();
    });
  });

  describe('checkAbuseIp', () => {
    it('analyzes IP reputation and abuse score', async () => {
      const res = await checkAbuseIp('1.1.1.1');
      expect(res).toBeDefined();
      expect(res.ipAddress).toBe('1.1.1.1');
      expect(res.abuseConfidenceScore).toBe('0%');
      expect(res.riskLevel).toBe('CLEAN');
      expect(res.isp).toBeDefined();
    });
  });

  describe('profileUsername', () => {
    it('searches username across social platforms', async () => {
      const res = await profileUsername('torvalds');
      expect(res).toBeDefined();
      expect(res.username).toBe('torvalds');
      expect(Array.isArray(res.profiles)).toBe(true);
      expect(res.totalScanned).toBeGreaterThan(0);
      expect(res.summary).toBeDefined();
    });

    it('throws error for empty username', async () => {
      await expect(profileUsername('')).rejects.toThrow();
    });
  });
});
