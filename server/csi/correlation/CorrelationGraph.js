'use strict';

const crypto = require('crypto');
const { CorrelationNodeDTO } = require('../dtos/CorrelationNodeDTO');
const { CorrelationEdgeDTO } = require('../dtos/CorrelationEdgeDTO');

class CorrelationGraph {
    constructor() {
        this.nodes = new Map(); // nodeId -> CorrelationNodeDTO
        this.edges = new Map(); // edgeId -> CorrelationEdgeDTO
        this.adjacencyList = new Map(); // sourceNodeId -> Set<targetNodeId>
    }

    /**
     * Deterministically generates a consistent UUID v5 based on the referenceId and nodeType.
     * We use a fixed namespace so the same input always yields the same UUID.
     */
    _generateDeterministicId(seed) {
        const NAMESPACE = '1b671a64-40d5-491e-99b0-da01ff1f3341';
        // Note: Using a simple SHA-1 hash to mimic v5 behavior for deterministic generation without external deps.
        const hash = crypto.createHash('sha1').update(NAMESPACE + seed).digest('hex');
        return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-5${hash.slice(13, 16)}-8${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
    }

    addNode(nodeType, referenceId, metadata = {}) {
        // Enforce deterministic ID generation
        const nodeId = this._generateDeterministicId(`${nodeType}:${referenceId}`);
        
        if (this.nodes.has(nodeId)) {
            // Already added, this is safe and idempotent
            return this.nodes.get(nodeId);
        }

        const node = new CorrelationNodeDTO({ nodeId, nodeType, referenceId, metadata });
        this.nodes.set(nodeId, node);
        this.adjacencyList.set(nodeId, new Set());
        
        return node;
    }

    addEdge(sourceNodeId, targetNodeId, edgeType) {
        if (!this.nodes.has(sourceNodeId)) {
            throw new Error(`[CorrelationGraph] Unknown source node: ${sourceNodeId}`);
        }
        if (!this.nodes.has(targetNodeId)) {
            throw new Error(`[CorrelationGraph] Unknown target node: ${targetNodeId}`);
        }

        const edgeId = this._generateDeterministicId(`${sourceNodeId}:${targetNodeId}:${edgeType}`);
        
        if (this.edges.has(edgeId)) {
            return this.edges.get(edgeId); // Idempotent
        }

        const edge = new CorrelationEdgeDTO({ edgeId, sourceNodeId, targetNodeId, edgeType });
        this.edges.set(edgeId, edge);
        this.adjacencyList.get(sourceNodeId).add(targetNodeId);

        return edge;
    }

    getNodes() {
        // Return sorted lexicographically for deterministic serialization
        return Array.from(this.nodes.values()).sort((a, b) => a.nodeId.localeCompare(b.nodeId));
    }

    getEdges() {
        // Return sorted lexicographically for deterministic serialization
        return Array.from(this.edges.values()).sort((a, b) => a.edgeId.localeCompare(b.edgeId));
    }

    getNodeByReference(referenceId) {
        for (const node of this.nodes.values()) {
            if (node.referenceId === referenceId) {
                return node;
            }
        }
        return null;
    }
}

module.exports = CorrelationGraph;
