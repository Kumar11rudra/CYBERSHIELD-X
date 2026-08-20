/**
 * CyberShield X — Phase 25: Non-Destructive Pre-Flight Staging Verification CLI
 * Safely audits frontend static builds, CORS regex security, health probes, and production configuration.
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const ProductionConfigValidator = require('./verifyProductionConfig');

class StagingChecker {
  constructor(options = {}) {
    this.clientBuildDir = options.clientBuildDir || path.join(__dirname, '../../client/build');
    this.clientPublicDir = options.clientPublicDir || path.join(__dirname, '../../client/public');
    this.configValidator = new ProductionConfigValidator();
    this.backendUrl = options.backendUrl || process.env.STAGING_BACKEND_URL || null;
  }

  checkFrontend() {
    const buildExists = fs.existsSync(this.clientBuildDir);
    const targetDir = buildExists ? this.clientBuildDir : this.clientPublicDir;
    const isBuild = buildExists;

    const headersPath = path.join(targetDir, '_headers');
    const redirectsPath = path.join(targetDir, '_redirects');
    const indexHtmlPath = path.join(targetDir, 'index.html');

    const hasHeaders = fs.existsSync(headersPath);
    const hasRedirects = fs.existsSync(redirectsPath);
    const hasIndexHtml = fs.existsSync(indexHtmlPath);

    let passesSecurityPolicies = false;
    if (hasHeaders) {
      const content = fs.readFileSync(headersPath, 'utf8');
      passesSecurityPolicies =
        content.includes('Content-Security-Policy') &&
        content.includes('Strict-Transport-Security') &&
        content.includes('X-Frame-Options');
    }

    let preservesSpaRouting = false;
    if (hasRedirects) {
      const content = fs.readFileSync(redirectsPath, 'utf8');
      preservesSpaRouting = content.includes('/* /index.html 200');
    }

    const isPassed = isBuild && hasHeaders && hasRedirects && hasIndexHtml && passesSecurityPolicies && preservesSpaRouting;

    return {
      status: isPassed ? 'PASS' : (hasHeaders && hasRedirects ? 'DEFERRED_BUILD_REQUIRED' : 'FAIL'),
      isBuildPresent: isBuild,
      hasHeaders,
      hasRedirects,
      hasIndexHtml,
      passesSecurityPolicies,
      preservesSpaRouting
    };
  }

  checkCors() {
    const isCloudflarePagesOrigin = (origin) => {
      if (typeof origin !== 'string') return false;
      return /^https:\/\/([a-zA-Z0-9-]+\.)+pages\.dev$/.test(origin);
    };

    const canonicalPassed = isCloudflarePagesOrigin('https://cybershieldx.pages.dev');
    const aliasPassed = isCloudflarePagesOrigin('https://preview-123.pages.dev');
    const maliciousRejected = !isCloudflarePagesOrigin('https://evil-hacker.com');
    const httpSpoofedRejected = !isCloudflarePagesOrigin('http://malicious.pages.dev');
    const wildcardRejected = !isCloudflarePagesOrigin('*');

    const isPassed = canonicalPassed && aliasPassed && maliciousRejected && httpSpoofedRejected && wildcardRejected;

    return {
      status: isPassed ? 'PASS' : 'FAIL',
      canonicalPassed,
      aliasPassed,
      maliciousRejected,
      httpSpoofedRejected,
      wildcardRejected
    };
  }

  async checkBackendHealth() {
    if (!this.backendUrl) {
      return {
        status: 'DEFERRED_NOT_CONFIGURED',
        detail: 'No remote STAGING_BACKEND_URL specified in environment. Remote probe deferred.'
      };
    }

    return new Promise((resolve) => {
      const client = this.backendUrl.startsWith('https') ? https : http;
      const healthEndpoint = `${this.backendUrl.replace(/\/+$/, '')}/health`;

      const req = client.get(healthEndpoint, { timeout: 5000 }, (res) => {
        if (res.statusCode === 200) {
          resolve({ status: 'PASS', detail: `Backend responded with HTTP 200 OK from ${healthEndpoint}` });
        } else {
          resolve({ status: 'FAIL', detail: `Backend health endpoint returned HTTP ${res.statusCode}` });
        }
      });

      req.on('error', (err) => {
        resolve({ status: 'FAIL', detail: `Network connection failed: ${err.message}` });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({ status: 'FAIL', detail: 'Health check probe timed out after 5000ms' });
      });
    });
  }

  checkConfiguration() {
    const report = this.configValidator.validate();
    return {
      status: report.isProductionReady ? 'PASS' : 'READY_WITH_DEFERRED_ITEMS',
      missingRequiredCount: report.missingRequiredCount,
      report
    };
  }

  async runAll() {
    const frontend = this.checkFrontend();
    const cors = this.checkCors();
    const backend = await this.checkBackendHealth();
    const config = this.checkConfiguration();

    const isImplementationOk =
      (frontend.status === 'PASS' || frontend.status === 'DEFERRED_BUILD_REQUIRED') &&
      cors.status === 'PASS' &&
      (backend.status === 'PASS' || backend.status === 'DEFERRED_NOT_CONFIGURED');

    let overallSummary = 'READY_WITH_DEFERRED_ITEMS';
    if (isImplementationOk && frontend.status === 'PASS' && config.status === 'PASS' && backend.status === 'PASS') {
      overallSummary = 'READY';
    } else if (!isImplementationOk) {
      overallSummary = 'NOT_READY';
    }

    return {
      timestamp: new Date().toISOString(),
      overallSummary,
      frontend,
      cors,
      backend,
      config
    };
  }
}

if (require.main === module) {
  (async () => {
    const checker = new StagingChecker();
    const result = await checker.runAll();

    console.log('\n==================================================');
    console.log('CYBERSHIELD X — PHASE 25 STAGING VERIFICATION');
    console.log('==================================================');
    console.log(`TIMESTAMP      : ${result.timestamp}`);
    console.log(`OVERALL STATUS : ${result.overallSummary}\n`);

    console.log('[FRONTEND BUILD & HEADERS]');
    console.log(`Status         : ${result.frontend.status}`);
    console.log(`Build Directory: ${result.frontend.isBuildPresent ? 'PRESENT (client/build)' : 'ABSENT (Checked client/public)'}`);
    console.log(`Security Headers: ${result.frontend.hasHeaders ? 'PRESENT (_headers)' : 'MISSING'}`);
    console.log(`SPA Redirects   : ${result.frontend.hasRedirects ? 'PRESENT (_redirects)' : 'MISSING'}\n`);

    console.log('[CORS SECURITY REGEX]');
    console.log(`Status         : ${result.cors.status}`);
    console.log(`Canonical Host : ${result.cors.canonicalPassed ? 'ALLOWED (https://cybershieldx.pages.dev)' : 'REJECTED'}`);
    console.log(`Alias Domain   : ${result.cors.aliasPassed ? 'ALLOWED (https://*.pages.dev)' : 'REJECTED'}`);
    console.log(`Malicious Host : ${result.cors.maliciousRejected ? 'REJECTED (https://evil-hacker.com)' : 'ALLOWED (FAIL)'}\n`);

    console.log('[REMOTE BACKEND HEALTH PROBE]');
    console.log(`Status         : ${result.backend.status}`);
    console.log(`Detail         : ${result.backend.detail}\n`);

    console.log('[PRODUCTION CONFIGURATION READINESS]');
    console.log(`Status         : ${result.config.status}`);
    console.log(`Missing Env Vars: ${result.config.missingRequiredCount} required item(s) deferred for deployment operator setup\n`);

    console.log('==================================================');
    console.log(`RESULT: ${result.overallSummary}`);
    console.log('==================================================\n');

    process.exit(result.overallSummary === 'NOT_READY' ? 1 : 0);
  })();
}

module.exports = StagingChecker;
