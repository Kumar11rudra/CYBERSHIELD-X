'use strict';

const { ExecutionValidation } = require('../../../../server/csi/orchestration/ExecutionValidation');
const { ExecutionValidationError } = require('../../../../server/csi/errors/CsiErrors');

describe('ExecutionValidation', () => {
    it('should reject missing execution metadata', () => {
        expect(() => ExecutionValidation.validate({})).toThrow(ExecutionValidationError);
        expect(() => ExecutionValidation.validate({ executionId: '1' })).toThrow(ExecutionValidationError);
    });

    it('should reject duplicate findings', () => {
        const dto = Object.freeze({
            executionId: '1', startedAt: 's', finishedAt: 'e', durationMs: 10,
            findings: Object.freeze([
                Object.freeze({ findingId: 'f1' }),
                Object.freeze({ findingId: 'f1' }) // duplicate
            ]),
            evidence: Object.freeze([])
        });
        expect(() => ExecutionValidation.validate(dto)).toThrow(/Duplicate finding ID/);
    });

    it('should reject unfrozen DTOs', () => {
        const dto = Object.freeze({
            executionId: '1', startedAt: 's', finishedAt: 'e', durationMs: 10,
            findings: Object.freeze([]),
            evidence: Object.freeze([]),
            report: {}, // unfrozen
            exports: Object.freeze({}),
            risk: Object.freeze({}),
            correlation: Object.freeze({}),
            reasoning: Object.freeze({})
        });
        expect(() => ExecutionValidation.validate(dto)).toThrow(/Report must be frozen/);
    });

    it('should pass valid frozen result', () => {
        const dto = Object.freeze({
            executionId: '1', startedAt: 's', finishedAt: 'e', durationMs: 10,
            findings: Object.freeze([]),
            evidence: Object.freeze([]),
            report: Object.freeze({}),
            exports: Object.freeze({}),
            risk: Object.freeze({}),
            correlation: Object.freeze({}),
            reasoning: Object.freeze({})
        });
        expect(ExecutionValidation.validate(dto)).toBe(true);
    });
});
