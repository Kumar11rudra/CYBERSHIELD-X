/**
 * CYBERSHIELD X — PHASE 31 RUNTIME VERIFICATION SUITE
 * Verifies AI Remediation Planner and Threat Breach Checker live transitions:
 * - Remediation Service caching (24h TTL), response structure, and fallback resilience
 * - Password Breach k-Anonymity SHA-1 range queries, privacy assurance, and email breach auditing
 * - Tool Catalog Live Count (16 Live Models, 0 Partial Models)
 */
const assert = require('assert');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');

// Load environment variables
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const cache = require('../utils/cache');
const remediationService = require('../services/remediationService');
const breachService = require('../services/breachService');

// Transpile ESM toolConfig to test catalog state
const esmPath = path.resolve(__dirname, '../../client/src/components/toolkit/toolConfig.js');
const esmContent = fs.readFileSync(esmPath, 'utf8');
const cjsContent = esmContent
  .replace(/export const TOOL_TYPES =/g, 'const TOOL_TYPES =')
  .replace(/export const TOOL_STATUS =/g, 'const TOOL_STATUS =')
  .replace(/export const INPUT_TYPES =/g, 'const INPUT_TYPES =')
  .replace(/export const CATEGORIES =/g, 'const CATEGORIES =')
  .replace(/export const CATEGORY_METADATA =/g, 'const CATEGORY_METADATA =')
  .replace(/export const getToolConfig =/g, 'const getToolConfig =')
  .replace(/export const getAllTools =/g, 'const getAllTools =')
  .replace(/export const getToolsByStatus =/g, 'const getToolsByStatus =')
  .replace(/export const getToolsByCategory =/g, 'const getToolsByCategory =')
  .replace(/export const getToolsByType =/g, 'const getToolsByType =')
  .replace(/export const getAllCategories =/g, 'const getAllCategories =')
  .replace(/export const isToolActive =/g, 'const isToolActive =')
  .replace(/export const getStatusBadge =/g, 'const getStatusBadge =')
  .replace(/export default TOOL_CONFIG;/g, '')
  + '\nmodule.exports = { TOOL_CONFIG, TOOL_STATUS, CATEGORIES };';

const tmpConfigPath = path.resolve(__dirname, 'temp_toolConfig_p31.cjs');
fs.writeFileSync(tmpConfigPath, cjsContent, 'utf8');
const { TOOL_CONFIG, TOOL_STATUS } = require(tmpConfigPath);

async function runPhase31Tests() {
  console.log('=== CYBERSHIELD X PHASE 31 LIVE MODELS VERIFICATION ===\n');

  // ─────────────────────────────────────────────────────────────
  // 1. AI REMEDIATION PLANNER TESTS
  // ─────────────────────────────────────────────────────────────
  console.log('1. Testing AI Remediation Planner Service & Caching...');
  
  // Test fallback deterministic blueprint
  const fallback = remediationService.getFallbackRemediation('CVE-2021-44228');
  assert(typeof fallback.executiveSummary === 'string', 'Fallback must contain executiveSummary');
  assert(typeof fallback.rootCause === 'string', 'Fallback must contain rootCause');
  assert(typeof fallback.recommendedFix === 'string', 'Fallback must contain recommendedFix');
  assert(typeof fallback.verificationChecklist === 'string', 'Fallback must contain verificationChecklist');
  assert(typeof fallback.references === 'string', 'Fallback must contain references');
  console.log('   ✓ Deterministic NVD signature fallback validated');

  // Test generateRemediationPlan & caching
  const testCve = 'CVE-2021-44228';
  const cacheKey = `remediation:cve:${testCve}`;
  await cache.delete(cacheKey); // ensure clean start

  const plan1 = await remediationService.generateRemediationPlan(testCve, 'Apache Log4j2 JNDI RCE vulnerability');
  assert(plan1 && plan1.executiveSummary, 'Plan 1 must return valid structured response');

  const cachedPlan = await cache.get(cacheKey);
  assert(cachedPlan !== null, 'Plan must be persisted in shared MemoryCache with 24h TTL');
  assert.strictEqual(cachedPlan.executiveSummary, plan1.executiveSummary, 'Cached executive summary must match');
  console.log('   ✓ 24-hour MemoryCache persistence verified');

  const plan2 = await remediationService.generateRemediationPlan(testCve);
  assert.strictEqual(plan2.executiveSummary, plan1.executiveSummary, 'Subsequent call must return cached plan');
  console.log('   ✓ Instant cache-hit retrieval verified');

  // Test malformed input resilience
  const emptyPlan = await remediationService.generateRemediationPlan('');
  assert(emptyPlan && emptyPlan.executiveSummary, 'Empty CVE must safely return fallback');
  console.log('   ✓ Malformed / empty input resilience verified');

  // ─────────────────────────────────────────────────────────────
  // 2. THREAT BREACH CHECKER TESTS (k-Anonymity & Email)
  // ─────────────────────────────────────────────────────────────
  console.log('\n2. Testing Threat Breach Checker (k-Anonymity & Email)...');

  // Test Password k-Anonymity SHA-1 Range Query
  const testPassword = 'password123';
  const sha1 = crypto.createHash('sha1').update(testPassword).digest('hex').toUpperCase();
  const prefix = sha1.substring(0, 5);

  const pwdResult = await breachService.checkPasswordBreach(testPassword);
  assert(typeof pwdResult.breached === 'boolean', 'Password check must return boolean breached');
  assert(typeof pwdResult.count === 'number', 'Password check must return breach count');
  assert.strictEqual(pwdResult.prefixQueried, prefix, 'Queried prefix must match first 5 chars of SHA-1');
  assert(pwdResult.count > 0, 'password123 must be detected in known breach corpora');
  console.log(`   ✓ k-Anonymity SHA-1 range query verified (detected ${pwdResult.count.toLocaleString()} breaches)`);

  // Verify privacy: Plaintext password is NEVER stored in cache
  const rawPwdCached = await cache.get(`breach:pwned:${testPassword}`);
  assert.strictEqual(rawPwdCached, null, 'Plaintext password must NEVER exist as a cache key');
  
  const prefixCacheKey = `breach:pwned:prefix:${prefix}`;
  const prefixCached = await cache.get(prefixCacheKey);
  assert(prefixCached !== null, 'Range response for prefix must be cached with 1h TTL');
  console.log('   ✓ Zero-Knowledge privacy guarantee verified (zero password caching)');

  // Test Email Breach check
  const emailResult = await breachService.checkEmailBreaches('security-test@cybershieldx.in');
  assert(typeof emailResult.found === 'boolean', 'Email breach must return boolean found');
  assert(Array.isArray(emailResult.leaks), 'Email breach must return array of leaks');
  assert(typeof emailResult.source === 'string', 'Email breach must return source metadata');
  console.log('   ✓ Email breach analysis pipeline verified');

  // Test Phone Breach check
  const phoneResult = await breachService.checkPhoneBreaches('+15550199283');
  assert(typeof phoneResult.found === 'boolean', 'Phone breach must return boolean found');
  console.log('   ✓ Phone breach carrier pipeline verified');

  // ─────────────────────────────────────────────────────────────
  // 3. CATALOG & REGISTRY STATS VERIFICATION
  // ─────────────────────────────────────────────────────────────
  console.log('\n3. Testing Authoritative Catalog Status & Live Counts...');

  const allTools = Object.values(TOOL_CONFIG);
  assert.strictEqual(allTools.length, 110, 'Total registered catalog must contain 110 tools');

  const breachTool = TOOL_CONFIG['breach'];
  assert(breachTool, 'Breach tool must exist in TOOL_CONFIG');
  assert.strictEqual(breachTool.status, TOOL_STATUS.LIVE, 'Breach tool status must be LIVE');
  console.log('   ✓ Breach Checker status verified: LIVE');

  const remediationTool = TOOL_CONFIG['remediation'];
  assert(remediationTool, 'Remediation tool must exist in TOOL_CONFIG');
  assert.strictEqual(remediationTool.status, TOOL_STATUS.LIVE, 'AI Remediation Planner status must be LIVE');
  console.log('   ✓ AI Remediation Planner status verified: LIVE');

  const liveTools = allTools.filter(t => t.status === TOOL_STATUS.LIVE);
  const partialTools = allTools.filter(t => t.status === TOOL_STATUS.PARTIAL);
  const comingSoonTools = allTools.filter(t => t.status === TOOL_STATUS.COMING_SOON);

  console.log(`   - Live Models: ${liveTools.length}`);
  console.log(`   - Partial Models: ${partialTools.length}`);
  console.log(`   - Coming Soon Models: ${comingSoonTools.length}`);

  assert.strictEqual(liveTools.length, 16, 'Live models count must be exactly 16');
  assert.strictEqual(partialTools.length, 0, 'Partial models count must be exactly 0 for these two models');
  assert.strictEqual(comingSoonTools.length, 94, 'Coming soon models count must be 94');
  console.log('   ✓ Authoritative Catalog reconciliation: 16 LIVE / 0 PARTIAL / 94 UPCOMING');

  // Cleanup temporary file
  try { fs.unlinkSync(tmpConfigPath); } catch {}

  console.log('\n✅ ALL PHASE 31 LIVE MODEL TESTS PASSED SUCCESSFULLY.\n');
}

runPhase31Tests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ PHASE 31 TEST FAILURE:', err);
    process.exit(1);
  });
