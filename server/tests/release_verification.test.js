/**
 * CyberShield X — Phase 27: Release Verification & Launch Gate Test Suite
 * Validates non-destructive releaseCheck.js script, infrastructure blueprints, and governance documentation.
 */

const fs = require('fs');
const path = require('path');
const ReleaseChecker = require('../scripts/releaseCheck');

describe('Phase 27 — Release Verification & Launch Gate', () => {
  it('1. ReleaseChecker module instantiates and executes non-destructively', () => {
    const checker = new ReleaseChecker();
    expect(checker).toBeDefined();
    expect(typeof checker.runAll).toBe('function');

    const result = checker.runAll();
    expect(result.overallStatus).toBe('READY_FOR_RELEASE');
  });

  it('2. Detects valid render.yaml infrastructure blueprint', () => {
    const checker = new ReleaseChecker();
    const result = checker.checkBlueprint();
    expect(result.status).toBe('PASS');
    expect(result.exists).toBe(true);
    expect(result.valid).toBe(true);
  });

  it('3. Detects frontend static build manifests (_headers and _redirects)', () => {
    const checker = new ReleaseChecker();
    const result = checker.checkBuildManifests();
    expect(result.status).toBe('PASS');
    expect(result.hasHeaders).toBe(true);
    expect(result.hasRedirects).toBe(true);
  });

  it('4. Confirms all governance & release docs exist (RELEASE_CHECKLIST.md, DEPLOYMENT_RUNBOOK.md)', () => {
    const checker = new ReleaseChecker();
    const result = checker.checkGovernanceDocs();
    expect(result.status).toBe('PASS');
    expect(result.missingDocs.length).toBe(0);
  });

  it('5. Target deployment stack is Cloudflare Pages + Render + MongoDB Atlas with Vercel excluded', () => {
    const checker = new ReleaseChecker();
    const result = checker.checkActiveTargetStack();
    expect(result.status).toBe('PASS');
    expect(result.isVercelExcluded).toBe(true);
  });

  it('6. Secret Sanity Audit — Zero secret literals in release files', () => {
    const checker = new ReleaseChecker();
    const result = checker.checkSecretLeaks();
    expect(result.status).toBe('PASS');
    expect(result.leakFound).toBe(false);
  });
});
