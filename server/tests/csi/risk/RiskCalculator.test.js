'use strict';

const RiskCalculator = require('../../../../server/csi/risk/RiskCalculator');
const RiskRuleRegistry = require('../../../../server/csi/risk/RiskRuleRegistry');
const RiskWeights = require('../../../../server/csi/risk/RiskWeights');
const RiskCategory = require('../../../../server/csi/risk/RiskCategory');

describe('RiskCalculator', () => {
    beforeAll(() => {
        // Init everything
        RiskWeights.initialize();
        RiskRuleRegistry.initialize(RiskCategory.getAllowedCategories());
    });

    test('should return 0 score and empty traces for empty findings array', () => {
        const result = RiskCalculator.calculate([]);
        expect(result.rawScore).toBe(0);
        expect(result.normalizedScore).toBe(0);
        expect(result.categories).toEqual({});
        expect(result.trace).toEqual([]);
        expect(result.riskFactors).toEqual([]);
    });

    test('should calculate deterministic score correctly', () => {
        // DNS_MISSING_DMARC is weight 35
        // WHOIS_NEW_DOMAIN is weight 55
        const findings = [
            {
                findingId: 'f1',
                findingType: 'missing_dmarc',
                confidence: 1.0
            },
            {
                findingId: 'f2',
                findingType: 'newly_registered_domain',
                confidence: 1.0
            }
        ];

        const result = RiskCalculator.calculate(findings);
        
        expect(result.rawScore).toBe(90);
        expect(result.normalizedScore).toBe(90);
        expect(result.categories).toEqual({
            DNS: 35,
            WHOIS: 55
        });

        expect(result.trace.length).toBe(2);
        expect(result.trace[0].newScore).toBe(35);
        expect(result.trace[1].newScore).toBe(90);

        expect(result.riskFactors.length).toBe(2);
        expect(result.riskFactors[0].ruleId).toBe('DNS_MISSING_DMARC');
        expect(result.riskFactors[1].ruleId).toBe('WHOIS_NEW_DOMAIN');
    });

    test('should cap normalized score to maxScore', () => {
        // SSL_EXPIRED = 90
        // SSL_SAN_MISMATCH = 80
        const findings = [
            {
                findingId: 'f1',
                findingType: 'expired_ssl_certificate',
                confidence: 1.0
            },
            {
                findingId: 'f2',
                findingType: 'san_mismatch',
                confidence: 1.0
            }
        ];

        const result = RiskCalculator.calculate(findings);
        expect(result.rawScore).toBe(170);
        expect(result.normalizedScore).toBe(100); // Capped at 100
        expect(result.categories).toEqual({ TLS: 170 });
    });

    test('should ignore unknown findings deterministically', () => {
        const findings = [
            {
                findingId: 'f1',
                findingType: 'expired_ssl_certificate',
                confidence: 1.0
            },
            {
                findingId: 'f2',
                findingType: 'some_unknown_finding',
                confidence: 0.5
            }
        ];

        const result = RiskCalculator.calculate(findings);
        expect(result.rawScore).toBe(90);
        expect(result.normalizedScore).toBe(90);
        expect(result.trace.length).toBe(1);
        expect(result.riskFactors.length).toBe(1);
    });
});
