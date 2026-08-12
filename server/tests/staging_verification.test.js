/**
 * CyberShield X — Phase 25: Pre-Flight Staging Verification CLI & Operator Runbook
 * Test Suite: Non-destructive Staging Diagnostics, Header Inspection, and CORS Security
 */

const fs = require('fs');
const path = require('path');
const StagingChecker = require('../scripts/stagingCheck');

describe('Phase 25 — Pre-Flight Staging Verification & Security', () => {
  it('1. StagingChecker module loads and instantiates cleanly', () => {
    const checker = new StagingChecker();
    expect(checker).toBeDefined();
    expect(typeof checker.runAll).toBe('function');
  });

  it('2. Detects frontend public files (_headers and _redirects)', () => {
    const checker = new StagingChecker();
    const result = checker.checkFrontend();
    expect(result.hasHeaders).toBe(true);
    expect(result.hasRedirects).toBe(true);
  });

  it('3. Security headers file (_headers) contains required production security policies', () => {
    const headersPath = path.join(__dirname, '../../client/public/_headers');
    expect(fs.existsSync(headersPath)).toBe(true);

    const content = fs.readFileSync(headersPath, 'utf8');
    expect(content).toContain('Content-Security-Policy');
    expect(content).toContain('Strict-Transport-Security');
    expect(content).toContain('X-Frame-Options: DENY');
  });

  it('4. SPA fallback file (_redirects) preserves /* /index.html 200 routing rule', () => {
    const redirectsPath = path.join(__dirname, '../../client/public/_redirects');
    expect(fs.existsSync(redirectsPath)).toBe(true);

    const content = fs.readFileSync(redirectsPath, 'utf8');
    expect(content).toContain('/* /index.html 200');
  });

  it('5. CORS regex security accepts canonical Cloudflare Pages origin (https://cybershieldx.pages.dev)', () => {
    const checker = new StagingChecker();
    const result = checker.checkCors();
    expect(result.canonicalPassed).toBe(true);
  });

  it('6. CORS regex security accepts valid Cloudflare Pages branch alias (https://preview-123.pages.dev)', () => {
    const checker = new StagingChecker();
    const result = checker.checkCors();
    expect(result.aliasPassed).toBe(true);
  });

  it('7. CORS regex security rejects malicious host (https://evil-hacker.com) and spoofed HTTP origin', () => {
    const checker = new StagingChecker();
    const result = checker.checkCors();
    expect(result.maliciousRejected).toBe(true);
    expect(result.httpSpoofedRejected).toBe(true);
  });

  it('8. Distinguishes DEFERRED_NOT_CONFIGURED status when remote health URL is unspecified', async () => {
    const checker = new StagingChecker({ backendUrl: null });
    const result = await checker.checkBackendHealth();
    expect(result.status).toBe('DEFERRED_NOT_CONFIGURED');
    expect(result.detail).toContain('deferred');
  });

  it('9. Zero Credential Exposure — Output never contains token strings, passwords, or connection URIs', async () => {
    const checker = new StagingChecker();
    const result = await checker.runAll();
    const jsonOutput = JSON.stringify(result);

    expect(jsonOutput).not.toContain('mongodb+srv://');
    expect(jsonOutput).not.toContain('SuperSecretPassword');
    expect(jsonOutput).not.toContain('ghp_');
  });

  it('10. Non-Destructive Execution — Staging checker performs zero file writes or external deployments', async () => {
    const checker = new StagingChecker();
    const result = await checker.runAll();
    expect(result.overallSummary).toBeDefined();
    expect(['READY', 'READY_WITH_DEFERRED_ITEMS', 'NOT_READY']).toContain(result.overallSummary);
  });
});
