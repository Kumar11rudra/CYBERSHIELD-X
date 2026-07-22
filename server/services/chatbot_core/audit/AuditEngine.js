const AuditResult = require('./AuditResult');

/**
 * @module AuditEngine
 * @description Central coordinator for the Audit Layer.
 */
class AuditEngine {
    /**
     * @param {Object} deps
     * @param {import('./AuditCollector')} deps.auditCollector
     * @param {import('./AuditFormatter')} deps.auditFormatter
     * @param {import('./AuditPolicy')} deps.auditPolicy
     */
    constructor(deps) {
        this.auditCollector = deps.auditCollector;
        this.auditFormatter = deps.auditFormatter;
        this.auditPolicy = deps.auditPolicy;
    }

    /**
     * @param {Object} runtimeContext - The immutable RuntimeContext
     * @returns {AuditResult}
     */
    process(runtimeContext) {
        try {
            // 1. Collect potential events (Pure read)
            const rawEvents = this.auditCollector.collect(runtimeContext);
            
            // 2. Evaluate policy
            const approvedEvents = [];
            for (const event of rawEvents) {
                const decision = this.auditPolicy.evaluate(event.context, event);
                if (decision.shouldAudit) {
                    approvedEvents.push(event);
                }
            }
            
            // 3. Format and return Result
            return this.auditFormatter.format(approvedEvents, { processedAt: Date.now() });
        } catch (error) {
            // Guard 1: AuditEngine Isolation - Never stop RuntimePipeline
            return AuditResult.emptyFallback(`AuditEngine internal failure: ${error.message}`);
        }
    }
}

module.exports = AuditEngine;
