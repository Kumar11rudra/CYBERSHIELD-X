'use strict';

const { deepFreeze } = require('./RiskFactorDTO'); // Using existing deeply freeze utility

const VALID_EDGE_TYPES = Object.freeze(['supports', 'strengthens', 'depends_on', 'related_to']);

class CorrelationEdgeDTO {
    /**
     * @param {object} params
     * @param {string} params.edgeId - Unique UUID for this edge
     * @param {string} params.sourceNodeId - Source node UUID
     * @param {string} params.targetNodeId - Target node UUID
     * @param {string} params.edgeType - 'supports' | 'strengthens' | 'depends_on' | 'related_to'
     */
    constructor({ edgeId, sourceNodeId, targetNodeId, edgeType }) {
        if (!edgeId || typeof edgeId !== 'string') {
            throw new TypeError('[CorrelationEdgeDTO] edgeId is required');
        }
        if (!sourceNodeId || typeof sourceNodeId !== 'string') {
            throw new TypeError('[CorrelationEdgeDTO] sourceNodeId is required');
        }
        if (!targetNodeId || typeof targetNodeId !== 'string') {
            throw new TypeError('[CorrelationEdgeDTO] targetNodeId is required');
        }
        if (!VALID_EDGE_TYPES.includes(edgeType)) {
            throw new TypeError(`[CorrelationEdgeDTO] edgeType must be one of: ${VALID_EDGE_TYPES.join(', ')}`);
        }

        this.edgeId = edgeId;
        this.sourceNodeId = sourceNodeId;
        this.targetNodeId = targetNodeId;
        this.edgeType = edgeType;

        deepFreeze(this);
    }
}

module.exports = { CorrelationEdgeDTO, VALID_EDGE_TYPES };
