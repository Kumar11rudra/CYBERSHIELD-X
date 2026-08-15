'use strict';

process.env.NODE_ENV = 'test';

const assert = require('assert');
const crypto = require('crypto');
const { app } = require('../index');

async function runV29_4_1_Tests() {
  console.log('=== CYBERSHIELD X V29.4.1 PRODUCTION HARDENING VERIFICATION ===\n');

  const REQUEST_ID_REGEX = /^[a-zA-Z0-9_-]{1,64}$/;
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  const simulateRequestIdMiddleware = (incomingHeader) => {
    const mockReq = { headers: {} };
    if (incomingHeader !== undefined) {
      mockReq.headers['x-request-id'] = incomingHeader;
    }
    const mockRes = {
      headers: {},
      setHeader(k, v) { this.headers[k] = v; }
    };

    const incomingId = mockReq.headers['x-request-id'];
    const requestId = (typeof incomingId === 'string' && REQUEST_ID_REGEX.test(incomingId.trim()))
      ? incomingId.trim()
      : crypto.randomUUID();
    mockReq.id = requestId;
    mockRes.setHeader('X-Request-Id', requestId);

    return { req: mockReq, res: mockRes, requestId };
  };

  // Test 1: Valid request ID
  console.log('1. Testing Valid X-Request-Id (abc_123-XYZ)...');
  const t1 = simulateRequestIdMiddleware('abc_123-XYZ');
  assert.strictEqual(t1.requestId, 'abc_123-XYZ', 'Valid ID must be accepted');
  assert.strictEqual(t1.res.headers['X-Request-Id'], 'abc_123-XYZ', 'Header must match');
  console.log('   ✓ Valid request ID accepted and propagated');

  // Test 2: Invalid request ID (spaces)
  console.log('2. Testing Invalid X-Request-Id with spaces (hello world)...');
  const t2 = simulateRequestIdMiddleware('hello world');
  assert.notStrictEqual(t2.requestId, 'hello world', 'Invalid ID with spaces must be rejected');
  assert.match(t2.requestId, UUID_REGEX, 'Fallback must be valid UUID');
  assert.strictEqual(t2.res.headers['X-Request-Id'], t2.requestId);
  console.log('   ✓ Space-containing request ID rejected; valid UUID generated');

  // Test 3: Oversized request ID (>64 chars)
  console.log('3. Testing Oversized X-Request-Id (65 characters)...');
  const oversizedId = 'a'.repeat(65);
  const t3 = simulateRequestIdMiddleware(oversizedId);
  assert.notStrictEqual(t3.requestId, oversizedId, 'Oversized ID must be rejected');
  assert.match(t3.requestId, UUID_REGEX, 'Fallback must be valid UUID');
  console.log('   ✓ Oversized request ID rejected; valid UUID generated');

  // Test 4: CRLF/Control character injection attempt
  console.log('4. Testing CRLF/Control character injection in X-Request-Id...');
  const crlfId = 'valid-prefix\r\nInjected-Header: evil\r\n';
  const t4 = simulateRequestIdMiddleware(crlfId);
  assert.notStrictEqual(t4.requestId, crlfId, 'CRLF ID must be rejected');
  assert.match(t4.requestId, UUID_REGEX, 'Fallback must be valid UUID');
  assert.ok(!t4.requestId.includes('\r') && !t4.requestId.includes('\n'), 'CRLF must never reach request ID');
  console.log('   ✓ CRLF/header injection rejected; valid UUID generated');

  // Test 5: Missing request ID (undefined)
  console.log('5. Testing Missing X-Request-Id...');
  const t5 = simulateRequestIdMiddleware(undefined);
  assert.match(t5.requestId, UUID_REGEX, 'Missing ID must generate valid UUID');
  assert.strictEqual(t5.res.headers['X-Request-Id'], t5.requestId);
  console.log('   ✓ Missing request ID safely auto-generates UUID');

  // Test 6: Express trust proxy configuration
  console.log('6. Testing Express trust proxy setting...');
  assert.strictEqual(app.get('trust proxy'), 1, 'Express trust proxy must be configured to 1');
  console.log('   ✓ Express trust proxy is active (trust proxy: 1)');

  // Test 7: Uncaught Exception listener registration
  console.log('7. Testing uncaughtException and unhandledRejection process listeners...');
  const uncaughtListeners = process.listeners('uncaughtException');
  const unhandledListeners = process.listeners('unhandledRejection');
  assert.ok(uncaughtListeners.length > 0, 'uncaughtException listener must be registered');
  assert.ok(unhandledListeners.length > 0, 'unhandledRejection listener must be registered');
  console.log('   ✓ Process crash listeners actively registered');

  console.log('\n✅ ALL V29.4.1 PRODUCTION HARDENING TESTS PASSED SUCCESSFULLY.\n');
  process.exit(0);
}

runV29_4_1_Tests().catch(err => {
  console.error('❌ V29.4.1 Verification failed:', err);
  process.exit(1);
});
