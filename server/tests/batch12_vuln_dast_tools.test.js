const {
  auditNiktoWeb,
  auditSqlmapInjection,
  auditTrivyContainer,
  runZapDastScan,
  runNucleiTemplateScan
} = require('../services/vulnDastScannerService');

describe('Batch 12 Web Vulnerability, SQL Injection, Container & DAST Tools Tests', () => {
  describe('auditNiktoWeb', () => {
    it('audits web server headers and flags configuration issues', async () => {
      const res = await auditNiktoWeb('https://example.com');
      expect(res).toBeDefined();
      expect(res.hostname).toBe('example.com');
      expect(res.hardeningScore).toBeDefined();
      expect(res.findingsCount).toBeGreaterThanOrEqual(1);
    });
  });

  describe('auditSqlmapInjection', () => {
    it('evaluates parameters for SQL injection vectors across database engines', async () => {
      const res = await auditSqlmapInjection('https://api.example.com/items?id=10&cat=electronics');
      expect(res).toBeDefined();
      expect(res.testedParametersCount).toBe(2);
      expect(res.sqliRiskScore).toBeDefined();
      expect(res.testedVectors.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('auditTrivyContainer', () => {
    it('audits container image dependencies for CVEs and misconfigurations', async () => {
      const res = await auditTrivyContainer('alpine:3.18');
      expect(res).toBeDefined();
      expect(res.imageTarget).toBe('alpine:3.18');
      expect(res.totalVulnerabilities).toBeGreaterThanOrEqual(1);
      expect(res.severityBreakdown.critical).toBeGreaterThanOrEqual(1);
      expect(res.misconfigurations.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('runZapDastScan', () => {
    it('executes dynamic application security testing covering OWASP Top 10', async () => {
      const res = await runZapDastScan('https://app.example.com');
      expect(res).toBeDefined();
      expect(res.hostname).toBe('app.example.com');
      expect(res.spideredUrlsCount).toBeGreaterThanOrEqual(1);
      expect(res.dastScore).toBeDefined();
      expect(res.alerts.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('runNucleiTemplateScan', () => {
    it('matches security template signatures against target endpoints', async () => {
      const res = await runNucleiTemplateScan('https://api.example.com');
      expect(res).toBeDefined();
      expect(res.hostname).toBe('api.example.com');
      expect(res.templatesExecuted).toBeGreaterThanOrEqual(1000);
      expect(res.matchedTemplatesCount).toBeGreaterThanOrEqual(2);
      expect(res.templates[0].severity).toBeDefined();
    });
  });
});
