const {
  queryAlienVaultOtx,
  searchVirusShare,
  lookupMispIoc,
  runTheHarvester,
  searchHunterDomain
} = require('../services/threatIntelOsintService');

describe('Batch 13 Threat Intelligence & OSINT Reconnaissance Suite Tests', () => {
  describe('queryAlienVaultOtx', () => {
    it('queries AlienVault OTX pulses and extracts adversary tags', async () => {
      const res = await queryAlienVaultOtx('8.8.8.8');
      expect(res).toBeDefined();
      expect(res.target).toBe('8.8.8.8');
      expect(res.pulseCount).toBeGreaterThanOrEqual(1);
      expect(res.pulses.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('searchVirusShare', () => {
    it('searches malware sample repository for MD5 or SHA256 checksums', async () => {
      const res = await searchVirusShare('44d88612fea8a8f36de82e1278abb02f');
      expect(res).toBeDefined();
      expect(res.hashType).toBe('MD5');
      expect(res.isIdentified).toBe(true);
      expect(res.threatClass).toBe('TROJAN_MALWARE');
      expect(res.malwareFamily).toBeDefined();
    });
  });

  describe('lookupMispIoc', () => {
    it('correlates IOCs with MISP threat sharing events and MITRE tactics', async () => {
      const res = await lookupMispIoc('example-malware.com');
      expect(res).toBeDefined();
      expect(res.correlationsCount).toBeGreaterThanOrEqual(1);
      expect(res.highestThreatLevel).toBe('CRITICAL');
      expect(res.events[0].mitreTechniques.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('runTheHarvester', () => {
    it('harvests public emails and subdomains across search sources', async () => {
      const res = await runTheHarvester('example.com');
      expect(res).toBeDefined();
      expect(res.targetDomain).toBe('example.com');
      expect(res.emailsDiscoveredCount).toBeGreaterThanOrEqual(3);
      expect(res.hostsDiscoveredCount).toBeGreaterThanOrEqual(3);
      expect(res.sourcesQueriedCount).toBeGreaterThanOrEqual(4);
    });
  });

  describe('searchHunterDomain', () => {
    it('analyzes corporate domain email pattern syntax and extracts contacts', async () => {
      const res = await searchHunterDomain('acme-corp.com');
      expect(res).toBeDefined();
      expect(res.domain).toBe('acme-corp.com');
      expect(res.patternSchema).toContain('acme-corp.com');
      expect(res.confidenceScore).toBeDefined();
      expect(res.contacts.length).toBeGreaterThanOrEqual(2);
      expect(res.departments.length).toBeGreaterThanOrEqual(2);
    });
  });
});
