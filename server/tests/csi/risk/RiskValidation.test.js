'use strict';

const RiskValidation = require('../../../../server/csi/risk/RiskValidation');

describe('RiskValidation', () => {
    describe('checkDuplicateFindings', () => {
        test('should throw TypeError if findings is not an array', () => {
            expect(() => RiskValidation.checkDuplicateFindings({})).toThrow(TypeError);
        });

        test('should throw if findingId is missing', () => {
            expect(() => RiskValidation.checkDuplicateFindings([{}])).toThrow();
        });

        test('should throw on duplicate findingId', () => {
            const findings = [
                { findingId: 'f1' },
                { findingId: 'f2' },
                { findingId: 'f1' }
            ];
            expect(() => RiskValidation.checkDuplicateFindings(findings)).toThrow(/Duplicate findingId detected/);
        });

        test('should pass if findingIds are unique', () => {
            const findings = [
                { findingId: 'f1' },
                { findingId: 'f2' }
            ];
            expect(() => RiskValidation.checkDuplicateFindings(findings)).not.toThrow();
        });
    });

    describe('normalizeScore', () => {
        test('should throw on invalid score', () => {
            expect(() => RiskValidation.normalizeScore('100')).toThrow(TypeError);
            expect(() => RiskValidation.normalizeScore(NaN)).toThrow(TypeError);
        });

        test('should bound score between 0 and 100', () => {
            expect(RiskValidation.normalizeScore(50)).toBe(50);
            expect(RiskValidation.normalizeScore(150)).toBe(100);
            expect(RiskValidation.normalizeScore(-20)).toBe(0);
            expect(RiskValidation.normalizeScore(100)).toBe(100);
            expect(RiskValidation.normalizeScore(0)).toBe(0);
        });
    });
});
