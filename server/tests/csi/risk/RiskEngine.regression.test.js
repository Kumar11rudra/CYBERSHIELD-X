'use strict';

const RiskScoringEngine = require('../../../../server/csi/risk/RiskScoringEngine');

describe('RiskEngine Regression', () => {
    test('should produce byte-for-byte identical output for 100 consecutive runs', () => {
        const fixtureFindings = [
            {
                findingId: 'f1',
                findingType: 'missing_dmarc',
                confidence: 1.0
            },
            {
                findingId: 'f2',
                findingType: 'expired_ssl_certificate',
                confidence: 1.0
            },
            {
                findingId: 'f3',
                findingType: 'whois_data_unavailable',
                confidence: 1.0
            }
        ];

        let referenceOutput = null;

        for (let i = 0; i < 100; i++) {
            const result = RiskScoringEngine.execute(fixtureFindings, 'regression-exec-1');
            
            // Serialize and remove timestamp for deterministic comparison
            const serialized = JSON.stringify(result);
            const parsed = JSON.parse(serialized);
            delete parsed.timestamp;

            if (i === 0) {
                referenceOutput = parsed;
                // Baseline sanity checks
                expect(referenceOutput.overallScore).toBe(100); // 35 + 90 + 5 = 130 -> capped to 100
                expect(referenceOutput.overallSeverity).toBe('CRITICAL');
                expect(referenceOutput.categories.DNS).toBe(35);
                expect(referenceOutput.categories.TLS).toBe(90);
                expect(referenceOutput.categories.WHOIS).toBe(5);
            } else {
                expect(parsed).toEqual(referenceOutput);
            }
        }
    });
});
