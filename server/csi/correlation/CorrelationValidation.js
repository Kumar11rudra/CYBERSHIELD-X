'use strict';

class CorrelationValidation {
    static validateInputs(findings, riskResult, evidences) {
        if (!Array.isArray(findings)) {
            throw new TypeError('[CorrelationValidation] findings must be an array');
        }
        if (!riskResult || typeof riskResult !== 'object') {
            throw new TypeError('[CorrelationValidation] riskResult is required');
        }
        if (!Array.isArray(evidences)) {
            throw new TypeError('[CorrelationValidation] evidences must be an array');
        }

        // Duplicate checks
        const findingIds = new Set();
        for (const finding of findings) {
            if (!finding.findingId) throw new Error('[CorrelationValidation] finding missing findingId');
            if (findingIds.has(finding.findingId)) {
                throw new Error(`[CorrelationValidation] Duplicate findingId detected: ${finding.findingId}`);
            }
            findingIds.add(finding.findingId);
        }

        const evidenceIds = new Set();
        for (const ev of evidences) {
            if (!ev.evidenceId) throw new Error('[CorrelationValidation] evidence missing evidenceId');
            if (evidenceIds.has(ev.evidenceId)) {
                throw new Error(`[CorrelationValidation] Duplicate evidenceId detected: ${ev.evidenceId}`);
            }
            evidenceIds.add(ev.evidenceId);
        }
    }

    static checkGraphCycles(graph) {
        const visited = new Set();
        const recursionStack = new Set();

        const dfs = (nodeId) => {
            if (recursionStack.has(nodeId)) return true;
            if (visited.has(nodeId)) return false;

            visited.add(nodeId);
            recursionStack.add(nodeId);

            const neighbors = graph.adjacencyList.get(nodeId) || new Set();
            for (const neighborId of neighbors) {
                if (dfs(neighborId)) return true;
            }

            recursionStack.delete(nodeId);
            return false;
        };

        for (const nodeId of graph.nodes.keys()) {
            if (dfs(nodeId)) {
                throw new Error(`[CorrelationValidation] Forbidden cycle detected starting at node: ${nodeId}`);
            }
        }
    }

    static validateScore(score) {
        if (typeof score !== 'number' || isNaN(score)) {
            throw new TypeError('[CorrelationValidation] Invalid score calculation');
        }
        if (score < 0) {
            throw new Error(`[CorrelationValidation] Negative correlation score: ${score}`);
        }
        if (score > 1000) { // arbitrary cap to prevent overflow, typically bounded naturally
            throw new Error(`[CorrelationValidation] Score overflow detected: ${score}`);
        }
    }
}

module.exports = CorrelationValidation;
