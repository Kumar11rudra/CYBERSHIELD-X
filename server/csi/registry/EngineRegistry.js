'use strict';

const { IIntelligenceEngine } = require('../interfaces/IIntelligenceEngine');
const { DuplicateEngineRegistrationError } = require('../errors/CsiErrors');

/**
 * EngineRegistry
 *
 * Central registry for all CSI intelligence engines.
 * The CsiOrchestrationService and ExecutionDispatcher resolve engines
 * exclusively through this registry — never via direct imports.
 *
 * Rules:
 *   - Only IIntelligenceEngine instances may be registered.
 *   - Engines are stored in registration order.
 *   - resolve() returns matching engines: passive engines first, active engines after.
 *   - Feature flags (CSI_ENABLE_*_ENGINE env vars) are checked during register().
 *   - Engine-to-engine imports remain impossible through this pattern.
 */
class EngineRegistry {
    constructor() {
        /** @type {IIntelligenceEngine[]} */
        this._engines = [];
    }

    /**
     * Register an engine. Checks feature flag before registering.
 * Throws TypeError if the engine does not implement IIntelligenceEngine.
 *
 * Feature flag convention: CSI_ENABLE_{ENGINE_NAME}_ENGINE=true
 * e.g. CSI_ENABLE_DNS_ENGINE=true
 *
 * @param {IIntelligenceEngine} engine
 * @param {object} [options]
 * @param {boolean} [options.skipFlagCheck=false] - For testing only
 */
    register(engine, options = {}) {
        if (!(engine instanceof IIntelligenceEngine)) {
            throw new TypeError(
                `[EngineRegistry] Only IIntelligenceEngine instances may be registered. ` +
                `Got: ${engine?.constructor?.name || typeof engine}`
            );
        }

        const meta = engine.metadata();

        // Check for duplicates
        if (this._engines.some(e => e.metadata().id === meta.id)) {
            throw new DuplicateEngineRegistrationError(`Engine with ID ${meta.id} is already registered.`);
        }

        const flagKey = `CSI_ENABLE_${meta.id.toUpperCase()}_ENGINE`;

        if (!options.skipFlagCheck) {
            const flagValue = process.env[flagKey];
            // Default to enabled if flag is not set (fail-open for development)
            if (flagValue !== undefined && flagValue.toLowerCase() === 'false') {
                // Engine is explicitly disabled via feature flag
                return;
            }
        }

        this._engines.push(engine);
    }

    /**
     * Resolve the engines compatible with the given TargetDTO.
     * Passive engines (dns, whois, ssl) are returned before active engines.
     *
     * @param {import('../dtos/TargetDTO').TargetDTO} targetDTO
     * @returns {IIntelligenceEngine[]}
     */
    resolve(targetDTO) {
        const PASSIVE_ENGINES = ['dns', 'whois', 'ssl'];

        const matching = this._engines.filter(e => {
            try {
                return e.supports(targetDTO);
            } catch {
                return false;
            }
        });

        // Sort: passive first, active after
        return matching.sort((a, b) => {
            const aId = a.metadata().id;
            const bId = b.metadata().id;
            const aPassive = PASSIVE_ENGINES.includes(aId) ? 0 : 1;
            const bPassive = PASSIVE_ENGINES.includes(bId) ? 0 : 1;
            return aPassive - bPassive;
        });
    }

    /**
     * Returns true if at least one registered engine supports the given target.
     * @param {import('../dtos/TargetDTO').TargetDTO} targetDTO
     * @returns {boolean}
     */
    supports(targetDTO) {
        return this.resolve(targetDTO).length > 0;
    }

    /**
     * Return metadata from all registered engines.
     * @returns {object[]}
     */
    metadata() {
        return this._engines.map(e => {
            try {
                return e.metadata();
            } catch {
                return { id: 'unknown', error: 'metadata() failed' };
            }
        });
    }

    /**
     * Returns the count of registered engines.
     * @returns {number}
     */
    get count() {
        return this._engines.length;
    }

    /**
     * Run healthCheck() on all registered engines in parallel.
     * @returns {Promise<{ engineId: string, health: object }[]>}
     */
    async runHealthChecks() {
        const results = await Promise.allSettled(
            this._engines.map(async e => {
                const meta   = e.metadata();
                const health = await e.healthCheck();
                return { engineId: meta.id, health };
            })
        );

        return results.map(r =>
            r.status === 'fulfilled'
                ? r.value
                : { engineId: 'unknown', health: { status: 'degraded', message: r.reason?.message } }
        );
    }
}

module.exports = { EngineRegistry };
