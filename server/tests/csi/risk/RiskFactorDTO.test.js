'use strict';

const { RiskFactorDTO } = require('../../../../server/csi/dtos/RiskFactorDTO');

describe('RiskFactorDTO', () => {
    let validParams;

    beforeEach(() => {
        validParams = {
            findingId: 'find-123',
            ruleId: 'DNS_01',
            weight: 10,
            category: 'DNS',
            severity: 'LOW',
            reason: 'Missing DNS record',
            confidence: 1.0
        };
    });

    test('should construct successfully with valid params', () => {
        const dto = new RiskFactorDTO(validParams);
        expect(dto.findingId).toBe('find-123');
        expect(dto.weight).toBe(10);
    });

    test('should be deeply immutable', () => {
        const dto = new RiskFactorDTO(validParams);
        expect(Object.isFrozen(dto)).toBe(true);
        expect(() => { dto.weight = 20; }).toThrow();
    });

    test('should validate required fields', () => {
        delete validParams.findingId;
        expect(() => new RiskFactorDTO(validParams)).toThrow(TypeError);
    });
    
    test('should validate types', () => {
        validParams.weight = '10';
        expect(() => new RiskFactorDTO(validParams)).toThrow(TypeError);
    });
});
