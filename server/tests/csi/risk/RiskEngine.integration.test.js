'use strict';

const RiskScoringEngine = require('../../../../server/csi/risk/RiskScoringEngine');
const { FindingDTO } = require('../../../../server/csi/dtos/FindingDTO');

describe('RiskEngine Integration', () => {
    test('should process FindingDTO input fully to RiskResultDTO', () => {
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
            engineSource: 'SslEngine',
            engineVersion: '1.0.0',
            findingType: 'weak_cipher',
            severity: 'high',
            weight: 70,
            confidence: 1.0,
            confidenceSource: 'tls',
            confidenceMethod: 'deterministic',
            detail: {},
            evidenceHash: 'hash2',
            executionId: 'exec1'
        });

        const result = RiskScoringEngine.execute([finding1, finding2], 'exec1');

        expect(result.overallScore).toBe(100); // 35 + 70 = 105 -> cap 100
        expect(result.overallSeverity).toBe('CRITICAL');
        expect(result.riskFactors.length).toBe(2);
        expect(result.calculationTrace.length).toBe(2);
        
        expect(result.riskFactors[0].findingId).toBe(finding1.findingId);
        expect(result.riskFactors[1].findingId).toBe(finding2.findingId);
    });
});
