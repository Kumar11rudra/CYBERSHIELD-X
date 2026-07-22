'use strict';

const { ReasoningResultDTO } = require('../../../../server/csi/dtos/ReasoningResultDTO');

describe('ReasoningResultDTO', () => {
    const validParams = {
        executiveSummary: 'Summary',
        observations: ['Obs1'],
        attackChains: ['Chain1'],
        remediation: ['Fix1'],
        confidenceExplanation: 'High',
        reasoningVersion: '1.0',
        executionId: 'exec1'
    };

    test('should construct valid DTO', () => {
        const dto = new ReasoningResultDTO(validParams);
        expect(dto.executiveSummary).toBe('Summary');
        expect(dto.executionId).toBe('exec1');
        expect(dto.timestamp).toBeDefined();
    });

    test('should deeply freeze the object', () => {
        const dto = new ReasoningResultDTO(validParams);
        
        expect(() => { dto.executiveSummary = 'New'; }).toThrow();
        expect(() => { dto.observations.push('Obs2'); }).toThrow();
        expect(() => { dto.attackChains[0] = 'Chain2'; }).toThrow();
    });

    test('should throw on missing fields', () => {
        const invalidParams = { ...validParams };
        delete invalidParams.remediation;
        
        expect(() => new ReasoningResultDTO(invalidParams)).toThrow(/Missing required field: remediation/);
    });

    test('should validate array types', () => {
        const invalidParams = { ...validParams, observations: 'Not an array' };
        
        expect(() => new ReasoningResultDTO(invalidParams)).toThrow(/observations must be an array/);
    });
});
