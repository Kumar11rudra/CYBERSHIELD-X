'use strict';

const RiskScoringEngine = require('../../../../server/csi/risk/RiskScoringEngine');

describe('RiskScoringEngine', () => {
    test('should execute deterministically from finding DTOs', () => {
        const findings = [
            {
                findingId: 'f1',
                findingType: 'missing_dmarc',
                confidence: 1.0
            }
        ];

        const result = RiskScoringEngine.execute(findings, 'exec1');

        expect(result.overallScore).toBe(35);
        expect(result.overallSeverity).toBe('LOW'); // Based on risk-weights.json (10-39)
        expect(result.version).toBe('1.0.0');
        expect(result.executionId).toBe('exec1');
        expect(result.categories.DNS).toBe(35);
        expect(result.calculationTrace.length).toBe(1);
    });

    test('should throw if findingDTOs is not an array', () => {
        expect(() => RiskScoringEngine.execute({}, 'exec1')).toThrow(TypeError);
    });

    test('should throw if executionId is missing', () => {
        expect(() => RiskScoringEngine.execute([], undefined)).toThrow(TypeError);
    });
});
