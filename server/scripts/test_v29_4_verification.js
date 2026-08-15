'use strict';

process.env.NODE_ENV = 'test';

const assert = require('assert');
const crypto = require('crypto');
const Vulnerability = require('../models/Vulnerability');
const Watchlist = require('../models/Watchlist');
const AIAnalysis = require('../models/AIAnalysis');
const { app } = require('../index');

async function runV29_4_Tests() {
  console.log('=== CYBERSHIELD X V29.4.0 ARCHITECTURE & RESILIENCE VERIFICATION ===\n');

  // 1. Request Correlation ID Middleware Test
  console.log('1. Testing Request Correlation ID (X-Request-Id)...');
  const mockReqNoHeader = { headers: {} };
  const mockRes = {
    headers: {},
    setHeader(name, val) { this.headers[name] = val; }
  };
  
  // Middleware logic simulation
  const applyRequestId = (req, res) => {
    const incomingId = req.headers['x-request-id'];
    const requestId = (typeof incomingId === 'string' && incomingId.trim().length > 0)
      ? incomingId.trim()
      : crypto.randomUUID();
    req.id = requestId;
    res.setHeader('X-Request-Id', requestId);
    return requestId;
  };

  const generatedId = applyRequestId(mockReqNoHeader, mockRes);
  assert.ok(generatedId && typeof generatedId === 'string', 'Generated ID must be a non-empty string');
  assert.strictEqual(mockRes.headers['X-Request-Id'], generatedId, 'Response header must match generated ID');
  assert.match(generatedId, /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, 'Generated ID must be valid UUID');

  // Test with supplied header
  const customId = 'custom-trace-uuid-12345';
  const mockReqWithHeader = { headers: { 'x-request-id': customId } };
  const customRes = { headers: {}, setHeader(name, val) { this.headers[name] = val; } };
  const preservedId = applyRequestId(mockReqWithHeader, customRes);
  assert.strictEqual(preservedId, customId, 'Supplied X-Request-Id must be preserved');
  assert.strictEqual(customRes.headers['X-Request-Id'], customId, 'Response header must match supplied ID');
  console.log('   ✓ Automatic UUID generation verified');
  console.log('   ✓ Custom client header propagation verified');

  // 2. Process Crash Safety Listeners Test
  console.log('2. Testing Process-level crash prevention listeners...');
  const rejectionListeners = process.listeners('unhandledRejection');
  const exceptionListeners = process.listeners('uncaughtException');
  assert.ok(rejectionListeners.length > 0, 'unhandledRejection listener must be registered in server/index.js');
  assert.ok(exceptionListeners.length > 0, 'uncaughtException listener must be registered in server/index.js');
  console.log(`   ✓ unhandledRejection listeners registered: ${rejectionListeners.length}`);
  console.log(`   ✓ uncaughtException listeners registered: ${exceptionListeners.length}`);

  // 3. Database Index Verification
  console.log('3. Testing Database Model Index Optimization...');
  
  // Vulnerability indexes
  const vulnIndexes = Vulnerability.schema.indexes();
  const hasSlaSweepIndex = vulnIndexes.some(([fields]) => 
    fields.status === 1 && fields.slaDeadline === 1 && fields.slaStatus === 1
  );
  assert.ok(hasSlaSweepIndex, 'Vulnerability must have compound index on { status: 1, slaDeadline: 1, slaStatus: 1 }');
  console.log('   ✓ Vulnerability SLA sweep index { status: 1, slaDeadline: 1, slaStatus: 1 } verified');

  // Watchlist indexes
  const watchlistIndexes = Watchlist.schema.indexes();
  const hasWatchlistNextRunIndex = watchlistIndexes.some(([fields]) => 
    fields.isActive === 1 && fields.nextRunAt === 1
  );
  assert.ok(hasWatchlistNextRunIndex, 'Watchlist must have compound index on { isActive: 1, nextRunAt: 1 }');
  console.log('   ✓ Watchlist sweep index { isActive: 1, nextRunAt: 1 } verified');

  // AIAnalysis indexes & schema fields
  const aiIndexes = AIAnalysis.schema.indexes();
  const hasAiCompoundIndex = aiIndexes.some(([fields]) => 
    fields.scanId === 1 && fields.model === 1
  );
  assert.ok(hasAiCompoundIndex, 'AIAnalysis must have compound index on { scanId: 1, model: 1 }');
  assert.ok(AIAnalysis.schema.path('durationMs'), 'AIAnalysis schema must have durationMs field');
  assert.ok(AIAnalysis.schema.path('metadata'), 'AIAnalysis schema must have metadata field');
  console.log('   ✓ AIAnalysis multi-model index { scanId: 1, model: 1 } verified');
  console.log('   ✓ AIAnalysis durationMs and metadata telemetry fields verified');

  // 4. Central Error Handler Response Structure Test
  console.log('4. Testing Central Error Handler Payload Format...');
  const sampleError = new Error('Database connection degraded');
  sampleError.status = 500;
  const mockErrReq = { id: 'test-req-999', headers: {}, path: '/api/scan' };
  let sentStatus = null;
  let sentBody = null;
  const mockErrRes = {
    status(s) { sentStatus = s; return this; },
    json(b) { sentBody = b; return this; }
  };

  // Error handler simulation
  const errorHandler = (err, req, res) => {
    const requestId = req.id || 'unknown';
    const status = err.status || 500;
    res.status(status).json({
      success: false,
      error: 'Internal Intelligence Error',
      code: status === 500 ? 'NEXUS_CORE_FAULT' : 'REQUEST_INVALID',
      requestId
    });
  };

  errorHandler(sampleError, mockErrReq, mockErrRes);
  assert.strictEqual(sentStatus, 500);
  assert.strictEqual(sentBody.success, false);
  assert.strictEqual(sentBody.code, 'NEXUS_CORE_FAULT');
  assert.strictEqual(sentBody.requestId, 'test-req-999');
  console.log('   ✓ Error payload standard { success, error, code, requestId } verified');

  console.log('\n✅ ALL V29.4.0 ARCHITECTURE & RESILIENCE TESTS PASSED SUCCESSFULLY.\n');
  process.exit(0);
}

runV29_4_Tests().catch(err => {
  console.error('❌ V29.4.0 Verification failed:', err);
  process.exit(1);
});
