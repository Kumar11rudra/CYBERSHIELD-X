const request = require('supertest');
const mongoose = require('mongoose');
const { app } = require('../index');
const User = require('../models/User');
const Asset = require('../models/Asset');
const ScheduledScan = require('../models/ScheduledScan');
const Notification = require('../models/Notification');
const Scan = require('../models/Scan');
const IOCRecord = require('../models/IOCRecord');
const { generateToken } = require('../utils/jwt');
const { executeScheduleJob } = require('../services/cronService');

const testUserId = new mongoose.Types.ObjectId();
let authToken = '';

beforeAll(async () => {
  const testDbUri = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/cybershield-test';
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(testDbUri);
  }

  // Ensure clean test user
  await User.deleteMany({
    $or: [
      { email: 'testsoc@cybershield-test.com' },
      { username: 'testsoc' }
    ]
  });

  await User.create({
    _id: testUserId,
    username: 'testsoc',
    email: 'testsoc@cybershield-test.com',
    password: 'Password123!',
    emailVerified: true,
    role: 'admin',
    twoFactorEnabled: false
  });

  authToken = generateToken({ id: testUserId, username: 'testsoc', role: 'admin' });
});

afterAll(async () => {
  await User.deleteMany({ _id: testUserId });
  await Asset.deleteMany({ userId: testUserId });
  await ScheduledScan.deleteMany({ userId: testUserId });
  await Notification.deleteMany({ userId: testUserId });
  await Scan.deleteMany({ userId: testUserId });
  await mongoose.disconnect();
});

describe('SOC Platform integration tests', () => {
  let createdAssetId;
  let createdScheduleId;
  let createdNotificationId;

  // 1. Asset CRUD Tests
  describe('Asset Inventory API', () => {
    it('POST /api/assets should register a new asset', async () => {
      const res = await request(app)
        .post('/api/assets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          hostname: 'soc-monitor.local',
          ip: '192.168.1.50',
          tags: ['critical', 'database'],
          environment: 'Production',
          owner: 'SOC-Admin',
          assetType: 'Server',
          criticality: 'High',
          status: 'active'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.asset.hostname).toBe('soc-monitor.local');
      expect(res.body.asset.assetType).toBe('Server');
      expect(res.body.asset.criticality).toBe('High');
      createdAssetId = res.body.asset._id;
    });

    it('GET /api/assets should retrieve assets', async () => {
      const res = await request(app)
        .get('/api/assets')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.assets)).toBe(true);
      expect(res.body.assets.length).toBeGreaterThan(0);
    });

    it('PUT /api/assets/:id should modify asset details', async () => {
      const res = await request(app)
        .put(`/api/assets/${createdAssetId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          criticality: 'Critical',
          status: 'maintenance'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.asset.criticality).toBe('Critical');
      expect(res.body.asset.status).toBe('maintenance');
    });
  });

  // 2. Scheduler & ScheduledScans CRUD Tests
  describe('Continuous Monitoring Scheduler API', () => {
    it('POST /api/schedules should register daily/weekly/monthly scans', async () => {
      const res = await request(app)
        .post('/api/schedules')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          target: 'soc-monitor.local',
          targetType: 'domain',
          frequency: 'weekly',
          tools: ['nmap'],
          scanMode: 'quick'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.schedule.target).toBe('soc-monitor.local');
      expect(res.body.schedule.frequency).toBe('weekly');
      expect(res.body.schedule.nextRun).toBeDefined();
      createdScheduleId = res.body.schedule._id;
    });

    it('POST /api/schedules should fail with invalid cron or arbitrary frequencies', async () => {
      const res = await request(app)
        .post('/api/schedules')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          target: 'soc-monitor.local',
          targetType: 'domain',
          frequency: 'hourly' // Invalid
        });

      expect(res.statusCode).toBe(400);
    });

    it('GET /api/schedules should retrieve scheduled scans', async () => {
      const res = await request(app)
        .get('/api/schedules')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.schedules)).toBe(true);
    });

    it('PUT /api/schedules/:id should update frequency and recalculate nextRun', async () => {
      const res = await request(app)
        .put(`/api/schedules/${createdScheduleId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          frequency: 'daily'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.schedule.frequency).toBe('daily');
    });
  });

  // 3. Generic Notifications API Tests
  describe('Generic Notification System API', () => {
    beforeEach(async () => {
      const notification = await Notification.create({
        userId: testUserId,
        title: 'Port Open Alert',
        message: 'Port 22 detected open on 192.168.1.50',
        type: 'alert',
        severity: 'high',
        category: 'port',
        source: 'nmap'
      });
      createdNotificationId = notification._id;
    });

    it('GET /api/notifications should retrieve alerts list', async () => {
      const res = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.notifications)).toBe(true);
    });

    it('PUT /api/notifications/:id/read should mark specific notification as read', async () => {
      const res = await request(app)
        .put(`/api/notifications/${createdNotificationId}/read`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.notification.read).toBe(true);
    });

    it('PUT /api/notifications/all/read should mark all user notifications as read', async () => {
      const res = await request(app)
        .put('/api/notifications/all/read')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('DELETE /api/notifications/:id should remove selected alert', async () => {
      const res = await request(app)
        .delete(`/api/notifications/${createdNotificationId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // 4. Alert Escalation Engine Logic
  describe('Alert Escalation Engine Logic', () => {
    it('executeScheduleJob should run local scans, save completed scan, and trigger port change alert escalations', async () => {
      // 1. Create a dummy previous scan with port 80 only
      await Scan.create({
        userId: testUserId,
        target: '127.0.0.1',
        targetType: 'ip',
        threatScore: 10,
        riskLevel: 'low',
        breakdown: {
          virusTotal: {
            rawLog: 'PORT     STATE  SERVICE\n80/tcp   open   http'
          }
        },
        status: 'completed'
      });

      // 2. Mock a Scheduled Scan target for 127.0.0.1
      const schedule = await ScheduledScan.create({
        userId: testUserId,
        target: '127.0.0.1',
        targetType: 'ip',
        frequency: 'daily',
        tools: ['nmap'],
        nextRun: new Date()
      });

      // 3. Run job programmatically. It will scan ports and detect more ports open (like 22, 443 etc. natively)
      await executeScheduleJob(schedule);

      // 4. Verify that a High severity notification was created for new open ports
      const notifications = await Notification.find({ userId: testUserId, category: 'port', title: /Security Sentinel/ });
      expect(notifications.length).toBeGreaterThan(0);
      expect(notifications[0].severity).toBe('high');
      expect(notifications[0].title).toContain('Security Sentinel');
    });

    it('executeScheduleJob should check high-risk IOC and trigger critical alert escalations', async () => {
      // Register a mock malicious indicator
      await IOCRecord.create({
        type: 'ip',
        value: '198.51.100.99',
        reputation: 90,
        confidence: 85,
        source: 'Test Bad feed',
        sourceType: 'feed'
      });

      const schedule = await ScheduledScan.create({
        userId: testUserId,
        target: '198.51.100.99',
        targetType: 'ip',
        frequency: 'daily',
        tools: ['nmap'],
        nextRun: new Date()
      });

      await executeScheduleJob(schedule);

      const notifications = await Notification.find({ userId: testUserId, category: 'ioc' });
      expect(notifications.length).toBeGreaterThan(0);
      expect(notifications[0].severity).toBe('critical');

      // Cleanup
      await IOCRecord.deleteMany({ value: '198.51.100.99' });
    });
  });
});
