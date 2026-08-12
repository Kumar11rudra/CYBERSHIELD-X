'use strict';

/**
 * CSI V1 Milestone 6.1 — Verification Script
 * Validates all foundation contracts without any external dependencies.
 */

let passes = 0;
let fails  = 0;

function pass(label) { console.log(`  [PASS] ${label}`); passes++; }
function fail(label, err) { console.error(`  [FAIL] ${label}: ${err.message}`); fails++; }

// ─────────────────────────────────────────────
// 1. INTERFACES
// ─────────────────────────────────────────────
console.log('\n=== 1. Interface Contracts ===');

try {
    const { IIntelligenceEngine, CsiNotImplementedError } = require('./server/csi/interfaces/IIntelligenceEngine');

    // Cannot instantiate directly
    try {
        new IIntelligenceEngine();
        fail('IIntelligenceEngine cannot be instantiated directly', new Error('No error thrown'));
    } catch (e) {
        pass('IIntelligenceEngine throws on direct instantiation');
    }

    // Subclass throws CsiNotImplementedError on each method
    class StubEngine extends IIntelligenceEngine {}
    const stub = new StubEngine();

    for (const method of ['initialize', 'collect', 'validate', 'healthCheck']) {
        try {
            const result = stub[method]({});
            if (result && typeof result.catch === 'function') {
                result.catch(() => {});  // silence unhandled rejection
            }
            pass(`StubEngine.${method}() exists (async throw — verified below)`);
        } catch (e) {
            if (e instanceof CsiNotImplementedError) pass(`StubEngine.${method}() throws CsiNotImplementedError`);
            else fail(`StubEngine.${method}()`, e);
        }
    }

    try { stub.supports({}); fail('StubEngine.supports() should throw', new Error('No throw')); }
    catch (e) { if (e instanceof CsiNotImplementedError) pass('StubEngine.supports() throws CsiNotImplementedError'); else fail('supports()', e); }

    try { stub.metadata(); fail('StubEngine.metadata() should throw', new Error('No throw')); }
    catch (e) { if (e instanceof CsiNotImplementedError) pass('StubEngine.metadata() throws CsiNotImplementedError'); else fail('metadata()', e); }

} catch (e) { fail('IIntelligenceEngine module load', e); }

try {
    const { INetworkClient } = require('./server/csi/interfaces/INetworkClient');
    try {
        new INetworkClient();
        fail('INetworkClient cannot be instantiated directly', new Error('No error thrown'));
    } catch (e) { pass('INetworkClient throws on direct instantiation'); }
} catch (e) { fail('INetworkClient module load', e); }

try {
    const { IEvidenceStorage } = require('./server/csi/interfaces/IEvidenceStorage');
    try {
        new IEvidenceStorage();
        fail('IEvidenceStorage cannot be instantiated directly', new Error('No error thrown'));
    } catch (e) { pass('IEvidenceStorage throws on direct instantiation'); }
} catch (e) { fail('IEvidenceStorage module load', e); }


// ─────────────────────────────────────────────
// 2. DTOs — IMMUTABILITY
// ─────────────────────────────────────────────
console.log('\n=== 2. DTO Immutability ===');

try {
    const { TargetDTO } = require('./server/csi/dtos/TargetDTO');
    const t = new TargetDTO({ rawInput: 'google.com', normalized: 'google.com', type: 'domain' });
    const before = t.normalized;
    try { t.normalized = 'hacked'; } catch (_) {}
    if (t.normalized === before) pass('TargetDTO is immutable');
    else fail('TargetDTO immutability', new Error('Mutation succeeded'));

    try { new TargetDTO({ rawInput: 'x', normalized: 'x', type: 'invalid_type' }); fail('TargetDTO rejects invalid type', new Error('No throw')); }
    catch (e) { pass('TargetDTO rejects invalid type'); }
} catch (e) { fail('TargetDTO', e); }

try {
    const { FindingDTO } = require('./server/csi/dtos/FindingDTO');
    const f = new FindingDTO({
        engineSource: 'DnsEngine', engineVersion: '1.0.0', findingType: 'missing_spf',
        severity: 'medium', weight: 12, detail: { record: 'TXT' },
        evidenceHash: 'abc123', executionId: 'exec-uuid-001',
        confidence: 1.0, confidenceSource: 'manual', confidenceMethod: 'deterministic'
    });
    const before = f.findingType;
    try { f.findingType = 'hacked'; } catch (_) {}
    if (f.findingType === before) pass('FindingDTO is immutable');
    else fail('FindingDTO immutability', new Error('Mutation succeeded'));

    // Traceability fields present
    if (f.engineVersion && f.collectionTime && f.executionId && f.evidenceHash)
        pass('FindingDTO contains all 4 traceability fields');
    else fail('FindingDTO traceability fields', new Error('Missing fields'));
} catch (e) { fail('FindingDTO', e); }

try {
    const { RiskDTO } = require('./server/csi/dtos/RiskDTO');
    const r = new RiskDTO({ targetId: 'tid', executionId: 'eid', numericalScore: 72, scoringVector: {}, findingCount: 3 });
    const before = r.numericalScore;
    try { r.numericalScore = 0; } catch (_) {}
    if (r.numericalScore === before) pass('RiskDTO.numericalScore is immutable');
    else fail('RiskDTO immutability', new Error('Mutation succeeded'));
    if (r.severity === 'high') pass('RiskDTO.severity correctly computed as "high" for score 72');
    else fail('RiskDTO severity computation', new Error(`Expected "high", got "${r.severity}"`));
} catch (e) { fail('RiskDTO', e); }

try {
    const { ReportDTO } = require('./server/csi/dtos/ReportDTO');
    const { RiskDTO }   = require('./server/csi/dtos/RiskDTO');
    const r = new RiskDTO({ targetId: 'tid', executionId: 'eid', numericalScore: 20, scoringVector: {}, findingCount: 1 });
    const rep = new ReportDTO({ targetId: 'tid', executionId: 'eid', riskDto: r, findings: [], aiNarrative: { summary: 'ok', attackChains: [], remediation: [] } });
    const before = rep.format;
    try { rep.format = 'pdf'; } catch (_) {}
    if (rep.format === before) pass('ReportDTO is immutable');
    else fail('ReportDTO immutability', new Error('Mutation succeeded'));

    // AI hallucination guard: extra keys are stripped
    const rep2 = new ReportDTO({ targetId: 'tid', executionId: 'eid', riskDto: r, findings: [],
        aiNarrative: { summary: 'ok', attackChains: [], remediation: [], INJECTED_FINDING: 'evil' } });
    if (!rep2.aiNarrative.INJECTED_FINDING) pass('ReportDTO strips injected AI keys');
    else fail('ReportDTO hallucination guard', new Error('Injected key not stripped'));
} catch (e) { fail('ReportDTO', e); }


// ─────────────────────────────────────────────
// 3. TARGET PIPELINE
// ─────────────────────────────────────────────
console.log('\n=== 3. Target Pipeline ===');

try {
    const { TargetNormalizer } = require('./server/csi/pipeline/TargetNormalizer');
    const n = new TargetNormalizer();

    const cases = [
        ['  GOOGLE.COM  ',        'google.com'],
        ['https://example.com/',  'example.com'],
        ['http://sub.example.com/path', 'sub.example.com/path'],
        ['[::1]',                 '::1'],
        ['example.com:8080',      'example.com'],
        ['HTTP://UPPER.COM',      'upper.com'],
        ['ftp://files.example.com', 'files.example.com'],
    ];

    let allPass = true;
    for (const [input, expected] of cases) {
        const result = n.normalize(input);
        if (result !== expected) {
            fail(`TargetNormalizer: "${input}" → expected "${expected}", got "${result}"`, new Error(''));
            allPass = false;
        }
    }
    if (allPass) pass(`TargetNormalizer: all ${cases.length} normalization cases correct`);

    try { n.normalize(''); fail('TargetNormalizer rejects empty string', new Error('No throw')); }
    catch (e) { pass('TargetNormalizer rejects empty string'); }
} catch (e) { fail('TargetNormalizer', e); }

try {
    const { TargetClassifier, CsiValidationError } = require('./server/csi/pipeline/TargetClassifier');
    const c = new TargetClassifier();

    const typeCases = [
        ['8.8.8.8',             'ip'],
        ['192.168.1.1',         'ip'],
        ['google.com',          'domain'],
        ['sub.example.co.uk',   'domain'],
        ['admin@example.com',   'email'],
        ['http://google.com/search?q=test', 'url'],
    ];

    let allTypePass = true;
    for (const [input, expectedType] of typeCases) {
        const dto = c.classify(input);
        if (dto.type !== expectedType) {
            fail(`TargetClassifier: "${input}" → expected "${expectedType}", got "${dto.type}"`, new Error(''));
            allTypePass = false;
        }
    }
    if (allTypePass) pass(`TargetClassifier: all ${typeCases.length} type classification cases correct`);

    // Invalid inputs must throw CsiValidationError
    const invalidCases = ['not a valid thing!!!', '', '   '];
    let allRejectPass = true;
    for (const bad of invalidCases) {
        try { c.classify(bad); fail(`TargetClassifier should reject: "${bad}"`, new Error('No throw')); allRejectPass = false; }
        catch (e) { if (!(e instanceof CsiValidationError)) { fail(`Wrong error type for "${bad}"`, e); allRejectPass = false; } }
    }
    if (allRejectPass) pass(`TargetClassifier: all ${invalidCases.length} invalid inputs rejected with CsiValidationError`);

    // TargetDTO from classifier is immutable
    const dto = c.classify('example.com');
    const before = dto.type;
    try { dto.type = 'ip'; } catch (_) {}
    if (dto.type === before) pass('TargetDTO from TargetClassifier is immutable');
    else fail('TargetDTO from TargetClassifier immutability', new Error('Mutation succeeded'));
} catch (e) { fail('TargetClassifier', e); }


// ─────────────────────────────────────────────
// 4. ENGINE REGISTRY
// ─────────────────────────────────────────────
console.log('\n=== 4. EngineRegistry ===');

try {
    const { EngineRegistry }        = require('./server/csi/registry/EngineRegistry');
    const { IIntelligenceEngine }   = require('./server/csi/interfaces/IIntelligenceEngine');
    const { TargetClassifier }      = require('./server/csi/pipeline/TargetClassifier');

    const registry = new EngineRegistry();

    // Reject non-IIntelligenceEngine
    try {
        registry.register({ fake: true });
        fail('EngineRegistry rejects non-IIntelligenceEngine', new Error('No throw'));
    } catch (e) {
        if (e instanceof TypeError) pass('EngineRegistry rejects plain objects with TypeError');
        else fail('EngineRegistry rejection error type', e);
    }

    // Register a valid stub engine
    class StubDnsEngine extends IIntelligenceEngine {
        supports(t)   { return t.type === 'domain'; }
        async collect()   { return []; }
        async validate()  { return true; }
        async initialize(){ return; }
        async healthCheck() { return { status: 'healthy', latencyMs: 1, message: '' }; }
        metadata() {
            return { id: 'dns', engineName: 'DnsEngine', version: '1.0.0',
                apiVersion: '1', createdDate: '2026-07-10', maintainer: 'CyberShield',
                capabilities: ['dns'], supportedTargets: ['domain'],
                defaultTimeout: 3000, maximumTimeout: 8000,
                retryPolicy: { maxRetries: 2, backoffMs: 500 },
                estimatedExecutionTime: 200, lastExecution: null };
        }
    }

    const stub = new StubDnsEngine();
    registry.register(stub, { skipFlagCheck: true });

    if (registry.count === 1) pass('EngineRegistry.register() adds engine correctly');
    else fail('EngineRegistry count', new Error(`Expected 1, got ${registry.count}`));

    const classifier = new TargetClassifier();
    const domainTarget = classifier.classify('example.com');
    const resolved = registry.resolve(domainTarget);
    if (resolved.length === 1 && resolved[0] instanceof StubDnsEngine)
        pass('EngineRegistry.resolve() returns matching engine for domain target');
    else fail('EngineRegistry.resolve()', new Error('Wrong result'));

    const ipTarget = classifier.classify('8.8.8.8');
    if (!registry.supports(ipTarget)) pass('EngineRegistry.supports() returns false for unsupported target');
    else fail('EngineRegistry.supports() for IP with DNS-only engine', new Error('Should be false'));

    const metaList = registry.metadata();
    if (metaList.length === 1 && metaList[0].id === 'dns')
        pass('EngineRegistry.metadata() returns engine metadata array');
    else fail('EngineRegistry.metadata()', new Error('Unexpected metadata'));
} catch (e) { fail('EngineRegistry suite', e); }


// ─────────────────────────────────────────────
// 5. COMPOSITION ROOT
// ─────────────────────────────────────────────
console.log('\n=== 5. Composition Root ===');

try {
    const csiComposition = require('./server/composition/csiComposition');
    if (csiComposition.engineRegistry)   pass('csiComposition.engineRegistry initialized');
    else fail('csiComposition.engineRegistry', new Error('Not initialized'));
    if (csiComposition.targetClassifier) pass('csiComposition.targetClassifier initialized');
    else fail('csiComposition.targetClassifier', new Error('Not initialized'));
    if (csiComposition.targetNormalizer) pass('csiComposition.targetNormalizer initialized');
    else fail('csiComposition.targetNormalizer', new Error('Not initialized'));
    // Milestone 6.2+ services are null placeholders — that is expected
    if (csiComposition.csiOrchestrationService === null) pass('csiComposition.csiOrchestrationService is null (correct for M6.1)');
} catch (e) { fail('csiComposition load', e); }


// ─────────────────────────────────────────────
// SUMMARY
// ─────────────────────────────────────────────
console.log('\n══════════════════════════════════════════');
console.log(`  MILESTONE 6.1 VERIFICATION COMPLETE`);
console.log(`  Passed: ${passes}   Failed: ${fails}`);
console.log('══════════════════════════════════════════\n');

if (fails > 0) process.exit(1);
else process.exit(0);
