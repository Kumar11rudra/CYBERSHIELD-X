'use strict';

const ThreatCorrelationEngine = require('../../../../server/csi/correlation/ThreatCorrelationEngine');
const { FindingDTO } = require('../../../../server/csi/dtos/FindingDTO');
const { RiskResultDTO } = require('../../../../server/csi/dtos/RiskResultDTO');

describe('ThreatCorrelation Integration', () => {
    test('should process deep DTOs to CorrelationResultDTO successfully', () => {
        const finding1 = new FindingDTO({
            engineSource: 'DnsEngine',
            engineVersion: '1.0.0',
            findingType: 'missing_dmarc',
            severity: 'medium',
            weight: 35,
            confidence: 1.0,
            confidenceSource: 'dns',
            confidenceMethod: 'deterministic',
            detail: {},
            evidenceHash: 'hash1',
            executionId: 'exec1'
        });

        const finding2 = new FindingDTO({
            engineSource: 'DnsEngine',
            engineVersion: '1.0.0',
            findingType: 'missing_spf',
            severity: 'medium',
            weight: 30,
            confidence: 1.0,
            confidenceSource: 'dns',
            confidenceMethod: 'deterministic',
            detail: {},
            evidenceHash: 'hash2',
            executionId: 'exec1'
        });

        const riskResult = new RiskResultDTO({
            overallScore: 65,
            overallSeverity: 'MEDIUM',
            categories: { DNS: 65 },
            riskFactors: [],
            calculationTrace: [],
            version: '1.0.0',
            executionId: 'exec1',
            timestamp: new Date().toISOString()
        });

        // This matches rule 'CORR_EMAIL_NO_PROTECTION' in our config which gives +15
        const result = ThreatCorrelationEngine.execute([finding1, finding2], riskResult, [], 'exec1');

        expect(result.overallCorrelationScore).toBe(15);
        expect(result.categories.EMAIL_SECURITY_CHAIN).toBe(15);
        expect(result.trace.length).toBe(1);
        expect(result.trace[0].ruleId).toBe('CORR_EMAIL_NO_PROTECTION');

        // Verify graph
        const catNode = result.nodes.find(n => n.nodeType === 'category');
        expect(catNode.referenceId).toBe('EMAIL_SECURITY_CHAIN');
        
        const riskNode = result.nodes.find(n => n.nodeType === 'risk');
        expect(riskNode.referenceId).toBe('exec1');

        // All edges should be deeply frozen
        expect(Object.isFrozen(result.edges)).toBe(true);
        expect(Object.isFrozen(result.edges[0])).toBe(true);
    });
});
