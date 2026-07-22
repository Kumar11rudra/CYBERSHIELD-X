'use strict';

const CorrelationGraph = require('../../../../server/csi/correlation/CorrelationGraph');

describe('CorrelationGraph', () => {
    let graph;

    beforeEach(() => {
        graph = new CorrelationGraph();
    });

    test('should add nodes deterministically', () => {
        const n1 = graph.addNode('finding', 'find1');
        const n2 = graph.addNode('finding', 'find1'); // Duplicate addition

        expect(n1.nodeId).toBe(n2.nodeId);
        expect(graph.getNodes().length).toBe(1);
    });

    test('should sort nodes deterministically', () => {
        graph.addNode('finding', 'B');
        graph.addNode('finding', 'A');
        graph.addNode('risk', 'R');

        const nodes = graph.getNodes();
        expect(nodes.length).toBe(3);
        
        // Ensure they are sorted by nodeId
        for (let i = 0; i < nodes.length - 1; i++) {
            expect(nodes[i].nodeId.localeCompare(nodes[i + 1].nodeId)).toBeLessThanOrEqual(0);
        }
    });

    test('should add edges deterministically', () => {
        const n1 = graph.addNode('finding', 'find1');
        const n2 = graph.addNode('finding', 'find2');

        const e1 = graph.addEdge(n1.nodeId, n2.nodeId, 'supports');
        const e2 = graph.addEdge(n1.nodeId, n2.nodeId, 'supports'); // Duplicate addition

        expect(e1.edgeId).toBe(e2.edgeId);
        expect(graph.getEdges().length).toBe(1);
    });

    test('should reject edge with unknown source', () => {
        const n1 = graph.addNode('finding', 'find1');
        expect(() => graph.addEdge('unknown_id', n1.nodeId, 'supports')).toThrow(/Unknown source node/);
    });
});
