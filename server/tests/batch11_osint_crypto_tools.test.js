const {
  queryShodanIntel,
  searchCensysHost,
  probeMasscanRange,
  generateCryptoHashes,
  inspectHexEditor
} = require('../services/osintCryptoToolService');

describe('Batch 11 OSINT Reconnaissance, Shodan, Censys & Cryptographic Tools Tests', () => {
  describe('queryShodanIntel', () => {
    it('queries Shodan node profile and maps open ports and CVEs', async () => {
      const res = await queryShodanIntel('93.184.216.34');
      expect(res).toBeDefined();
      expect(res.resolvedIp).toBeDefined();
      expect(res.openPortsCount).toBeGreaterThanOrEqual(1);
      expect(res.summary).toContain('Shodan intelligence');
    });
  });

  describe('searchCensysHost', () => {
    it('explores Censys certificate and TLS security profile', async () => {
      const res = await searchCensysHost('example.com');
      expect(res).toBeDefined();
      expect(res.securityGrade).toBe('A+');
      expect(res.cipher).toContain('TLS_');
      expect(res.subjectAltNames.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('probeMasscanRange', () => {
    it('probes CIDR subnet or host IP for responsive open ports', async () => {
      const res = await probeMasscanRange('192.168.1.0/24');
      expect(res).toBeDefined();
      expect(res.hostsDiscovered).toBeGreaterThanOrEqual(1);
      expect(res.totalOpenPortsFound).toBeGreaterThanOrEqual(1);
      expect(res.rate).toContain('pkts/sec');
    });
  });

  describe('generateCryptoHashes', () => {
    it('generates multi-algorithm cryptographic digests and calculates Shannon entropy', async () => {
      const res = await generateCryptoHashes('CyberShieldX_Security_Payload_2026');
      expect(res).toBeDefined();
      expect(res.inputLength).toBe('CyberShieldX_Security_Payload_2026'.length);
      expect(res.entropy).toContain('bits/byte');
      expect(res.hashes.length).toBe(5);
      const sha256 = res.hashes.find(h => h.algorithm.includes('SHA-256'));
      expect(sha256).toBeDefined();
      expect(sha256.hash).toHaveLength(64);
    });
  });

  describe('inspectHexEditor', () => {
    it('formats raw string into 16-byte aligned hexadecimal offset matrix', async () => {
      const res = await inspectHexEditor('HELLO CYBERSHIELD X');
      expect(res).toBeDefined();
      expect(res.totalBytes).toBeGreaterThanOrEqual(1);
      expect(res.rows.length).toBeGreaterThanOrEqual(1);
      expect(res.rows[0].offset).toBe('0x00000000');
      expect(res.rows[0].ascii).toContain('HELLO');
    });
  });
});
