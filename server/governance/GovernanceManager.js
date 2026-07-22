/**
 * @module GovernanceManager
 * @description Central authorization gateway. Intercepts all action plans.
 * "Runtime Integration Pending"
 */
class GovernanceManager {
    /**
     * @param {Object} deps
     * @param {import('./ExecutionGuard')} deps.executionGuard
     */
    constructor({ executionGuard }) {
        if (!executionGuard) {
            throw new Error("ExecutionGuard is required for GovernanceManager");
        }
        this.executionGuard = executionGuard;
    }

    /**
     * Processes an abstract action plan for authorization.
     * @param {import('./ExecutionContext')} context
     * @returns {Promise<Object>} { success, status, data, error, metadata }
     */
    async authorizeExecution(context) {
        if (!context || !context.isValid()) {
            return { success: false, status: 'INVALID_CONTEXT', error: 'Invalid ExecutionContext', data: null, metadata: {} };
        }

        try {
            const ticket = await this.executionGuard.evaluate(context);
            return { success: true, status: 'AUTHORIZED', data: { ticket }, error: null, metadata: {} };
        } catch (error) {
            return { success: false, status: 'DENIED', error: error.message, data: null, metadata: {} };
        }
    }
}

module.exports = GovernanceManager;
