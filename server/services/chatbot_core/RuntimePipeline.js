/**
 * @module RuntimePipeline
 * @description Stateless pipeline orchestrating the execution of AI capabilities.
 */
const RuntimeContext = require('./RuntimeContext');

class RuntimePipeline {
    /**
     * @param {Object} deps
     */
    constructor(deps) {
        this.featureFlags = deps.featureFlagProvider;
        this.intentAnalyzer = deps.intentAnalyzer;
        this.decisionEngine = deps.decisionEngine;
        this.actionPlanner = deps.actionPlanner;
        this.governanceManager = deps.governanceManager;
        this.safetyManager = deps.safetyManager;
        this.capabilityRegistry = deps.capabilityRegistry;
        this.executionOrchestrator = deps.executionOrchestrator;
        this.auditEngine = deps.auditEngine;
        this.responseFormatter = deps.responseFormatter;

        // Stage Registry
        this.stageRegistry = [
            { id: 'intent', name: 'Intent Analysis', executionOrder: 1, enabled: true, critical: true, version: '1.0' },
            { id: 'decision', name: 'Decision Engine', executionOrder: 2, enabled: true, critical: true, version: '1.0' },
            { id: 'plan', name: 'Action Planning', executionOrder: 3, enabled: true, critical: true, version: '1.0' },
            { id: 'governance', name: 'Governance Check', executionOrder: 4, enabled: true, critical: true, version: '1.0' },
            { id: 'safety', name: 'Safety Validation', executionOrder: 5, enabled: true, critical: true, version: '1.0' },
            { id: 'capability', name: 'Capability Resolution', executionOrder: 6, enabled: true, critical: true, version: '1.0' },
            { id: 'adapter', name: 'Adapter Execution', executionOrder: 7, enabled: true, critical: true, version: '1.0' }
        ].sort((a, b) => a.executionOrder - b.executionOrder);
    }

    /**
     * Executes the pipeline given the initial snapshot and message.
     * @param {Object} snapshot
     * @param {string} latestMessage
     * @returns {Promise<Object>} Formatted response
     */
    async execute(snapshot, latestMessage) {
        if (!this.featureFlags.isEnabled('RuntimePipeline')) {
            return this.responseFormatter.formatError('Runtime Pipeline is disabled.', 'PIPELINE_DISABLED');
        }

        let context = new RuntimeContext({ snapshot });
        context = context.addTrace('Context Built');

        for (const stage of this.stageRegistry) {
            if (context.isCancelled) {
                break;
            }

            if (!stage.enabled) continue;

            const hookName = `before${stage.id.charAt(0).toUpperCase() + stage.id.slice(1)}`;
            if (typeof this[hookName] === 'function' && this.featureFlags.isEnabled('Hooks')) {
                await this[hookName](context);
            }

            try {
                context = await this._executeStage(stage.id, context, latestMessage);
                if (context.isCancelled) {
                    break;
                }
                context = context.incrementStep();
            } catch (error) {
                // Pipeline should not throw, but just in case of unhandled errors
                context = context.enrich({ isCancelled: true, cancellationReason: error.message });
                break;
            }

            const afterHookName = `after${stage.id.charAt(0).toUpperCase() + stage.id.slice(1)}`;
            if (typeof this[afterHookName] === 'function' && this.featureFlags.isEnabled('Hooks')) {
                await this[afterHookName](context);
            }
        }

        // --- Audit & Telemetry Stage ---
        const auditResult = this.auditEngine.process(context);
        context = context.enrich({ auditResult }).addTrace('Audit Processed');

        context = context.finalize(this.stageRegistry.length);

        if (context.isCancelled) {
            const errorResponse = this.responseFormatter.formatError(`Action Cancelled: ${context.cancellationReason}`, 'PIPELINE_CANCELLED');
            return context.enrich({ response: errorResponse });
        }

        if (context.response) {
            // Already formatted error response inside a stage
            return context;
        }

        // Final Response Formatting
        if (this.featureFlags.isEnabled('Hooks')) await this.beforeResponse(context);
        const finalResponse = this.responseFormatter.formatResponse(
            "Abstract Capability executed successfully (Mock).", 
            { executionContract: context.executionContract }
        );
        if (this.featureFlags.isEnabled('Hooks')) await this.afterResponse(context);

        return context.enrich({ response: finalResponse });
    }

    async _executeStage(stageId, context, latestMessage) {
        let result;
        switch (stageId) {
            case 'intent':
                result = this.intentAnalyzer.analyze(latestMessage, context.snapshot);
                return context.enrich({ intent: result.data }).addTrace('Intent Analyzed');

            case 'decision':
                result = this.decisionEngine.decide(latestMessage, context.snapshot);
                if (!result.success || result.data.decision === 'DENY') {
                    const formatted = this.responseFormatter.formatError(`Action Denied: ${result.error || result.data?.reason}`, 'DECISION_DENIED');
                    return context.enrich({ isCancelled: true, cancellationReason: 'Decision Engine Denied', response: formatted });
                }
                return context.enrich({ decision: result.data }).addTrace('Decision Approved');

            case 'plan':
                result = this.actionPlanner.plan(context.decision);
                return context.enrich({ plan: result.data }).addTrace('Plan Generated');

            case 'governance':
                if (!this.featureFlags.isEnabled('Governance')) return context;
                // Mock Governance call for Phase 7
                result = await this.governanceManager.authorizeExecution({ plan: context.plan });
                if (!result.success) {
                    const formatted = this.responseFormatter.formatError(`Governance Denied: ${result.error}`, 'GOVERNANCE_DENIED');
                    return context.enrich({ isCancelled: true, cancellationReason: 'Governance Denied', response: formatted });
                }
                return context.enrich({ governanceTicket: result.data }).addTrace('Governance Approved');

            case 'safety':
                if (!this.featureFlags.isEnabled('Safety')) return context;
                // Mock Safety call for Phase 7
                result = await this.safetyManager.validateExecution({ plan: context.plan, ticket: context.governanceTicket });
                if (!result.success) {
                    const formatted = this.responseFormatter.formatError(`Safety Blocked: ${result.error}`, 'SAFETY_BLOCKED');
                    return context.enrich({ isCancelled: true, cancellationReason: 'Safety Blocked', response: formatted });
                }
                return context.enrich({ safetyDecision: result.data }).addTrace('Safety Approved');

            case 'capability':
                if (!this.featureFlags.isEnabled('CapabilityLayer')) return context;
                result = this.capabilityRegistry.resolveCapability(context.plan);
                if (!result.success) {
                    const formatted = this.responseFormatter.formatError(`Capability not found: ${result.error}`, 'CAPABILITY_NOT_FOUND');
                    return context.enrich({ isCancelled: true, cancellationReason: 'Capability Not Found', response: formatted });
                }
                return context.enrich({ capability: result.data }).addTrace('Capability Resolved');

            case 'adapter':
                if (!this.featureFlags.isEnabled('CapabilityLayer')) return context;
                
                const execResponse = await this.executionOrchestrator.execute(context.capability, context.plan);
                
                if (!execResponse.success) {
                    const formatted = this.responseFormatter.formatError(`Execution Orchestration failed: ${execResponse.error}`, execResponse.status);
                    return context.enrich({ 
                        isCancelled: true, 
                        cancellationReason: `Execution Failed: ${execResponse.error}`, 
                        response: formatted,
                        executionMetadata: execResponse.metadata
                    });
                }
                
                return context.enrich({ 
                    executionRequest: execResponse.data.executionRequest, // If passed back
                    executionResponse: execResponse,
                    executionContract: execResponse.data.executionContract, 
                    executionMetadata: execResponse.metadata
                }).addTrace('Execution Mocked');

            default:
                return context;
        }
    }

    // Lifecycle Hooks (Empty placeholders for future phases)
    async beforeIntent(context) {}
    async afterIntent(context) {}
    async beforeDecision(context) {}
    async afterDecision(context) {}
    async beforeGovernance(context) {}
    async afterGovernance(context) {}
    async beforeSafety(context) {}
    async afterSafety(context) {}
    async beforeCapability(context) {}
    async afterCapability(context) {}
    async beforeResponse(context) {}
    async afterResponse(context) {}
}

module.exports = RuntimePipeline;
