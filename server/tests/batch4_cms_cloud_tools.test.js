const {
  scanWhatWeb,
  probeDirsearch,
  auditWpScan,
  lintIamPolicy,
  auditJwtStrength
} = require('../services/webCmsCloudToolService');

describe('Batch 4 Web CMS, API & Cloud Tool Service Tests', () => {
  describe('scanWhatWeb', () => {
    it('fingerprints web technologies and returns structured tech stack', async () => {
      const res = await scanWhatWeb('https://example.com');
      expect(res).toBeDefined();
      expect(res.target).toBe('https://example.com');
      expect(Array.isArray(res.technologies)).toBe(true);
      expect(res.latency).toBeDefined();
    });
  });

  describe('probeDirsearch', () => {
    it('probes sensitive endpoints and returns accessibility stats', async () => {
      const res = await probeDirsearch('https://example.com');
      expect(res).toBeDefined();
      expect(res.pathsProbed).toBeGreaterThanOrEqual(5);
      expect(Array.isArray(res.paths)).toBe(true);
      expect(typeof res.accessibleCount).toBe('number');
    });
  });

  describe('auditWpScan', () => {
    it('audits WordPress site and returns vulnerability findings', async () => {
      const res = await auditWpScan('https://example.com');
      expect(res).toBeDefined();
      expect(typeof res.isWordPress).toBe('boolean');
      expect(res.wpVersion).toBeDefined();
      expect(Array.isArray(res.findings)).toBe(true);
    });
  });

  describe('lintIamPolicy', () => {
    it('evaluates overly permissive AWS IAM JSON policy and penalizes score', async () => {
      const badPolicy = JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: '*',
            Resource: '*'
          },
          {
            Effect: 'Allow',
            Action: 'iam:PassRole',
            Resource: '*'
          }
        ]
      });

      const res = await lintIamPolicy(badPolicy);
      expect(res).toBeDefined();
      expect(res.score).toBeLessThan(50);
      expect(res.grade).toBe('CRITICAL');
      expect(res.observations.some(o => o.rule === 'FullAdminAccess')).toBe(true);
    });

    it('validates secure least-privilege IAM policy', async () => {
      const goodPolicy = JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: ['s3:GetObject', 's3:ListBucket'],
            Resource: ['arn:aws:s3:::my-secure-bucket', 'arn:aws:s3:::my-secure-bucket/*']
          }
        ]
      });

      const res = await lintIamPolicy(goodPolicy);
      expect(res).toBeDefined();
      expect(res.score).toBe(100);
      expect(res.grade).toBe('PASSED');
      expect(res.observationsCount).toBe(0);
    });
  });

  describe('auditJwtStrength', () => {
    it('flags alg none and missing expiration in JWT token', async () => {
      const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64');
      const payload = Buffer.from(JSON.stringify({ sub: 'user_123', name: 'Alice' })).toString('base64');
      const token = `${header}.${payload}.`;

      const res = await auditJwtStrength(token);
      expect(res).toBeDefined();
      expect(res.algorithm).toBe('none');
      expect(res.grade).toBe('WEAK / CRITICAL');
      expect(res.findings.some(f => f.issue.includes('alg: none'))).toBe(true);
      expect(res.findings.some(f => f.issue.includes('Missing Token Expiration'))).toBe(true);
    });

    it('evaluates secure RS256 token with expiration', async () => {
      const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64');
      const payload = Buffer.from(JSON.stringify({ sub: 'user_123', exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64');
      const signature = Buffer.from('mock_signature_data').toString('base64');
      const token = `${header}.${payload}.${signature}`;

      const res = await auditJwtStrength(token);
      expect(res).toBeDefined();
      expect(res.algorithm).toBe('RS256');
      expect(res.grade).toBe('STRONG');
      expect(res.strengthScore).toBe('100/100');
    });
  });
});
