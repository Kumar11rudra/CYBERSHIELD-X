/**
 * @module RuntimeContext
 * @description Immutable context for the RuntimePipeline.
 */
class RuntimeContext {
    /**
     * @param {Object} state
     */
    constructor(state = {}) {
        this.snapshot = state.snapshot || null;
        this.intent = state.intent || null;
        this.decision = state.decision || null;
        this.plan = state.plan || null;
        this.governanceTicket = state.governanceTicket || null;
        this.safetyDecision = state.safetyDecision || null;
        this.capability = state.capability || null;
        this.executionResponse = state.executionResponse || null;
        this.executionContract = state.executionContract || null;
        this.executionMetadata = state.executionMetadata || null;
        this.auditResult = state.auditResult || null;
        this.response = state.response || null;
        
        // Cancellation Support
        this.isCancelled = state.isCancelled || false;
        this.cancellationReason = state.cancellationReason || null;
        
        // Trace and Metrics (deep copy to maintain immutability)
        this.runtimeTrace = Array.isArray(state.runtimeTrace) ? [...state.runtimeTrace] : [];
        this.runtimeMetrics = state.runtimeMetrics ? { ...state.runtimeMetrics } : {
            startTime: Date.now(),
            endTime: null,
            duration: 0,
            stepsExecuted: 0,
            warnings: []
        };
        this.runtimeHealth = state.runtimeHealth ? { ...state.runtimeHealth } : null;
    }

    /**
     * Returns a new enriched RuntimeContext.
     * @param {Object} updates
     * @returns {RuntimeContext}
     */
    enrich(updates) {
        return new RuntimeContext({ ...this, ...updates });
    }

    /**
     * Returns a new context with a trace event appended.
     * @param {string} event
     * @returns {RuntimeContext}
     */
    addTrace(event) {
        const newTrace = [...this.runtimeTrace, event];
        return this.enrich({ runtimeTrace: newTrace });
    }

    /**
     * Returns a new context with incremented metrics.
     * @returns {RuntimeContext}
     */
    incrementStep() {
        return this.enrich({ 
            runtimeMetrics: { 
                ...this.runtimeMetrics, 
                stepsExecuted: this.runtimeMetrics.stepsExecuted + 1 
            } 
        });
    }

    /**
     * Finalizes metrics and generates health report.
     * @param {number} totalStages 
     * @returns {RuntimeContext}
     */
    finalize(totalStages) {
        const endTime = Date.now();
        const duration = endTime - this.runtimeMetrics.startTime;
        const newMetrics = { ...this.runtimeMetrics, endTime, duration };
        const runtimeHealth = {
            stagesExecuted: newMetrics.stepsExecuted,
            stagesSkipped: totalStages - newMetrics.stepsExecuted,
            warnings: newMetrics.warnings,
            executionDuration: duration,
            pipelineStatus: this.isCancelled ? 'CANCELLED' : 'COMPLETED'
        };
        return this.enrich({ runtimeMetrics: newMetrics, runtimeHealth });
    }
}

module.exports = RuntimeContext;
