'use strict';

/**
 * HealthMonitor
 * 
 * Periodically checks the health of registered engines.
 * Exposes engine health states: healthy, degraded, disabled.
 * Tracks timeout, errorRate, averageLatency, lastSuccess, lastFailure.
 * 
 * MUST NEVER restart engines automatically (Future milestone).
 */
class HealthMonitor {
    constructor(engineRegistry, checkIntervalMs = 60000) {
        this.registry = engineRegistry;
        this.checkIntervalMs = checkIntervalMs;
        this.states = new Map(); // engineId -> state object
        this._timer = null;
    }

    start() {
        if (this._timer) return;
        this._timer = setInterval(() => this._runChecks(), this.checkIntervalMs);
        this._runChecks(); // Run initial check immediately
    }

    stop() {
        if (this._timer) {
            clearInterval(this._timer);
            this._timer = null;
        }
    }

    async _runChecks() {
        const engines = this.registry.getAllEngines ? this.registry.getAllEngines() : [];
        for (const engine of engines) {
            const id = engine.metadata().id;
            const start = Date.now();
            try {
                const result = await engine.healthCheck();
                const latency = Date.now() - start;
                this._updateState(id, result.status, latency, result.message, false);
            } catch (err) {
                const latency = Date.now() - start;
                this._updateState(id, 'degraded', latency, err.message, true);
            }
        }
    }

    _updateState(engineId, status, latency, message, isError) {
        if (!this.states.has(engineId)) {
            this.states.set(engineId, {
                status: 'unknown',
                timeout: false,
                errorCount: 0,
                checkCount: 0,
                errorRate: 0,
                averageLatency: 0,
                _totalLatency: 0,
                lastSuccess: null,
                lastFailure: null,
                lastMessage: null
            });
        }

        const state = this.states.get(engineId);
        
        // If it was manually disabled, do not override
        if (state.status === 'disabled') return;

        state.status = status;
        state.checkCount++;
        state._totalLatency += latency;
        state.averageLatency = Math.round(state._totalLatency / state.checkCount);
        state.lastMessage = message;

        if (isError || status === 'degraded') {
            state.errorCount++;
            state.lastFailure = new Date().toISOString();
            if (message && message.toLowerCase().includes('timeout')) {
                state.timeout = true;
            }
        } else {
            state.lastSuccess = new Date().toISOString();
            state.timeout = false;
        }

        state.errorRate = (state.errorCount / state.checkCount);
    }

    /**
     * Disable an engine manually.
     * @param {string} engineId 
     */
    disableEngine(engineId) {
        if (!this.states.has(engineId)) {
            this.states.set(engineId, { checkCount: 0, errorCount: 0, _totalLatency: 0 });
        }
        this.states.get(engineId).status = 'disabled';
    }

    /**
     * Get the overall system status based on all engines.
     * @returns {string} 'healthy', 'degraded', or 'unknown'
     */
    overallStatus() {
        let isDegraded = false;
        let isUnknown = false;
        
        if (this.states.size === 0) return 'unknown';

        for (const state of this.states.values()) {
            if (state.status === 'degraded') isDegraded = true;
            if (state.status === 'unknown') isUnknown = true;
        }

        if (isDegraded) return 'degraded';
        if (isUnknown) return 'unknown';
        return 'healthy';
    }

    /**
     * Get health state for a specific engine.
     * @param {string} engineId 
     */
    engineStatus(engineId) {
        if (!this.states.has(engineId)) return null;
        const state = this.states.get(engineId);
        return {
            status: state.status,
            timeout: state.timeout,
            errorRate: state.errorRate,
            averageLatency: state.averageLatency,
            lastSuccess: state.lastSuccess,
            lastFailure: state.lastFailure,
            lastMessage: state.lastMessage
        };
    }

    /**
     * Get health state for all engines.
     */
    snapshot() {
        const result = {};
        for (const id of this.states.keys()) {
            result[id] = this.engineStatus(id);
        }
        return result;
    }
}

module.exports = { HealthMonitor };
