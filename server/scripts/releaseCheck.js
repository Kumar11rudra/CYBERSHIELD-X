/**
 * CyberShield X — Phase 27: Non-Destructive Pre-Deployment Release Verification CLI
 * Audits repository infrastructure blueprints, release checklists, security policies, and target stack alignment.
 */

const fs = require('fs');
const path = require('path');

class ReleaseChecker {
  constructor(options = {}) {
    this.rootDir = options.rootDir || path.join(__dirname, '../..');
    this.clientDir = path.join(this.rootDir, 'client');
    this.serverDir = path.join(this.rootDir, 'server');
    this.clientBuildDir = path.join(this.clientDir, 'build');
    this.clientPublicDir = path.join(this.clientDir, 'public');
  }

  checkBlueprint() {
    const blueprintPath = path.join(this.rootDir, 'render.yaml');
    const exists = fs.existsSync(blueprintPath);

    let valid = false;
    if (exists) {
      const content = fs.readFileSync(blueprintPath, 'utf8');
      valid = content.includes('type: web') && content.includes('env: node') && content.includes('healthCheckPath: /health');
    }

    return {
      status: exists && valid ? 'PASS' : 'FAIL',
      exists,
      valid
    };
  }

  checkBuildManifests() {
    const buildExists = fs.existsSync(this.clientBuildDir);
    const targetDir = buildExists ? this.clientBuildDir : this.clientPublicDir;

    const hasHeaders = fs.existsSync(path.join(targetDir, '_headers'));
    const hasRedirects = fs.existsSync(path.join(targetDir, '_redirects'));

    return {
      status: hasHeaders && hasRedirects ? 'PASS' : 'FAIL',
      isBuildPresent: buildExists,
      hasHeaders,
      hasRedirects
    };
  }

  checkGovernanceDocs() {
    const docs = [
      { name: 'LICENSE', path: path.join(this.rootDir, 'LICENSE') },
      { name: 'SECURITY.md', path: path.join(this.rootDir, 'SECURITY.md') },
      { name: 'CONTRIBUTING.md', path: path.join(this.rootDir, 'CONTRIBUTING.md') },
      { name: 'RELEASE_CHECKLIST.md', path: path.join(this.rootDir, 'docs/RELEASE_CHECKLIST.md') },
      { name: 'DEPLOYMENT_RUNBOOK.md', path: path.join(this.rootDir, 'docs/DEPLOYMENT_RUNBOOK.md') }
    ];

    const missing = docs.filter(d => !fs.existsSync(d.path)).map(d => d.name);

    return {
      status: missing.length === 0 ? 'PASS' : 'FAIL',
      missingDocs: missing
    };
  }

  checkActiveTargetStack() {
    const serverPackage = JSON.parse(fs.readFileSync(path.join(this.serverDir, 'package.json'), 'utf8'));
    const rootPackage = JSON.parse(fs.readFileSync(path.join(this.rootDir, 'package.json'), 'utf8'));

    const hasVercelDep = Boolean(
      (serverPackage.dependencies && serverPackage.dependencies.vercel) ||
      (rootPackage.dependencies && rootPackage.dependencies.vercel)
    );

    return {
      status: !hasVercelDep ? 'PASS' : 'FAIL',
      targetStack: 'Cloudflare Pages + Render Web Service + MongoDB Atlas',
      isVercelExcluded: !hasVercelDep
    };
  }

  checkSecretLeaks() {
    const checkFiles = [
      path.join(this.rootDir, 'LICENSE'),
      path.join(this.rootDir, 'CONTRIBUTING.md'),
      path.join(this.rootDir, 'SECURITY.md'),
      path.join(this.rootDir, 'docs/RELEASE_CHECKLIST.md'),
      path.join(this.rootDir, 'docs/DEPLOYMENT_RUNBOOK.md'),
      path.join(this.rootDir, 'render.yaml')
    ];

    let leakFound = false;
    for (const filePath of checkFiles) {
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        if (content.includes('mongodb+srv://user:pass') || content.includes('ghp_1234567890')) {
          leakFound = true;
          break;
        }
      }
    }

    return {
      status: !leakFound ? 'PASS' : 'FAIL',
      leakFound
    };
  }

  runAll() {
    const blueprint = this.checkBlueprint();
    const manifests = this.checkBuildManifests();
    const docs = this.checkGovernanceDocs();
    const stack = this.checkActiveTargetStack();
    const leaks = this.checkSecretLeaks();

    const isPass =
      blueprint.status === 'PASS' &&
      manifests.status === 'PASS' &&
      docs.status === 'PASS' &&
      stack.status === 'PASS' &&
      leaks.status === 'PASS';

    return {
      timestamp: new Date().toISOString(),
      overallStatus: isPass ? 'READY_FOR_RELEASE' : 'RELEASE_CHECKS_FAILED',
      blueprint,
      manifests,
      docs,
      stack,
      leaks
    };
  }
}

if (require.main === module) {
  const checker = new ReleaseChecker();
  const result = checker.runAll();

  console.log('\n==================================================');
  console.log('CYBERSHIELD X — PHASE 27 RELEASE VERIFICATION');
  console.log('==================================================');
  console.log(`TIMESTAMP      : ${result.timestamp}`);
  console.log(`OVERALL STATUS : ${result.overallStatus}\n`);

  console.log('[RENDER INFRASTRUCTURE BLUEPRINT]');
  console.log(`Status         : ${result.blueprint.status}`);
  console.log(`render.yaml    : ${result.blueprint.exists ? 'PRESENT' : 'MISSING'}\n`);

  console.log('[FRONTEND BUILD MANIFESTS]');
  console.log(`Status         : ${result.manifests.status}`);
  console.log(`Security Headers: ${result.manifests.hasHeaders ? 'PRESENT (_headers)' : 'MISSING'}`);
  console.log(`SPA Redirects   : ${result.manifests.hasRedirects ? 'PRESENT (_redirects)' : 'MISSING'}\n`);

  console.log('[GOVERNANCE & RELEASE DOCS]');
  console.log(`Status         : ${result.docs.status}`);
  console.log(`Missing Docs   : ${result.docs.missingDocs.length > 0 ? result.docs.missingDocs.join(', ') : 'NONE'}\n`);

  console.log('[TARGET DEPLOYMENT STACK]');
  console.log(`Status         : ${result.stack.status}`);
  console.log(`Target Architecture: ${result.stack.targetStack}`);
  console.log(`Vercel Excluded    : ${result.stack.isVercelExcluded ? 'YES' : 'NO'}\n`);

  console.log('==================================================');
  console.log(`RESULT: ${result.overallStatus}`);
  console.log('==================================================\n');

  process.exit(result.overallStatus === 'READY_FOR_RELEASE' ? 0 : 1);
}

module.exports = ReleaseChecker;
