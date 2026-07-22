'use strict';

const CorrelationValidation = require('../../../../server/csi/correlation/CorrelationValidation');
const CorrelationGraph = require('../../../../server/csi/correlation/CorrelationGraph');

describe('CorrelationValidation', () => {
    describe('validateInputs', () => {
        test('should throw on invalid findings array', () => {
            expect(() => CorrelationValidation.validateInputs({}, {}, [])).toThrow(TypeError);
        });

        test('should throw on duplicate findingId', () => {
            const findings = [{ findingId: 'f1' }, { findingId: 'f1' }];
            expect(() => CorrelationValidation.validateInputs(findings, {}, [])).toThrow(/Duplicate findingId/);
        });

        test('should throw on duplicate evidenceId', () => {
            const evidences = [{ evidenceId: 'e1' }, { evidenceId: 'e1' }];
            expect(() => CorrelationValidation.validateInputs([], {}, evidences)).toThrow(/Duplicate evidenceId/);
        });
    });

    describe('checkGraphCycles', () => {
        test('should detect forbidden cycles', () => {
            const graph = new CorrelationGraph();
            const n1 = graph.addNode('finding', 'n1');
            const n2 = graph.addNode('finding', 'n2');
            
            graph.addEdge(n1.nodeId, n2.nodeId, 'supports');
            graph.addEdge(n2.nodeId, n1.nodeId, 'supports');

            expect(() => CorrelationValidation.checkGraphCycles(graph)).toThrow(/Forbidden cycle detected/);
        });

        test('should pass valid directed acyclic graph', () => {
            const graph = new CorrelationGraph();
            const n1 = graph.addNode('finding', 'n1');
            const n2 = graph.addNode('finding', 'n2');
            const n3 = graph.addNode('finding', 'n3');
            
            graph.addEdge(n1.nodeId, n2.nodeId, 'supports');
            graph.addEdge(n2.nodeId, n3.nodeId, 'supports');

            expect(() => CorrelationValidation.checkGraphCycles(graph)).not.toThrow();
        });
    });

    describe('validateScore', () => {
        test('should throw on negative score', () => {
            expect(() => CorrelationValidation.validateScore(-10)).toThrow(/Negative correlation score/);
        });

        test('should throw on score overflow', () => {
            expect(() => CorrelationValidation.validateScore(2000)).toThrow(/Score overflow/);
        });

        test('should throw on invalid type', () => {
            expect(() => CorrelationValidation.validateScore('10')).toThrow(TypeError);
        });

        test('should pass valid score', () => {
            expect(() => CorrelationValidation.validateScore(100)).not.toThrow();
        });
    });
});
