// Set environment variable limit at the very top before any imports
process.env.THREAT_FEED_LIMIT = '2';

const request = require('supertest');
const mongoose = require('mongoose');
const axios = require('axios');

// Mock axios for threat feeds HTTP requests
jest.mock('axios');

// Mock checkSSLCertificate from cronService to prevent live SSL TLS connections during tests
jest.mock('../services/cronService', () => {
  const originalModule = jest.requireActual('../services/cronService');
  return {
    ...originalModule,
    checkSSLCertificate: jest.fn().mockImplementation((host) => {
      if (host === 'expired-ssl.com') {
        return Promise.resolve({ success: false, error: 'Expired certificate' });
      }
      if (host === 'soon-expired-ssl.com') {
        return Promise.resolve({ success: true, daysLeft: 10 });
      }
      return Promise.resolve({ success: true, daysLeft: 60 });
    })
  };
});

const { app } = require('../index');
const User = require('../models/User');
const Asset = require('../models/Asset');
const Scan = require('../models/Scan');
const IOCRecord = require('../models/IOCRecord');
const ThreatFeedRecord = require('../models/ThreatFeedRecord');
const CorrelationRecord = require('../models/CorrelationRecord');
const { generateToken } = require('../utils/jwt');
const { 
  syncAllFeeds, 
  getFeedStats, 
  getFeedHealth, 
  syncURLHaus, 
  syncOpenPhish, 
  syncFeodoTracker, 
  syncCisaKev 
} = require('../services/ThreatFeedSyncService');

const testUserId = new mongoose.Types.ObjectId();
const userUserId = new mongoose.Types.ObjectId();
let adminToken = '';
let userToken = '';

const setupDefaultAxiosMock = () => {
  axios.get.mockImplementation((url) => {
    if (url.includes('urlhaus')) {
      return Promise.resolve({
        data: [
          '# URLHaus text feed',
          'http://urlhaus-threat-1.com/payload',
          'http://urlhaus-threat-2.com/payload',
          'http://urlhaus-threat-3.com/payload'
        ].join('\n')
      });
    }
    if (url.includes('openphish')) {
      return Promise.resolve({
        data: [
          'http://openphish-threat-1.com/login',
          'http://openphish-threat-2.com/login'
        ].join('\n')
      });
    }
    if (url.includes('feodotracker')) {
      return Promise.resolve({
        data: [
          '# Feodo Tracker IP blocklist',
          '198.51.100.1',
          '198.51.100.2'
        ].join('\n')
      });
    }
    if (url.includes('known_exploited_vulnerabilities')) {
      return Promise.resolve({
        data: {
          vulnerabilities: [
            {
              cveID: 'CVE-2023-38606',
              vendorProject: 'Apple',
              product: 'iOS',
              vulnerabilityName: 'Apple iOS Kernel Vulnerability',
              shortDescription: 'Active kernel exploitation detected.'
            },
            {
              cveID: 'CVE-2023-24489',
              vendorProject: 'Citrix',
              product: 'ShareFile',
              vulnerabilityName: 'Citrix ShareFile RCE',
              shortDescription: 'Citrix ShareFile RCE vulnerability.'
            }
          ]
        }
      });
    }
    return Promise.reject(new Error(`Unhandled mock URL: ${url}`));
  });
};

beforeAll(async () => {
  const testDbUri = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/cybershield-test';
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(testDbUri);
  }

  // Ensure clean test environment users (by both email and username)
  await User.deleteMany({
    $or: [
      { email: 'admin-corr@cybershield-test.com' },
      { email: 'user-corr@cybershield-test.com' },
      { username: 'admincorr' },
      { username: 'usercorr' }
    ]
  });

  await User.create([
    {
      _id: testUserId,
      username: 'admincorr',
      email: 'admin-corr@cybershield-test.com',
      password: 'Password123!',
      emailVerified: true,
      role: 'admin',
      twoFactorEnabled: false
    },
    {
      _id: userUserId,
      username: 'usercorr',
      email: 'user-corr@cybershield-test.com',
      password: 'Password123!',
      emailVerified: true,
      role: 'user',
      twoFactorEnabled: false
    }
  ]);

  adminToken = generateToken({ id: testUserId, username: 'admincorr', role: 'admin' });
  userToken = generateToken({ id: userUserId, username: 'usercorr', role: 'user' });
});

afterAll(async () => {
  await User.deleteMany({
    $or: [
      { email: 'admin-corr@cybershield-test.com' },
      { email: 'user-corr@cybershield-test.com' },
      { username: 'admincorr' },
      { username: 'usercorr' }
    ]
  });
  await Asset.deleteMany({ userId: testUserId });
  await Scan.deleteMany({ userId: testUserId });
  await IOCRecord.deleteMany({});
  await ThreatFeedRecord.deleteMany({});
  await CorrelationRecord.deleteMany({});
  await mongoose.disconnect();
});

describe('Threat Intelligence and Correlation Engine Tests (Phase 5)', () => {
  
  beforeEach(async () => {
    await IOCRecord.deleteMany({});
    await ThreatFeedRecord.deleteMany({});
    await CorrelationRecord.deleteMany({});
    await Asset.deleteMany({});
    await Scan.deleteMany({});
    setupDefaultAxiosMock();
  });

  describe('ThreatFeedSyncService (Sprint 5B)', () => {
    
    it('should resiliently parse URLHaus text feed and propagate url indicators to IOCRecord', async () => {
      const res = await syncURLHaus();
      expect(res.success).toBe(true);
      expect(res.count).toBe(2); // Ingestion limit is 2

      // Verify stored ThreatFeedRecord
      const feeds = await ThreatFeedRecord.find({ source: 'URLHaus' });
      expect(feeds).toHaveLength(2);
      expect(feeds[0].indicatorType).toBe('url');
      expect(feeds[0].severity).toBe('High');

      // Verify propagated IOCRecord
      const iocs = await IOCRecord.find({ type: 'url' });
      expect(iocs).toHaveLength(2);
      expect(iocs[0].value).toBe('http://urlhaus-threat-1.com/payload');
      expect(iocs[0].reputation).toBe(85); // High maps to 85
    });

    it('should resiliently parse OpenPhish text feed and propagate url indicators to IOCRecord', async () => {
      const res = await syncOpenPhish();
      expect(res.success).toBe(true);
      expect(res.count).toBe(2);

      const feeds = await ThreatFeedRecord.find({ source: 'OpenPhish' });
      expect(feeds).toHaveLength(2);

      const iocs = await IOCRecord.find({ type: 'url' });
      expect(iocs).toHaveLength(2);
      expect(iocs[0].value).toBe('http://openphish-threat-1.com/login');
      expect(iocs[0].reputation).toBe(95); // Critical maps to 95
    });

    it('should resiliently parse Feodo Tracker text feed and propagate ip indicators to IOCRecord', async () => {
      const res = await syncFeodoTracker();
      expect(res.success).toBe(true);
      expect(res.count).toBe(2);

      const feeds = await ThreatFeedRecord.find({ source: 'FeodoTracker' });
      expect(feeds).toHaveLength(2);

      const iocs = await IOCRecord.find({ type: 'ip' });
      expect(iocs).toHaveLength(2);
      expect(iocs[0].value).toBe('198.51.100.1');
      expect(iocs[0].reputation).toBe(85); // High maps to 85
    });

    it('should resiliently parse CISA KEV JSON feed without propagating cve indicators to IOCRecord', async () => {
      const res = await syncCisaKev();
      expect(res.success).toBe(true);
      expect(res.count).toBe(2);

      // Verify CISA stored in ThreatFeedRecord
      const feeds = await ThreatFeedRecord.find({ source: 'CISA-KEV' });
      expect(feeds).toHaveLength(2);
      expect(feeds[0].indicatorType).toBe('cve');
      expect(feeds[0].severity).toBe('Critical');
      expect(feeds[0].rawData.vendorProject).toBe('Apple');

      // Verify NO propagation to IOCRecord for cve types
      const iocs = await IOCRecord.find({ type: 'cve' });
      expect(iocs).toHaveLength(0);
    });

    it('should respect THREAT_FEED_LIMIT environment variable', async () => {
      // In our global test setup, limit is set to 2. Let's make sure it parses only 2 of the 3 URLHaus elements.
      const res = await syncURLHaus();
      expect(res.success).toBe(true);
      expect(res.count).toBe(2);

      const feeds = await ThreatFeedRecord.find({ source: 'URLHaus' });
      expect(feeds).toHaveLength(2);
    });

    it('should handle feed sync request failures gracefully and return error', async () => {
      axios.get.mockRejectedValue(new Error('Connection timeout'));

      const res = await syncURLHaus();
      expect(res.success).toBe(false);
      expect(res.error).toBe('Connection timeout');
    });

    it('should aggregate feed health diagnostics status', async () => {
      // Insert one fresh record (URLHaus) and one old record (FeodoTracker)
      await ThreatFeedRecord.create({
        source: 'URLHaus',
        indicator: 'http://fresh-indicator.com',
        indicatorType: 'url',
        updatedAt: new Date()
      });

      const thirtySevenHoursAgo = new Date(Date.now() - 37 * 60 * 60 * 1000);
      await ThreatFeedRecord.create({
        source: 'FeodoTracker',
        indicator: '9.9.9.9',
        indicatorType: 'ip',
        createdAt: thirtySevenHoursAgo,
        updatedAt: thirtySevenHoursAgo
      });

      const health = await getFeedHealth();
      expect(health.URLHaus.status).toBe('healthy');
      expect(health.FeodoTracker.status).toBe('degraded');
      expect(health.OpenPhish.status).toBe('unknown');
    });

    it('should aggregate feed statistics grouped by source', async () => {
      await ThreatFeedRecord.create([
        { source: 'URLHaus', indicator: 'http://ind-1.com', indicatorType: 'url' },
        { source: 'URLHaus', indicator: 'http://ind-2.com', indicatorType: 'url' },
        { source: 'OpenPhish', indicator: 'http://ind-3.com', indicatorType: 'url' }
      ]);

      const stats = await getFeedStats();
      expect(stats.URLHaus).toBe(2);
      expect(stats.OpenPhish).toBe(1);
      expect(stats.FeodoTracker).toBe(0);
    });
  });

  describe('IOC Correlation Engine (Sprint 5C)', () => {
    const { correlateTarget } = require('../services/IOCCorrelationEngine');

    it('should calculate 0 score (Informational) for a clean domain with no logs', async () => {
      const result = await correlateTarget('clean-target.com', 'domain', testUserId);
      expect(result.success).toBe(true);
      expect(result.correlation.riskScore).toBe(0);
      expect(result.correlation.riskLevel).toBe('Informational');
      expect(result.correlation.findings).toContain('[THREAT-FEED] Target is clean; no matching indicators in Threat Intelligence feeds.');
    });

    it('should calculate score for IOC Match (40%) and High Criticality Asset (15%)', async () => {
      // 1. Setup IOC Record
      await IOCRecord.create({
        type: 'domain',
        value: 'dangerous-domain.com',
        reputation: 90,
        source: 'FeodoTracker',
        sourceType: 'feed'
      });

      // 2. Setup Criticality Asset (High criticality = 15 points)
      await Asset.create({
        userId: testUserId,
        hostname: 'dangerous-domain.com',
        ip: '198.51.100.22',
        environment: 'Production',
        owner: 'Admin',
        assetType: 'Server',
        criticality: 'High',
        status: 'active'
      });

      const result = await correlateTarget('dangerous-domain.com', 'domain', testUserId);
      expect(result.success).toBe(true);
      expect(result.correlation.riskScore).toBe(55); // 40 (IOC) + 15 (High Asset)
      expect(result.correlation.riskLevel).toBe('High'); // 55 >= 50
    });

    it('should calculate score including SSL check failure (+10%), open ports (+15%), and CVE vulnerability banners (+15%)', async () => {
      // 1. SSL Setup: use 'expired-ssl.com' which we mocked to fail
      const target = 'expired-ssl.com';

      // 2. Create Asset (Critical criticality = 20 points)
      await Asset.create({
        userId: testUserId,
        hostname: target,
        ip: '198.51.100.25',
        environment: 'Production',
        owner: 'Admin',
        assetType: 'Server',
        criticality: 'Critical',
        status: 'active'
      });

      // 3. Create scan containing open ports and vulnerability banner (nginx/1.18.0)
      await Scan.create({
        userId: testUserId,
        target: target,
        targetType: 'domain',
        threatScore: 0,
        riskLevel: 'safe',
        status: 'completed',
        breakdown: {
          virusTotal: {
            rawLog: [
              'PORT     STATE  SERVICE',
              '80/tcp   open   http',
              'nginx/1.18.0 version discovered'
            ].join('\n')
          }
        }
      });

      const result = await correlateTarget(target, 'domain', testUserId);
      expect(result.success).toBe(true);
      // Risk breakdown expectation:
      // - No IOC match: 0
      // - Critical Asset: +20
      // - Open ports: +15
      // - CVE Vulnerability (nginx/1.18.0 maps to CVE-2021-23017): +15
      // - SSL failed: +10
      // Total: 60
      expect(result.correlation.riskScore).toBe(60);
      expect(result.correlation.riskLevel).toBe('High'); // 60 >= 50
    });

    it('should verify critical risk level (>= 75 score)', async () => {
      const sslTarget = 'expired-ssl.com';

      await IOCRecord.create({
        type: 'domain',
        value: sslTarget,
        reputation: 99,
        source: 'OpenPhish',
        sourceType: 'feed'
      });

      await Asset.create({
        userId: testUserId,
        hostname: sslTarget,
        ip: '198.51.100.30',
        environment: 'Production',
        owner: 'Admin',
        assetType: 'Server',
        criticality: 'Critical',
        status: 'active'
      });

      await Scan.create({
        userId: testUserId,
        target: sslTarget,
        targetType: 'domain',
        threatScore: 90,
        riskLevel: 'dangerous',
        status: 'completed',
        breakdown: {
          virusTotal: {
            rawLog: [
              '80/tcp open http',
              'nginx/1.18.0'
            ].join('\n')
          }
        }
      });

      const result = await correlateTarget(sslTarget, 'domain', testUserId);
      expect(result.success).toBe(true);
      // Score: 40 (IOC) + 20 (Critical Asset) + 15 (Ports) + 15 (CVEs) + 10 (SSL) = 100
      expect(result.correlation.riskScore).toBe(100);
      expect(result.correlation.riskLevel).toBe('Critical'); // 100 >= 75
    });
  });

  describe('IOC API Controller Routes (Sprint 5D)', () => {
    
    it('GET /api/ioc/correlate should correlate query target', async () => {
      const res = await request(app)
        .get('/api/ioc/correlate')
        .query({ target: 'some-domain.com', targetType: 'domain' })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.correlation.target).toBe('some-domain.com');
      expect(res.body.correlation.riskScore).toBe(0);
      expect(res.body.correlation.riskLevel).toBe('Informational');
    });

    it('GET /api/ioc/correlate should fail with missing queries', async () => {
      const res = await request(app)
        .get('/api/ioc/correlate')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(400);
      expect(res.body.error).toContain('Target and Target Type query parameters are required');
    });

    it('POST /api/ioc/sync-feeds should trigger sync for admins', async () => {
      const res = await request(app)
        .post('/api/ioc/sync-feeds')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('POST /api/ioc/sync-feeds should deny access to non-admin users', async () => {
      const res = await request(app)
        .post('/api/ioc/sync-feeds')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.error).toContain('Admin access required');
    });

    it('GET /api/ioc/feed-stats should return stats, health and recent correlations', async () => {
      // 1. Create a dummy correlation record
      await CorrelationRecord.create({
        userId: testUserId,
        target: 'monitored-domain.com',
        riskScore: 40,
        riskLevel: 'Medium',
        findings: ['Test finding']
      });

      const res = await request(app)
        .get('/api/ioc/feed-stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.stats).toBeDefined();
      expect(res.body.health).toBeDefined();
      expect(res.body.recentCorrelations).toHaveLength(1);
      expect(res.body.recentCorrelations[0].target).toBe('monitored-domain.com');
    });
  });
});
