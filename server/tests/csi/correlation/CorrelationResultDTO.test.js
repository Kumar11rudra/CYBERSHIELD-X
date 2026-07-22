'use strict';

const { CorrelationResultDTO } = require('../../../../server/csi/dtos/CorrelationResultDTO');

describe('CorrelationResultDTO', () => {
    test('should construct valid result', () => {
        const result = new CorrelationResultDTO({
            overallCorrelationScore: 50,
            chains: [{ ruleId: 'R1', score: 50 }],
            categories: { TLS_CHAIN: 50 },
            nodes: [],
            edges: [],
            trace: [{ step: 1 }],
            executionId: 'exec1',
            version: '1.0.0',
            timestamp: '2026-07-12T00:00:00.000Z'
        });

        expect(result.overallCorrelationScore).toBe(50);
        expect(result.chains.length).toBe(1);
    });

    test('should deeply freeze the object', () => {
        const result = new CorrelationResultDTO({
            overallCorrelationScore: 50,
            chains: [{ ruleId: 'R1', score: 50 }],
            categories: { TLS_CHAIN: 50 },
            nodes: [],
            edges: [],
            trace: [{ step: 1 }],
            executionId: 'exec1',
            version: '1.0.0',
            timestamp: '2026-07-12T00:00:00.000Z'
        });

        expect(() => { result.chains.push({}); }).toThrow();
        expect(() => { result.chains[0].score = 100; }).toThrow();
        expect(() => { result.categories.TLS_CHAIN = 100; }).toThrow();
        expect(() => { result.overallCorrelationScore = 100; }).toThrow();
    });

    test('should validate required types', () => {
        expect(() => new CorrelationResultDTO({
            overallCorrelationScore: '50', // string instead of number
            chains: [],
            categories: {},
            nodes: [],
            edges: [],
            trace: [],
            executionId: 'exec1',
            version: '1.0.0',
            timestamp: '2026-07-12T00:00:00.000Z'
        })).toThrow(TypeError);
    });
});
