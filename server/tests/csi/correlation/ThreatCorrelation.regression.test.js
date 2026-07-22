'use strict';

const ThreatCorrelationEngine = require('../../../../server/csi/correlation/ThreatCorrelationEngine');
const { FindingDTO } = require('../../../../server/csi/dtos/FindingDTO');
const { RiskResultDTO } = require('../../../../server/csi/dtos/RiskResultDTO');

describe('ThreatCorrelation Regression', () => {
    test('should execute deterministically 100 consecutive times', () => {
        const findings = [
            new FindingDTO({
                engineSource: 'SslEngine',
                engineVersion: '1.0.0',
                findingType: 'expired_ssl_certificate',
                severity: 'high',
                weight: 90,
                confidence: 1.0,
                confidenceSource: 'tls',
                confidenceMethod: 'deterministic',
                detail: {},
                evidenceHash: 'hash1',
                executionId: 'exec-reg'
            }),
            new FindingDTO({
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
                executionId: 'exec-reg'
            })
        ];

        const riskResult = new RiskResultDTO({
            overallScore: 100,
            overallSeverity: 'CRITICAL',
            categories: { TLS: 160 },
            riskFactors: [],
            calculationTrace: [],
            version: '1.0.0',
            executionId: 'exec-reg',
            timestamp: new Date().toISOString()
        });

        let baseline = null;

        for (let i = 0; i < 100; i++) {
            const result = ThreatCorrelationEngine.execute(findings, riskResult, [], 'exec-reg');
            
            // Serialize and strip timestamp (which changes)
            const serialized = JSON.stringify(result);
            const parsed = JSON.parse(serialized);
            delete parsed.timestamp;

            if (i === 0) {
                baseline = parsed;
                expect(baseline.overallCorrelationScore).toBe(20);
                expect(baseline.categories.TLS_CHAIN).toBe(20);
            } else {
                expect(parsed).toEqual(baseline);
            }
        }
    });
});
