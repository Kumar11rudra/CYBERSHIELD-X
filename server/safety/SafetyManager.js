/**
 * @module SafetyManager
 * @description Choke point for all safety validation.
 * "Runtime Integration Pending"
 */
class SafetyManager {
    /**
     * @param {Object} deps
     * @param {import('./PromptSafetyValidator')} deps.promptSafetyValidator
     * @param {import('./CapabilitySafetyValidator')} deps.capabilitySafetyValidator
     * @param {import('./ConflictDetector')} deps.conflictDetector
     * @param {import('./PolicyValidator')} deps.policyValidator
     * @param {import('./TrustScoreEngine')} deps.trustScoreEngine
     * @param {import('./RateLimiter')} deps.rateLimiter
     * @param {import('./ExecutionLimiter')} deps.executionLimiter
     */
    constructor({
        promptSafetyValidator,
        capabilitySafetyValidator,
        conflictDetector,
        policyValidator,
        trustScoreEngine,
        rateLimiter,
        executionLimiter
    }) {
        if (!promptSafetyValidator || !capabilitySafetyValidator || !conflictDetector) {
            throw new Error("Core safety validators are required");
        }
        this.validators = [
            promptSafetyValidator,
            capabilitySafetyValidator,
            conflictDetector,
            policyValidator,
            trustScoreEngine,
            rateLimiter,
            executionLimiter
        ];
    }

    /**
     * Runs all safety validators.
     * @param {import('./SafetyContext')} context
     * @returns {Promise<Object>} { success, status, data, error, metadata }
     */
    async validateExecution(context) {
        if (!context || !context.isValid()) {
            return { success: false, status: 'INVALID_CONTEXT', error: 'Invalid SafetyContext', data: null, metadata: {} };
        }

        for (const validator of this.validators) {
            if (validator) {
                const decision = await validator.validate(context);
                if (!decision.isSafe) {
                    return { success: false, status: 'DENIED', error: decision.reason, data: null, metadata: {} };
                }
            }
        }

        return { success: true, status: 'APPROVED', error: null, data: {}, metadata: {} };
    }
}

module.exports = SafetyManager;
