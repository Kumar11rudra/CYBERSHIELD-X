'use strict';

/**
 * CsiNotImplementedError
 * Thrown when an IIntelligenceEngine method is not overridden by a concrete engine.
 */
class CsiNotImplementedError extends Error {
    constructor(methodName, engineName) {
        super(`[CSI] ${engineName || 'IIntelligenceEngine'}.${methodName}() is not implemented.`);
        this.name = 'CsiNotImplementedError';
        this.methodName = methodName;
    }
}

/**
 * IIntelligenceEngine
 *
 * Abstract base class that every CSI intelligence engine MUST extend.
 * No engine-specific contracts are permitted. All engines must conform
 * to this single interface.
 *
 * Rules:
 *   - No engine may import another engine.
 *   - Engines communicate exclusively through CsiOrchestrationService via shared DTOs.
 *   - Every engine must support graceful timeout and never halt the pipeline on failure.
 *
 * @abstract
 */
class IIntelligenceEngine {
    constructor() {
        if (new.target === IIntelligenceEngine) {
            throw new CsiNotImplementedError(
                'constructor',
                'IIntelligenceEngine cannot be instantiated directly. Extend it.'
            );
        }
    }

    /**
     * Initialize the engine. Called once at application startup via csiComposition.
     * Must be idempotent.
     * @returns {Promise<void>}
     */
    async initialize() {
        throw new CsiNotImplementedError('initialize', this.constructor.name);
    }

    /**
     * Returns true if this engine can process the given TargetDTO.
     * @param {import('../dtos/TargetDTO')} targetDTO
     * @returns {boolean}
     */
    supports(targetDTO) { // eslint-disable-line no-unused-vars
        throw new CsiNotImplementedError('supports', this.constructor.name);
    }

    /**
     * Execute intelligence collection against the target.
     * Must return an array of EvidenceDTOs (empty array if no evidence).
     * Must respect timeout passed in ctx.
     * @param {import('../dtos/TargetDTO')} targetDTO
     * @param {import('../network/NetworkExecutionContext')} ctx
     * @returns {Promise<import('../dtos/EvidenceDTO')[]>}
     */
    async collect(targetDTO, ctx) { // eslint-disable-line no-unused-vars
        throw new CsiNotImplementedError('collect', this.constructor.name);
    }

    /**
     * Parse collected evidence into findings.
     * Must return an array of FindingDTOs.
     * @param {import('../dtos/EvidenceDTO')[]} evidence
     * @param {import('../network/NetworkExecutionContext')} ctx
     * @returns {Promise<import('../dtos/FindingDTO')[]>}
     */
    async parse(evidence, ctx) { // eslint-disable-line no-unused-vars
        throw new CsiNotImplementedError('parse', this.constructor.name);
    }

    /**
     * Validate that findings are well-formed before they are passed downstream.
     * @param {import('../dtos/FindingDTO')[]} findings
     * @returns {Promise<boolean>}
     */
    async validate(findings) { // eslint-disable-line no-unused-vars
        throw new CsiNotImplementedError('validate', this.constructor.name);
    }

    /**
     * Report the engine's operational health.
     * Must never throw. Return { status: 'healthy'|'degraded'|'disabled', message } on error.
     * @returns {Promise<{ status: 'healthy'|'degraded'|'disabled', latencyMs: number, message: string }>}
     */
    async healthCheck() {
        throw new CsiNotImplementedError('healthCheck', this.constructor.name);
    }

    /**
     * Return the Engine Manifest.
     * @returns {{
     *   id: string,
     *   version: string,
     *   owner: string,
     *   supportedProtocols: string[],
     *   supportedTargets: string[],
     *   riskContribution: number,
     *   requiredClients: string[],
     *   minimumNodeVersion: string
     * }}
     */
    metadata() {
        throw new CsiNotImplementedError('metadata', this.constructor.name);
    }
}

module.exports = { IIntelligenceEngine, CsiNotImplementedError };
