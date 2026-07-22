'use strict';

const RiskExplanationBuilder = require('../../../../server/csi/risk/RiskExplanationBuilder');

describe('RiskExplanationBuilder', () => {
    test('should build structured trace correctly', () => {
        const builder = new RiskExplanationBuilder();
        
        builder.addTraceStep({
            findingId: 'f1',
            ruleId: 'r1',
            previousScore: 0,
            weight: 10,
            newScore: 10,
            category: 'DNS',
            severity: 'LOW'
        });

        builder.addTraceStep({
            findingId: 'f2',
            ruleId: 'r2',
            previousScore: 10,
            weight: 50,
            newScore: 60,
            category: 'TLS',
            severity: 'HIGH'
        });

        const trace = builder.build();
        
        expect(trace.length).toBe(2);
        expect(trace[0].step).toBe(1);
        expect(trace[0].findingId).toBe('f1');
        
        expect(trace[1].step).toBe(2);
        expect(trace[1].findingId).toBe('f2');
        expect(trace[1].newScore).toBe(60);
    });
});
