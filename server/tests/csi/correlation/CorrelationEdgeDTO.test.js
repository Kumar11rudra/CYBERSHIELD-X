'use strict';

const { CorrelationEdgeDTO, VALID_EDGE_TYPES } = require('../../../../server/csi/dtos/CorrelationEdgeDTO');

describe('CorrelationEdgeDTO', () => {
    test('should construct valid edge', () => {
        const edge = new CorrelationEdgeDTO({
            edgeId: 'e1',
            sourceNodeId: 'n1',
            targetNodeId: 'n2',
            edgeType: 'supports'
        });

        expect(edge.edgeId).toBe('e1');
        expect(edge.edgeType).toBe('supports');
    });

    test('should deeply freeze the object', () => {
        const edge = new CorrelationEdgeDTO({
            edgeId: 'e1',
            sourceNodeId: 'n1',
            targetNodeId: 'n2',
            edgeType: 'supports'
        });

        expect(() => { edge.edgeType = 'depends_on'; }).toThrow();
    });

    test('should reject invalid edge type', () => {
        expect(() => new CorrelationEdgeDTO({
            edgeId: 'e1',
            sourceNodeId: 'n1',
            targetNodeId: 'n2',
            edgeType: 'invalid_edge'
        })).toThrow(TypeError);
    });
});
