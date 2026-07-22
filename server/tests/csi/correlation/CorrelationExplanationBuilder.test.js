'use strict';

const CorrelationExplanationBuilder = require('../../../../server/csi/correlation/CorrelationExplanationBuilder');

describe('CorrelationExplanationBuilder', () => {
    test('should build structured trace', () => {
        const builder = new CorrelationExplanationBuilder();
        
        builder.addTraceStep({
            ruleId: 'R1',
            findingIds: ['f1', 'f2'],
            previousScore: 0,
            weight: 20,
            newScore: 20,
            category: 'TLS',
            reasonCode: 'CODE1'
        });

        const trace = builder.build();
        
        expect(trace.length).toBe(1);
        expect(trace[0].step).toBe(1);
        expect(trace[0].ruleId).toBe('R1');
        expect(trace[0].findingIds).toEqual(['f1', 'f2']);
        
        // Deeply frozen trace
        expect(() => { trace[0].step = 2; }).toThrow();
        expect(() => { trace[0].findingIds.push('f3'); }).toThrow();
    });
});
