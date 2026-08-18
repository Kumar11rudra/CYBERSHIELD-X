const {
  auditHydraAuth,
  auditKubeBenchCis,
  auditSnykDependencies,
  detonateCuckooSandbox,
  analyzeAutopsyForensics
} = require('../services/devsecForensicsSandboxService');

describe('Batch 15 DevSecOps, Kubernetes CIS, Sandbox Detonation & Forensics Tests', () => {
  describe('auditHydraAuth', () => {
    it('evaluates protocol authentication robustness and lockout policies', async () => {
      const res = await auditHydraAuth('ssh://192.168.1.50');
      expect(res).toBeDefined();
      expect(res.protocol).toBe('SSH');
      expect(res.host).toBe('192.168.1.50');
      expect(res.authStrengthScore).toBeDefined();
      expect(res.attempts.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('auditKubeBenchCis', () => {
    it('audits Kubernetes master and worker node configurations against CIS controls', async () => {
      const res = await auditKubeBenchCis('production-k8s-cluster');
      expect(res).toBeDefined();
      expect(res.clusterContext).toBe('production-k8s-cluster');
      expect(res.complianceScore).toBeDefined();
      expect(res.totalChecks).toBeGreaterThanOrEqual(20);
      expect(res.sections.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('auditSnykDependencies', () => {
    it('scans package dependencies for known code CVEs and upgrade paths', async () => {
      const res = await auditSnykDependencies('package.json');
      expect(res).toBeDefined();
      expect(res.dependenciesAudited).toBeGreaterThanOrEqual(10);
      expect(res.totalVulnerabilities).toBeGreaterThanOrEqual(2);
      expect(res.vulnerabilities[0].upgradePath).toBeDefined();
    });
  });

  describe('detonateCuckooSandbox', () => {
    it('simulates dynamic sample execution, process trees, and network beacons', async () => {
      const res = await detonateCuckooSandbox('invoice_march_payload.exe');
      expect(res).toBeDefined();
      expect(res.sampleName).toBe('invoice_march_payload.exe');
      expect(res.threatScore).toBeDefined();
      expect(res.processTree.length).toBeGreaterThanOrEqual(2);
      expect(res.networkBeacons.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('analyzeAutopsyForensics', () => {
    it('reconstructs forensic timeline and recovers carved file artifacts from disk images', async () => {
      const res = await analyzeAutopsyForensics('/dev/sdb1');
      expect(res).toBeDefined();
      expect(res.imageTarget).toBe('/dev/sdb1');
      expect(res.carvedFilesCount).toBeGreaterThanOrEqual(2);
      expect(res.timelineArtifactsCount).toBeGreaterThanOrEqual(2);
      expect(res.forensicIntegrity).toBeDefined();
    });
  });
});
