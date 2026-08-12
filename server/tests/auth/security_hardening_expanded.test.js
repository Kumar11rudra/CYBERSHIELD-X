/**
 * CyberShield X — Phase 18 Production Security Hardening Test Suite
 */

const request = require('supertest');
const mongoose = require('mongoose');
const dns = require('dns');
const { app } = require('../../index');
const User = require('../../models/User');
const Scan = require('../../models/Scan');
const { isPrivateIp, isPrivateOrLoopback, ssrfLookup, normalizeHostname } = require('../../utils/ssrfValidator');

describe('Phase 18 — SSRF Validator & IP Normalization Unit Tests', () => {
  
  it('should identify standard private IPv4 ranges', () => {
    expect(isPrivateIp('127.0.0.1')).toBe(true);
    expect(isPrivateIp('10.0.0.5')).toBe(true);
    expect(isPrivateIp('172.16.30.2')).toBe(true);
    expect(isPrivateIp('192.168.1.100')).toBe(true);
    expect(isPrivateIp('169.254.10.10')).toBe(true);
    expect(isPrivateIp('0.0.0.0')).toBe(true);
    expect(isPrivateIp('224.0.0.1')).toBe(true);
    expect(isPrivateIp('240.0.0.0')).toBe(true);
    expect(isPrivateIp('255.255.255.255')).toBe(true);
  });

  it('should identify public IPv4 addresses as non-private', () => {
    expect(isPrivateIp('8.8.8.8')).toBe(false);
    expect(isPrivateIp('1.1.1.1')).toBe(false);
    expect(isPrivateIp('104.244.42.1')).toBe(false);
  });

  it('should identify standard private/multicast IPv6 ranges', () => {
    expect(isPrivateIp('::1')).toBe(true);
    expect(isPrivateIp('0:0:0:0:0:0:0:1')).toBe(true);
    expect(isPrivateIp('::')).toBe(true);
    expect(isPrivateIp('fe80::1')).toBe(true);
    expect(isPrivateIp('fd00::1')).toBe(true);
    expect(isPrivateIp('fc00::9')).toBe(true);
    expect(isPrivateIp('ff02::1')).toBe(true);
  });

  it('should identify public IPv6 addresses as non-private', () => {
    expect(isPrivateIp('2001:4860:4860::8888')).toBe(false);
  });

  it('should parse and check IPv4-mapped IPv6 addresses', () => {
    expect(isPrivateIp('::ffff:127.0.0.1')).toBe(true);
    expect(isPrivateIp('::ffff:10.0.0.1')).toBe(true);
    expect(isPrivateIp('::ffff:8.8.8.8')).toBe(false);
    expect(isPrivateIp('::ffff:7f00:0001')).toBe(true); // hex loopback
    expect(isPrivateIp('::ffff:0808:0808')).toBe(false); // hex public
  });

  it('should normalize and parse alternative IPv4 formats', () => {
    // Decimal IP (127.0.0.1 = 2130706433)
    expect(normalizeHostname('2130706433')).toBe('127.0.0.1');
    // Hex IP (127.0.0.1 = 0x7f000001)
    expect(normalizeHostname('0x7f000001')).toBe('127.0.0.1');
    // Octal representation (0177.0.0.1 = 127.0.0.1)
    expect(normalizeHostname('0177.0.0.1')).toBe('127.0.0.1');
    // Mixed Hex representation (0x7f.0.0.1 = 127.0.0.1)
    expect(normalizeHostname('0x7f.0.0.1')).toBe('127.0.0.1');
  });

  it('should resolve and block hostname check resolving to private IPs', async () => {
    expect(await isPrivateOrLoopback('localhost')).toBe(true);
    expect(await isPrivateOrLoopback('127.0.0.1')).toBe(true);
    expect(await isPrivateOrLoopback('::ffff:127.0.0.1')).toBe(true);
    expect(await isPrivateOrLoopback('google.com')).toBe(false);
  });
});

describe('Phase 18 — ssrfLookup Connection-Time DNS Rebinding Verification', () => {
  it('should return error if dns lookup resolves to private IP', (done) => {
    ssrfLookup('localhost', {}, (err, address, family) => {
      expect(err).toBeDefined();
      expect(err.message).toContain('SSRF Blocked');
      done();
    });
  });

  it('should succeed for public resolution', (done) => {
    ssrfLookup('google.com', {}, (err, address, family) => {
      expect(err).toBeNull();
      expect(address).toBeDefined();
      done();
    });
  });

  it('should mitigate DNS rebinding by checking all returned addresses', (done) => {
    // Save original dns.lookup
    const originalDnsLookup = dns.lookup;
    
    // Stub dns.lookup to return a mixed or transitionary private IP
    dns.lookup = (hostname, options, callback) => {
      const cb = typeof options === 'function' ? options : callback;
      cb(null, [{ address: '127.0.0.1', family: 4 }, { address: '8.8.8.8', family: 4 }]);
    };

    ssrfLookup('rebind.test', {}, (err, address, family) => {
      // Restore original dns.lookup
      dns.lookup = originalDnsLookup;

      expect(err).toBeDefined();
      expect(err.message).toContain('SSRF Blocked');
      done();
    });
  });
});

describe('Phase 18 — CORS Security Configuration Tests', () => {
  it('should allow explicitly configured development localhost origins', async () => {
    const res = await request(app)
      .options('/api/status')
      .set('Origin', 'http://localhost:3000')
      .set('Access-Control-Request-Method', 'GET');
    
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:3000');
    expect(res.headers['access-control-allow-credentials']).toBe('true');
  });

  it('should reject arbitrary origins', async () => {
    const res = await request(app)
      .get('/api/status')
      .set('Origin', 'http://evil-attacker.com');

    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });
});

describe('Phase 18 — Admin Roles Access & IDOR Verification', () => {
  const uniqueId = Date.now();
  let adminToken = '';
  let userToken = '';
  let scanId = '';

  beforeAll(async () => {
    const testDbUri = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/cybershield-test';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(testDbUri);
    }

    await User.deleteMany({ email: /@sec-hardening-test\.com$/ });

    const userRes = await request(app)
      .post('/api/auth/signup')
      .send({
        username: `user_${uniqueId}`,
        email: `user_${uniqueId}@sec-hardening-test.com`,
        password: 'Password@123',
        fullName: 'Standard User',
        mobileNumber: '+919999999991'
      });
    userToken = userRes.body.token;

    const adminRes = await request(app)
      .post('/api/auth/signup')
      .send({
        username: `admin_${uniqueId}`,
        email: `admin_${uniqueId}@sec-hardening-test.com`,
        password: 'Password@123',
        fullName: 'Admin User',
        mobileNumber: '+919999999992'
      });
    adminToken = adminRes.body.token;

    const { getAuthModule } = require('../../services/authComposition');
    const authModule = getAuthModule();
    const userRepo = authModule.userRepo;
    const adminDoc = await userRepo.findOne({ username: `admin_${uniqueId}` });
    
    const UserDTO = require('../../services/auth/dto/UserDTO');
    const updatedAdmin = new UserDTO({
      ...adminDoc,
      role: 'admin'
    });
    await userRepo.update(updatedAdmin);

    const { generateToken } = require('../../utils/jwt');
    adminToken = generateToken({ id: adminDoc.id, role: 'admin' });

    const Organization = require('../../models/Organization');
    const org = new Organization({
      name: 'Test Org Hardened',
      ownerId: userRes.body.user.id
    });
    await org.save();

    const scan = new Scan({
      userId: userRes.body.user.id,
      organizationId: org._id,
      target: 'cybershield-test-target.com',
      targetType: 'domain',
      threatScore: 12,
      riskLevel: 'low',
      scanId: 's123456789'
    });
    await scan.save();
    scanId = scan._id.toString();
  });

  afterAll(async () => {
    await User.deleteMany({ email: /@sec-hardening-test\.com$/ });
    await Scan.deleteMany({ target: 'cybershield-test-target.com' });
    await mongoose.disconnect();
  });

  it('should allow real Admin role user to view telemetry/stats', async () => {
    const res = await request(app)
      .get('/api/admin/stats')
      .set('Cookie', `token=${adminToken}`)
      .set('Authorization', `Bearer ${adminToken}`);
    
    if (res.statusCode !== 200) {
      console.log('FAILED ADMIN BODY:', res.body);
    }
    expect(res.statusCode).toBe(200);
  });

  it('should block non-admin users from viewing telemetry/stats', async () => {
    const res = await request(app)
      .get('/api/admin/stats')
      .set('Cookie', `token=${userToken}`)
      .set('Authorization', `Bearer ${userToken}`);
    
    expect(res.statusCode).toBe(403);
  });

  it('should block standard user from downloading another user scan report (BOLA/IDOR)', async () => {
    const tempRes = await request(app)
      .post('/api/auth/signup')
      .send({
        username: `temp_${uniqueId}`,
        email: `temp_${uniqueId}@sec-hardening-test.com`,
        password: 'Password@123',
        fullName: 'Temp User',
        mobileNumber: '+919999999993'
      });
    const tempToken = tempRes.body.token;

    const res = await request(app)
      .get(`/api/reports/generate-pdf/${scanId}`)
      .set('Cookie', `token=${tempToken}`)
      .set('Authorization', `Bearer ${tempToken}`);
    
    expect(res.statusCode).toBe(403);
  });

  it('should block report download for invalid ObjectId format (Early Validation)', async () => {
    const res = await request(app)
      .get('/api/reports/generate-pdf/invalid-object-id-format')
      .set('Cookie', `token=${userToken}`)
      .set('Authorization', `Bearer ${userToken}`);
    
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toContain('Invalid scan identifier format');
  });
});
