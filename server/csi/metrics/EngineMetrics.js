'use strict';

/**
 * EngineMetrics
 * 
 * In-memory metrics storage for CSI V1 engines.
 * 
 * Tracks:
 * - executionCount
 * - successCount
 * - failureCount
 * - averageLatency
 * - minimumLatency
 * - maximumLatency
 * - bytesCollected
 * - lastExecution
 * - lastFailure
 */
class EngineMetrics {
    constructor() {
        this._metrics = new Map();
    }

    _ensureEngine(engineId) {
        if (!this._metrics.has(engineId)) {
            this._metrics.set(engineId, {
                executionCount: 0,
                successCount: 0,
                failureCount: 0,
                averageLatency: 0,
                minimumLatency: Number.MAX_SAFE_INTEGER,
                maximumLatency: 0,
                bytesCollected: 0,
                lastExecution: null,
                lastFailure: null,
                _totalLatency: 0
            });
        }
        return this._metrics.get(engineId);
    }

    /**
     * Record a successful execution (replaces recordSuccess).
     * @param {string} engineId 
     * @param {number} latencyMs 
     */
    recordExecution(engineId, latencyMs) {
        const m = this._ensureEngine(engineId);
        m.executionCount++;
        m.successCount++;
        m.lastExecution = new Date().toISOString();
        
        m._totalLatency += latencyMs;
        m.averageLatency = Math.round(m._totalLatency / m.executionCount);
        
        if (latencyMs < m.minimumLatency) m.minimumLatency = latencyMs;
        if (latencyMs > m.maximumLatency) m.maximumLatency = latencyMs;
    }

    /**
     * Record bytes collected.
     * @param {string} engineId 
     * @param {number} bytes 
     */
    recordBytes(engineId, bytes) {
        const m = this._ensureEngine(engineId);
        m.bytesCollected += bytes;
    }

    /**
     * Record a failed execution.
     * @param {string} engineId 
     * @param {number} latencyMs 
     */
    recordFailure(engineId, latencyMs) {
        const m = this._ensureEngine(engineId);
        m.executionCount++;
        m.failureCount++;
        m.lastExecution = new Date().toISOString();
        m.lastFailure = new Date().toISOString();

        m._totalLatency += latencyMs;
        m.averageLatency = Math.round(m._totalLatency / m.executionCount);

        if (latencyMs < m.minimumLatency) m.minimumLatency = latencyMs;
        if (latencyMs > m.maximumLatency) m.maximumLatency = latencyMs;
    }

    /**
     * Get a snapshot of all metrics.
     * @returns {Record<string, object>}
     */
    snapshot() {
        const result = {};
        for (const [engineId, m] of this._metrics.entries()) {
            result[engineId] = {
                executionCount: m.executionCount,
                successCount: m.successCount,
                failureCount: m.failureCount,
                averageLatency: m.averageLatency,
                minimumLatency: m.minimumLatency === Number.MAX_SAFE_INTEGER ? 0 : m.minimumLatency,
                maximumLatency: m.maximumLatency,
                bytesCollected: m.bytesCollected,
                lastExecution: m.lastExecution,
                lastFailure: m.lastFailure
            };
        }
        return result;
    }

    /**
     * Reset all metrics.
     */
    reset() {
        this._metrics.clear();
    }
}

// Singleton for in-memory tracking
const engineMetrics = new EngineMetrics();

module.exports = { EngineMetrics, engineMetrics };
