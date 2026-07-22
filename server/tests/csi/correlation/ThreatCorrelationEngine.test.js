'use strict';

const ThreatCorrelationEngine = require('../../../../server/csi/correlation/ThreatCorrelationEngine');
const CorrelationRuleRegistry = require('../../../../server/csi/correlation/CorrelationRuleRegistry');

describe('ThreatCorrelationEngine', () => {
    test('should orchestrate pure function execution', () => {
        const findings = [
            { findingId: 'f1', findingType: 'expired_ssl_certificate' },
            { findingId: 'f2', findingType: 'weak_cipher' }
        ];
        
        const riskResult = { overallScore: 50 };
        const evidences = [{ evidenceId: 'e1', findingId: 'f1' }];
        const executionId = 'exec-id-1';
        
        // This implicitly calls initialize, which uses the real config. 
        // Our config has "CORR_TLS_WEAK_EXPIRED" that matches these two findings for +20.
        const result = ThreatCorrelationEngine.execute(findings, riskResult, evidences, executionId);
        
        expect(result.overallCorrelationScore).toBe(20);
        expect(result.categories['TLS_CHAIN']).toBe(20);
        expect(result.chains.length).toBe(1);
        expect(result.chains[0].ruleId).toBe('CORR_TLS_WEAK_EXPIRED');
        expect(result.executionId).toBe(executionId);
        
        // Nodes: 2 finding, 1 risk, 1 evidence, 1 category = 5 nodes
        expect(result.nodes.length).toBe(5);
        expect(result.trace.length).toBe(1);
    });

    test('should throw if missing executionId', () => {
        expect(() => ThreatCorrelationEngine.execute([], {}, [], null)).toThrow(TypeError);
    });
});
