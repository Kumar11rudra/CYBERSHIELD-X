/**
 * @module ExecutionGuard
 * @description Enforces policies and issues ExecutionTickets.
 * "Runtime Integration Pending"
 */
const ExecutionTicket = require('./ExecutionTicket');

class ExecutionGuard {
    /**
     * @param {Object} deps
     * @param {import('./ExecutionPolicy')} deps.executionPolicy
     * @param {import('./ApprovalPolicy')} deps.approvalPolicy
     */
    constructor({ executionPolicy, approvalPolicy }) {
        if (!executionPolicy || !approvalPolicy) {
            throw new Error("ExecutionPolicy and ApprovalPolicy are required for ExecutionGuard");
        }
        this.executionPolicy = executionPolicy;
        this.approvalPolicy = approvalPolicy;
    }

    /**
     * Evaluates the context against policies.
     * @param {import('./ExecutionContext')} context
     * @returns {Promise<import('./ExecutionTicket')>}
     */
    async evaluate(context) {
        const policyDecision = await this.executionPolicy.evaluate(context);
        
        if (policyDecision.status === 'DENY') {
            throw new Error(`Execution denied by policy: ${policyDecision.reason}`);
        }

        let approvalTicket = null;
        if (policyDecision.status === 'APPROVAL_REQUIRED') {
            approvalTicket = await this.approvalPolicy.requireApproval(context);
        }

        return new ExecutionTicket({
            contextId: context.id,
            status: policyDecision.status,
            approvalTicket,
            issuedAt: new Date().toISOString()
        });
    }
}

module.exports = ExecutionGuard;
