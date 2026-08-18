const {
  findSubdomains,
  auditDnssec,
  checkIpv6,
  lookupMac,
  lookupCve
} = require('../services/networkToolService');

describe('Batch 1 Reconnaissance & Network Tool Service Tests', () => {
  describe('lookupMac', () => {
    it('correctly resolves Apple OUI prefix', async () => {
      const res = await lookupMac('00:1C:B3:01:02:03');
      expect(res).toBeDefined();
      expect(res.vendor).toBe('Apple, Inc.');
      expect(res.ouiPrefix).toBe('00:1C:B3');
      expect(res.transmissionType).toBe('Unicast (Standard)');
    });

    it('correctly resolves Cisco OUI prefix', async () => {
      const res = await lookupMac('00:00:0C:AA:BB:CC');
      expect(res).toBeDefined();
      expect(res.vendor).toBe('Cisco Systems, Inc');
      expect(res.macAddress).toBe('00:00:0C:AA:BB:CC');
    });

    it('handles formatted and unformatted MAC inputs', async () => {
      const res = await lookupMac('001AB3AABBCC');
      expect(res).toBeDefined();
      expect(res.macAddress).toBe('00:1A:B3:AA:BB:CC');
    });

    it('throws error on invalid short MAC input', async () => {
      await expect(lookupMac('123')).rejects.toThrow();
    });
  });

  describe('checkIpv6', () => {
    it('returns structured IPv6 / IPv4 verification for domain', async () => {
      const res = await checkIpv6('google.com');
      expect(res).toBeDefined();
      expect(res.domain).toBe('google.com');
      expect(typeof res.hasIpv6).toBe('boolean');
      expect(typeof res.hasIpv4).toBe('boolean');
      expect(Array.isArray(res.ipv4Addresses)).toBe(true);
      expect(Array.isArray(res.ipv6Addresses)).toBe(true);
    });
  });

  describe('auditDnssec', () => {
    it('returns structured DNSSEC audit object for domain', async () => {
      const res = await auditDnssec('cloudflare.com');
      expect(res).toBeDefined();
      expect(res.domain).toBe('cloudflare.com');
      expect(typeof res.dnssecEnabled).toBe('boolean');
      expect(res.status).toBeDefined();
      expect(res.recommendation).toBeDefined();
    });
  });

  describe('findSubdomains', () => {
    it('returns structured subdomains list for domain', async () => {
      const res = await findSubdomains('example.com');
      expect(res).toBeDefined();
      expect(res.domain).toBe('example.com');
      expect(res.totalCount).toBeGreaterThanOrEqual(1);
      expect(Array.isArray(res.subdomains)).toBe(true);
      expect(res.summary).toBeDefined();
    });
  });

  describe('lookupCve', () => {
    it('returns structured CVE object or fallback search for CVE ID', async () => {
      const res = await lookupCve('CVE-2021-44228');
      expect(res).toBeDefined();
      expect(res.cveId).toBeDefined();
      expect(res.summary).toBeDefined();
    });
  });
});
