'use strict';

const ReasoningValidation = require('../../../../server/csi/ai/ReasoningValidation');

describe('ReasoningValidation', () => {
    const originalFindings = [
        { findingId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', evidenceHash: '12345678-1234-1234-1234-1234567890ab' }
    ];

    const validResponse = {
        executiveSummary: 'Summary',
        observations: ['Obs 1'],
        attackChains: ['Chain 1'],
        remediation: ['Fix 1'],
        confidenceExplanation: 'High'
    };

    test('should pass valid response', () => {
        expect(() => ReasoningValidation.validate(validResponse, originalFindings)).not.toThrow();
    });

    test('should throw on missing required fields', () => {
        const invalidResponse = { ...validResponse };
        delete invalidResponse.executiveSummary;
        expect(() => ReasoningValidation.validate(invalidResponse, originalFindings)).toThrow(/Missing required field: executiveSummary/);
    });

    test('should reject hallucinated finding IDs (UUID format)', () => {
        const hallucinatedResponse = {
            ...validResponse,
            observations: ['Observation about hallucinated finding ffffffff-ffff-ffff-ffff-ffffffffffff']
        };
        expect(() => ReasoningValidation.validate(hallucinatedResponse, originalFindings)).toThrow(/Hallucinated ID detected/);
    });

    test('should accept valid finding IDs (UUID format)', () => {
        const validIdResponse = {
            ...validResponse,
            observations: ['Observation about valid finding a1b2c3d4-e5f6-7890-abcd-ef1234567890']
        };
        expect(() => ReasoningValidation.validate(validIdResponse, originalFindings)).not.toThrow();
    });

    test('should reject HTML injection', () => {
        const htmlResponse = {
            ...validResponse,
            executiveSummary: 'Summary <script>alert(1)</script>'
        };
        expect(() => ReasoningValidation.validate(htmlResponse, originalFindings)).toThrow(/HTML injection detected/);
    });

    test('should reject executable code blocks', () => {
        const codeResponse = {
            ...validResponse,
            remediation: ['Fix it by running ```bash rm -rf / ```']
        };
        expect(() => ReasoningValidation.validate(codeResponse, originalFindings)).toThrow(/Executable code block detected/);
    });

    test('should enforce length limits', () => {
        const longResponse = {
            ...validResponse,
            executiveSummary: 'A'.repeat(25000)
        };
        expect(() => ReasoningValidation.validate(longResponse, originalFindings)).toThrow(/Response exceeds length limit/);
    });
});
