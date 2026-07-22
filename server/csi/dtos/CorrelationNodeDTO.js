'use strict';

const { deepFreeze } = require('./RiskFactorDTO'); // Using existing deeply freeze utility

const VALID_NODE_TYPES = Object.freeze(['finding', 'risk', 'category', 'evidence']);

class CorrelationNodeDTO {
    /**
     * @param {object} params
     * @param {string} params.nodeId - Unique UUID for this node
     * @param {string} params.nodeType - 'finding' | 'risk' | 'category' | 'evidence'
     * @param {string} params.referenceId - ID linking back to the original DTO (e.g. findingId, executionId)
     * @param {object} [params.metadata] - Optional deterministic metadata
     */
    constructor({ nodeId, nodeType, referenceId, metadata = {} }) {
        if (!nodeId || typeof nodeId !== 'string') {
            throw new TypeError('[CorrelationNodeDTO] nodeId is required');
        }
        if (!VALID_NODE_TYPES.includes(nodeType)) {
            throw new TypeError(`[CorrelationNodeDTO] nodeType must be one of: ${VALID_NODE_TYPES.join(', ')}`);
        }
        if (!referenceId || typeof referenceId !== 'string') {
            throw new TypeError('[CorrelationNodeDTO] referenceId is required');
        }

        this.nodeId = nodeId;
        this.nodeType = nodeType;
        this.referenceId = referenceId;
        this.metadata = { ...metadata };

        deepFreeze(this);
    }
}

module.exports = { CorrelationNodeDTO, VALID_NODE_TYPES };
