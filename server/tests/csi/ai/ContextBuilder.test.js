'use strict';

const ContextBuilder = require('../../../../server/csi/ai/ContextBuilder');

describe('ContextBuilder', () => {
    test('should build deterministic context string', () => {
        const findings = [
            { findingId: 'B-id', findingType: 'type2', severity: 'high', evidenceHash: 'hash2', extra: 'strip_me' },
            { findingId: 'A-id', findingType: 'type1', severity: 'low', evidenceHash: 'hash1', extra: 'strip_me' }
        ];
        
        const riskResult = {
            overallScore: 50,
            overallSeverity: 'MEDIUM',
            categories: {},
            executionId: 'strip_me',
            timestamp: 'strip_me'
        };

        const correlationResult = {
            overallCorrelationScore: 20,
            categories: {},
            chains: [],
            trace: ['strip_me']
        };

        const contextStr = ContextBuilder.build(findings, riskResult, correlationResult);
        const parsed = JSON.parse(contextStr);

        // Deterministic sort by ID
        expect(parsed.findings[0].findingId).toBe('A-id');
        expect(parsed.findings[1].findingId).toBe('B-id');

        // Stripped fields
        expect(parsed.findings[0].extra).toBeUndefined();
        expect(parsed.risk.executionId).toBeUndefined();
        expect(parsed.correlation.trace).toBeUndefined();
    });

    test('should enforce token budget (length check)', () => {
        const bigFindings = Array(1000).fill({ findingId: 'A', findingType: 'B', severity: 'C', evidenceHash: 'D' });
        
        expect(() => ContextBuilder.build(bigFindings, {}, {})).toThrow(/Context exceeds maximum allowed size/);
    });
});
