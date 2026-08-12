/**
 * CyberShield X — Phase 26: Live Model Performance & Timeout Hardening Test Suite
 * Verifies that all live models settle within 10–15s maximum deadlines, return structured responses, and expose zero secrets.
 */

const request = require('supertest');
const express = require('express');
const toolsController = require('../controllers/toolsController');

const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.post('/api/tools/sms-analyzer', toolsController.analyzeSMS);
  app.post('/api/tools/upi-verifier', toolsController.verifyUPI);
  app.post('/api/tools/whois', toolsController.whoisLookup);
  app.post('/api/tools/ssl-checker', toolsController.checkSSL);
  app.post('/api/tools/phishing-detector', toolsController.detectPhishing);
  return app;
};

describe('Phase 26 — Live Model Performance & Timeout Hardening', () => {
  let app;

  beforeAll(() => {
    app = createTestApp();
  });

  it('1. Local utility model (SMS Analyzer) executes in < 100ms', async () => {
    const start = Date.now();
    const res = await request(app)
      .post('/api/tools/sms-analyzer')
      .send({ message: 'URGENT: Your bank account will be suspended. Click bit.ly/123 to verify OTP.' });

    const elapsed = Date.now() - start;
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.analysis.riskLevel).toBeDefined();
    expect(elapsed).toBeLessThan(100);
  });

  it('2. Local utility model (UPI Verifier) executes in < 100ms', async () => {
    const start = Date.now();
    const res = await request(app)
      .post('/api/tools/upi-verifier')
      .send({ upiId: 'user@oksbi' });

    const elapsed = Date.now() - start;
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.analysis.format_valid).toBe(true);
    expect(elapsed).toBeLessThan(100);
  });

  it('3. Live WHOIS model responds within 10,000ms deadline', async () => {
    const start = Date.now();
    const res = await request(app)
      .post('/api/tools/whois')
      .send({ domain: 'example.com' });

    const elapsed = Date.now() - start;
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.whois).toBeDefined();
    expect(res.body.dns).toBeDefined();
    expect(elapsed).toBeLessThan(10000);
  }, 12000);

  it('4. Live SSL Checker model responds within 10,000ms deadline', async () => {
    const start = Date.now();
    const res = await request(app)
      .post('/api/tools/ssl-checker')
      .send({ domain: 'example.com' });

    const elapsed = Date.now() - start;
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.ssl).toBeDefined();
    expect(elapsed).toBeLessThan(10000);
  }, 12000);

  it('5. Live Phishing Detector responds within 10,000ms deadline', async () => {
    const start = Date.now();
    const res = await request(app)
      .post('/api/tools/phishing-detector')
      .send({ url: 'https://example.com/test' });

    const elapsed = Date.now() - start;
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.analysis).toBeDefined();
    expect(elapsed).toBeLessThan(10000);
  }, 12000);

  it('6. Zero Secret Exposure — Response payloads do not expose tokens, keys, or internal credentials', async () => {
    const res = await request(app)
      .post('/api/tools/sms-analyzer')
      .send({ message: 'test' });

    const jsonStr = JSON.stringify(res.body);
    expect(jsonStr).not.toContain('mongodb+srv://');
    expect(jsonStr).not.toContain('JWT_SECRET');
    expect(jsonStr).not.toContain('ghp_');
  });

  it('7. Rejection of SSRF targets — Prohibits private / loopback IP queries', async () => {
    const res = await request(app)
      .post('/api/tools/whois')
      .send({ domain: 'localhost' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBeDefined();
  });
});
