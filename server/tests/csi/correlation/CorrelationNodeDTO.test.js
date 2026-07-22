'use strict';

const { CorrelationNodeDTO, VALID_NODE_TYPES } = require('../../../../server/csi/dtos/CorrelationNodeDTO');

describe('CorrelationNodeDTO', () => {
    test('should construct valid node', () => {
        const node = new CorrelationNodeDTO({
            nodeId: 'n1',
            nodeType: 'finding',
            referenceId: 'ref1',
            metadata: { type: 'dns' }
        });

        expect(node.nodeId).toBe('n1');
        expect(node.nodeType).toBe('finding');
        expect(node.referenceId).toBe('ref1');
        expect(node.metadata.type).toBe('dns');
    });

    test('should deeply freeze the object', () => {
        const node = new CorrelationNodeDTO({
            nodeId: 'n1',
            nodeType: 'finding',
            referenceId: 'ref1',
            metadata: { nested: { a: 1 } }
        });

        expect(() => { node.nodeType = 'risk'; }).toThrow();
        expect(() => { node.metadata.nested.a = 2; }).toThrow();
    });

    test('should reject invalid node type', () => {
        expect(() => new CorrelationNodeDTO({
            nodeId: 'n1',
            nodeType: 'invalid_type',
            referenceId: 'ref1'
        })).toThrow(TypeError);
    });
});
