const axios = require('axios');
const request = require('supertest');
const express = require('express');
const {
  getThreatFeed,
  normalizeKevItem,
  parseKevCatalog,
  FALLBACK_ADVISORIES,
  FALLBACK_TICKER,
  _clearCache,
} = require('../services/threatFeed');
const threatFeedRoutes = require('../routes/threatFeed');

jest.mock('axios');

describe('Step 1: Real-Data Threat Feed Service & Controller', () => {
  let app;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/api/threat-feed', threatFeedRoutes);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    _clearCache();
  });

  describe('1. Data Normalization & Sanitization', () => {
    test('normalizeKevItem correctly normalizes a standard CISA KEV record', () => {
      const sample = {
        cveID: 'CVE-2026-88772',
        vendorProject: 'Citrix',
        product: 'NetScaler',
        vulnerabilityName: 'Citrix NetScaler Memory Buffer Vulnerability',
        dateAdded: '2026-09-27',
        shortDescription: 'Buffer overflow allowing RCE.',
        knownRansomwareCampaignUse: 'Unknown',
      };

      const normalized = normalizeKevItem(sample);
      expect(normalized).not.toBeNull();
      expect(normalized.cveID).toBe('CVE-2026-88772');
      expect(normalized.vendor).toBe('Citrix');
      expect(normalized.product).toBe('NetScaler');
      expect(normalized.ransomware).toBe(false);
      expect(normalized.tickerText).toContain('⚠ CISA KEV:');
      expect(normalized.tickerText).toContain('CVE-2026-88772');
      expect(normalized.link).toBe('https://nvd.nist.gov/vuln/detail/CVE-2026-88772');
    });

    test('normalizeKevItem tags ransomware campaigns appropriately', () => {
      const sample = {
        cveID: 'CVE-2023-34362',
        vendorProject: 'Progress',
        product: 'MOVEit Transfer',
        vulnerabilityName: 'Progress MOVEit Transfer SQL Injection Vulnerability',
        dateAdded: '2023-06-02',
        shortDescription: 'SQL injection exploited by CL0P ransomware group.',
        knownRansomwareCampaignUse: 'Known',
      };

      const normalized = normalizeKevItem(sample);
      expect(normalized.ransomware).toBe(true);
      expect(normalized.tone).toBe('dangerous');
      expect(normalized.severity).toBe('Critical');
      expect(normalized.tickerText).toContain('🔴 CISA KEV (Ransomware):');
    });

    test('normalizeKevItem strips HTML tags and untrusted content', () => {
      const maliciousSample = {
        cveID: 'CVE-2026-9999<script>alert(1)</script>',
        vendorProject: '<img src=x onerror=alert(1)>Vendor',
        product: 'Product<b>Bold</b>',
        vulnerabilityName: 'RCE Vulnerability<iframe src="//evil.com"></iframe>',
        shortDescription: '<script>evil()</script>Safe description.',
        knownRansomwareCampaignUse: 'Unknown',
      };

      const normalized = normalizeKevItem(maliciousSample);
      expect(normalized.cveID).toBe('CVE-2026-9999alert(1)');
      expect(normalized.vendor).toBe('Vendor');
      expect(normalized.product).toBe('ProductBold');
      expect(normalized.tickerText).not.toContain('<script>');
      expect(normalized.tickerText).not.toContain('<iframe');
    });

    test('parseKevCatalog parses valid array and enforces item limit', () => {
      const rawData = {
        title: 'CISA Catalog of Known Exploited Vulnerabilities',
        vulnerabilities: Array.from({ length: 25 }, (_, i) => ({
          cveID: `CVE-2026-${1000 + i}`,
          vendorProject: `Vendor-${i}`,
          product: `Product-${i}`,
          vulnerabilityName: `Exploit-${i} Vulnerability`,
          dateAdded: '2026-09-28',
          knownRansomwareCampaignUse: i % 2 === 0 ? 'Known' : 'Unknown',
        })),
      };

      const parsed = parseKevCatalog(rawData, 6);
      expect(parsed).toHaveLength(6);
      expect(parsed[0].cveID).toBe('CVE-2026-1000');
    });

    test('parseKevCatalog throws on malformed or empty array', () => {
      expect(() => parseKevCatalog(null)).toThrow();
      expect(() => parseKevCatalog({ vulnerabilities: [] })).toThrow();
      expect(() => parseKevCatalog({ vulnerabilities: 'not-an-array' })).toThrow();
    });
  });

  describe('2. Fetch, Caching & Fallback Logic', () => {
    test('getThreatFeed successfully returns live normalized CISA KEV data', async () => {
      const mockPayload = {
        title: 'CISA Catalog',
        vulnerabilities: [
          {
            cveID: 'CVE-2026-1111',
            vendorProject: 'TestVendor',
            product: 'TestProduct',
            vulnerabilityName: 'Test RCE Vulnerability',
            dateAdded: '2026-09-28',
            knownRansomwareCampaignUse: 'Unknown',
          },
        ],
      };

      axios.get.mockResolvedValueOnce({ data: mockPayload });

      const feed = await getThreatFeed();
      expect(feed.isLive).toBe(true);
      expect(feed.cached).toBe(false);
      expect(feed.items).toHaveLength(1);
      expect(feed.ticker).toHaveLength(1);
      expect(feed.ticker[0]).toContain('CVE-2026-1111');
      expect(axios.get).toHaveBeenCalledTimes(1);
    });

    test('getThreatFeed serves cached data on subsequent calls within TTL', async () => {
      const mockPayload = {
        title: 'CISA Catalog',
        vulnerabilities: [
          {
            cveID: 'CVE-2026-2222',
            vendorProject: 'CacheVendor',
            product: 'CacheProduct',
            vulnerabilityName: 'Cache Vulnerability',
            dateAdded: '2026-09-28',
            knownRansomwareCampaignUse: 'Known',
          },
        ],
      };

      axios.get.mockResolvedValueOnce({ data: mockPayload });

      // First call: network fetch
      const feed1 = await getThreatFeed();
      expect(feed1.cached).toBe(false);
      expect(axios.get).toHaveBeenCalledTimes(1);

      // Second call: from cache
      const feed2 = await getThreatFeed();
      expect(feed2.cached).toBe(true);
      expect(feed2.ticker[0]).toContain('CVE-2026-2222');
      expect(axios.get).toHaveBeenCalledTimes(1); // Not called again
    });

    test('getThreatFeed falls back gracefully when external provider fails', async () => {
      axios.get.mockRejectedValueOnce(new Error('Network timeout (ETIMEDOUT)'));

      const feed = await getThreatFeed();
      expect(feed.isLive).toBe(false);
      expect(feed.items).toEqual(FALLBACK_ADVISORIES);
      expect(feed.ticker).toEqual(FALLBACK_TICKER);
      expect(feed.ticker.length).toBeGreaterThan(0);
    });

    test('getThreatFeed falls back gracefully when provider returns malformed response', async () => {
      axios.get.mockResolvedValueOnce({ data: { unexpected: 'format' } });

      const feed = await getThreatFeed();
      expect(feed.isLive).toBe(false);
      expect(feed.items).toEqual(FALLBACK_ADVISORIES);
      expect(feed.ticker.length).toBeGreaterThan(0);
    });
  });

  describe('3. API Controller Endpoint /api/threat-feed', () => {
    test('GET /api/threat-feed returns HTTP 200 with structured threat contract', async () => {
      const mockPayload = {
        title: 'CISA Catalog',
        vulnerabilities: [
          {
            cveID: 'CVE-2026-3333',
            vendorProject: 'ApiVendor',
            product: 'ApiProduct',
            vulnerabilityName: 'API Vulnerability',
            dateAdded: '2026-09-28',
            knownRansomwareCampaignUse: 'Unknown',
          },
        ],
      };

      axios.get.mockResolvedValueOnce({ data: mockPayload });

      const res = await request(app).get('/api/threat-feed');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('source');
      expect(res.body).toHaveProperty('isLive');
      expect(res.body).toHaveProperty('items');
      expect(res.body).toHaveProperty('ticker');
      expect(Array.isArray(res.body.ticker)).toBe(true);
      expect(res.body.ticker[0]).toContain('CVE-2026-3333');
    });

    test('GET /api/threat-feed does not expose secrets, credentials, or internal paths', async () => {
      const res = await request(app).get('/api/threat-feed');
      const bodyText = JSON.stringify(res.body);

      expect(bodyText).not.toContain('MONGODB_URI');
      expect(bodyText).not.toContain('JWT_SECRET');
      expect(bodyText).not.toContain('API_KEY');
      expect(bodyText).not.toContain('/Users/');
      expect(bodyText).not.toContain('/home/');
    });
  });
});
