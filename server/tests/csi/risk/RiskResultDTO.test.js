'use strict';

const { RiskResultDTO } = require('../../../../server/csi/dtos/RiskResultDTO');
const { RiskFactorDTO } = require('../../../../server/csi/dtos/RiskFactorDTO');

describe('RiskResultDTO', () => {
    let validParams;

    beforeEach(() => {
        const factor = new RiskFactorDTO({
            findingId: 'f1',
            ruleId: 'r1',
            weight: 10,
            category: 'DNS',
            severity: 'LOW',
            reason: 'test',
            confidence: 0.9
        });

        validParams = {
            overallScore: 50,
            overallSeverity: 'MEDIUM',
            categories: { DNS: 10 },
            riskFactors: [factor],
            calculationTrace: [{ step: 1 }],
            version: '1.0.0',
            executionId: 'exec1',
            timestamp: new Date().toISOString()
        };
    });

    test('should construct successfully with valid params', () => {
        const dto = new RiskResultDTO(validParams);
        expect(dto.overallScore).toBe(50);
        expect(dto.overallSeverity).toBe('MEDIUM');
        expect(dto.version).toBe('1.0.0');
        expect(dto.executionId).toBe('exec1');
        expect(dto.timestamp).toBe(validParams.timestamp);
    });

    test('should be deeply immutable', () => {
        const dto = new RiskResultDTO(validParams);
        
        expect(Object.isFrozen(dto)).toBe(true);
        expect(Object.isFrozen(dto.categories)).toBe(true);
        expect(Object.isFrozen(dto.riskFactors)).toBe(true);
        expect(Object.isFrozen(dto.calculationTrace)).toBe(true);
        
        expect(() => { dto.overallScore = 100; }).toThrow();
        expect(() => { dto.categories.DNS = 20; }).toThrow();
        expect(() => { dto.riskFactors.push({}); }).toThrow();
        expect(() => { dto.calculationTrace[0].step = 2; }).toThrow();
    });

    test('should fail without overallSeverity', () => {
        delete validParams.overallSeverity;
        expect(() => new RiskResultDTO(validParams)).toThrow(TypeError);
    });
});
