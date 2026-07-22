const RuntimeCapabilityResult = require('./RuntimeCapabilityResult');

/**
 * @module CapabilityRuntime
 * @description Central controller orchestrating bindings between execution requests and capability contracts.
 */
class CapabilityRuntime {
    /**
     * @param {Object} deps 
     * @param {import('./CapabilityResolver')} deps.capabilityResolver
     */
    constructor(deps) {
        this.capabilityResolver = deps.capabilityResolver;
    }

    /**
     * Invokes a capability securely via abstract contract bindings.
     * @param {string} capabilityId 
     * @param {import('./RuntimeCapabilityContext')} context 
     * @param {import('./CapabilityContract')} mockContract - Injected strictly for Phase 13 validation mock routing.
     * @returns {Promise<RuntimeCapabilityResult>}
     */
    async executeCapability(capabilityId, context, mockContract) {
        try {
            const binding = this.capabilityResolver.resolve(capabilityId, mockContract);
            
            if (!binding) {
                return new RuntimeCapabilityResult({
                    success: false,
                    status: 'CAPABILITY_NOT_FOUND',
                    warnings: [`Capability ${capabilityId} could not be resolved.`]
                });
            }

            // Secure abstract execution boundary
            const result = await binding.contract.execute(context);
            
            if (!(result instanceof RuntimeCapabilityResult)) {
                return RuntimeCapabilityResult.fallbackError('CapabilityContract failed to return a RuntimeCapabilityResult.');
            }

            return result;
        } catch (error) {
            return RuntimeCapabilityResult.fallbackError(`CapabilityRuntime execution failure: ${error.message}`);
        }
    }
}

module.exports = CapabilityRuntime;
