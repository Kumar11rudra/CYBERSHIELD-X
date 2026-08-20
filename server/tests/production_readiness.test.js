/**
 * CyberShield X — Phase 24: Cloudflare Pages & Render Operational Hardening
 * Test Suite: CORS Security, Security Headers, SPA Fallback, and Production Config Auditing
 */

const fs = require('fs');
const path = require('path');
const request = require('supertest');
const { app } = require('../index');
const ProductionConfigValidator = require('../scripts/verifyProductionConfig');

describe('Phase 24 — Production Readiness & Operational Hardening', () => {
  describe('CORS Origin Validation Security', () => {
    it('1. Accepts Cloudflare Pages canonical origin (https://cybershieldx.pages.dev)', async () => {
      const res = await request(app)
        .options('/health')
        .set('Origin', 'https://cybershieldx.pages.dev')
        .set('Access-Control-Request-Method', 'GET');
      expect(res.headers['access-control-allow-origin']).toBe('https://cybershieldx.pages.dev');
    });

    it('1b. Accepts custom domain origin (https://cybershieldx.in)', async () => {
      const res = await request(app)
        .options('/health')
        .set('Origin', 'https://cybershieldx.in')
        .set('Access-Control-Request-Method', 'GET');
      expect(res.headers['access-control-allow-origin']).toBe('https://cybershieldx.in');
    });

    it('1c. Accepts www custom domain origin (https://www.cybershieldx.in)', async () => {
      const res = await request(app)
        .options('/health')
        .set('Origin', 'https://www.cybershieldx.in')
        .set('Access-Control-Request-Method', 'GET');
      expect(res.headers['access-control-allow-origin']).toBe('https://www.cybershieldx.in');
    });

    it('2. Accepts valid Cloudflare Pages branch alias origin (https://preview-123.pages.dev)', async () => {
      const res = await request(app)
        .options('/health')
        .set('Origin', 'https://preview-123.pages.dev')
        .set('Access-Control-Request-Method', 'GET');
      expect(res.headers['access-control-allow-origin']).toBe('https://preview-123.pages.dev');
    });

    it('2b. Accepts multi-segment Cloudflare Pages preview branch alias origin (https://8fccc2b2.cybershield-x.pages.dev)', async () => {
      const res = await request(app)
        .options('/health')
        .set('Origin', 'https://8fccc2b2.cybershield-x.pages.dev')
        .set('Access-Control-Request-Method', 'GET');
      expect(res.headers['access-control-allow-origin']).toBe('https://8fccc2b2.cybershield-x.pages.dev');
    });

    it('3. Rejects unrelated malicious origin (https://evil-hacker.com)', async () => {
      const res = await request(app)
        .options('/health')
        .set('Origin', 'https://evil-hacker.com')
        .set('Access-Control-Request-Method', 'GET');
      expect(res.headers['access-control-allow-origin']).toBeUndefined();
    });

    it('4. Rejects HTTP (non-SSL) spoofed pages origin (http://malicious.pages.dev)', async () => {
      const res = await request(app)
        .options('/health')
        .set('Origin', 'http://malicious.pages.dev')
        .set('Access-Control-Request-Method', 'GET');
      expect(res.headers['access-control-allow-origin']).toBeUndefined();
    });
  });

  describe('Cloudflare Pages Manifest Files Inspection', () => {
    it('5. Security headers file (_headers) exists and contains production security policies', () => {
      const headersPath = path.join(__dirname, '../../client/public/_headers');
      expect(fs.existsSync(headersPath)).toBe(true);

      const content = fs.readFileSync(headersPath, 'utf8');
      expect(content).toContain('Content-Security-Policy');
      expect(content).toContain('Strict-Transport-Security');
      expect(content).toContain('X-Frame-Options');
      expect(content).toContain('X-Content-Type-Options');
      expect(content).toContain('Referrer-Policy');
    });

    it('6. SPA fallback file (_redirects) exists and preserves /* /index.html 200 rule', () => {
      const redirectsPath = path.join(__dirname, '../../client/public/_redirects');
      expect(fs.existsSync(redirectsPath)).toBe(true);

      const content = fs.readFileSync(redirectsPath, 'utf8');
      expect(content).toContain('/* /index.html 200');
    });
  });

  describe('Non-Destructive Production Config Validator', () => {
    it('7. Detects missing required environment variables in empty test environment', () => {
      const validator = new ProductionConfigValidator();
      const report = validator.validate({});
      expect(report.isProductionReady).toBe(false);
      expect(report.missingRequiredCount).toBeGreaterThan(0);
    });

    it('8. Confirms production readiness when all required environment variables are valid', () => {
      const mockEnv = {
        MONGODB_URI: 'mongodb+srv://user:pass@cluster.mongodb.net/test',
        JWT_SECRET: '32_character_minimum_secret_key_for_testing_123456',
        JWT_REFRESH_SECRET: '32_character_minimum_refresh_key_testing_123456',
        VAULT_ENCRYPTION_KEY: '16_char_encryption_key',
        CLIENT_URL: 'https://cybershieldx.pages.dev'
      };

      const validator = new ProductionConfigValidator();
      const report = validator.validate(mockEnv);
      expect(report.isProductionReady).toBe(true);
      expect(report.missingRequiredCount).toBe(0);
    });

    it('9. Zero Secret Exposure — Diagnostic output never leaks secret contents or connection URIs', () => {
      const secretURI = 'mongodb+srv://admin:SuperSecretPass123@cluster.mongodb.net/prod';
      const secretJWT = 'SuperSecretJWTTokenValueThatMustNeverBePrinted';

      const mockEnv = {
        MONGODB_URI: secretURI,
        JWT_SECRET: secretJWT,
        CLIENT_URL: 'https://cybershieldx.pages.dev'
      };

      const validator = new ProductionConfigValidator();
      const report = validator.validate(mockEnv);
      const jsonOutput = JSON.stringify(report);

      expect(jsonOutput).not.toContain(secretURI);
      expect(jsonOutput).not.toContain(secretJWT);
      expect(jsonOutput).not.toContain('SuperSecretPass123');
    });

    it('10. Health check endpoint /health returns 200 OK without requiring database connection', async () => {
      const res = await request(app).get('/health');
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('status');
    });
  });
});
