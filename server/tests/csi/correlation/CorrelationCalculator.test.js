'use strict';

const fs = require('fs');
const CorrelationCalculator = require('../../../../server/csi/correlation/CorrelationCalculator');
const CorrelationRuleRegistry = require('../../../../server/csi/correlation/CorrelationRuleRegistry');
const CorrelationGraph = require('../../../../server/csi/correlation/CorrelationGraph');
const CorrelationExplanationBuilder = require('../../../../server/csi/correlation/CorrelationExplanationBuilder');

jest.mock('fs');

describe('CorrelationCalculator', () => {
    beforeAll(() => {
        const validConfig = {
            categories: ['TLS_CHAIN'],
            rules: [
                {
                    ruleId: 'R1',
                    requiredFindings: ['expired_ssl', 'weak_cipher'],
                    weight: 20,
                    category: 'TLS_CHAIN',
                    edgeType: 'strengthens',
                    reasonCode: 'C1'
                }
            ]
        };
        fs.readFileSync.mockReturnValue(JSON.stringify(validConfig));
        CorrelationRuleRegistry.initialize();
    });

    test('should calculate correlation score based on matching finding types', () => {
        const graph = new CorrelationGraph();
        const n1 = graph.addNode('finding', 'f1', { findingType: 'expired_ssl' });
        const n2 = graph.addNode('finding', 'f2', { findingType: 'weak_cipher' });
        
        const builder = new CorrelationExplanationBuilder();
        
        const result = CorrelationCalculator.calculate(
            graph, 
            builder, 
            ['expired_ssl', 'weak_cipher'], 
            [n1, n2]
        );

        expect(result.overallScore).toBe(20);
        expect(result.categories.TLS_CHAIN).toBe(20);
        expect(result.chains.length).toBe(1);
        expect(result.chains[0].ruleId).toBe('R1');
        
        const trace = builder.build();
        expect(trace.length).toBe(1);
        expect(trace[0].ruleId).toBe('R1');
        expect(trace[0].findingIds).toEqual(['f1', 'f2'].sort());
        
        // Graph should have added a category node and edges
        const nodes = graph.getNodes();
        const hasCatNode = nodes.some(n => n.nodeType === 'category' && n.referenceId === 'TLS_CHAIN');
        expect(hasCatNode).toBe(true);
    });

    test('should ignore rules if not all findings match', () => {
        const graph = new CorrelationGraph();
        const n1 = graph.addNode('finding', 'f1', { findingType: 'expired_ssl' });
        
        const builder = new CorrelationExplanationBuilder();
        
        const result = CorrelationCalculator.calculate(
            graph, 
            builder, 
            ['expired_ssl'], 
            [n1]
        );

        expect(result.overallScore).toBe(0);
        expect(result.chains.length).toBe(0);
    });
});
