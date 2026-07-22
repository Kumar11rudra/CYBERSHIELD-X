'use strict';

/**
 * NetworkExecutionContext
 *
 * Provides execution context for network clients.
 * Mandatory fields: executionId, targetId, timeout, retryPolicy, timestamp, telemetry, correlationId
 */
class NetworkExecutionContext {
    /**
     * @param {object} params
     * @param {string} params.executionId
     * @param {string} params.targetId
     * @param {number} params.timeout
     * @param {object} params.retryPolicy
     * @param {number} params.retryPolicy.maxRetries
     * @param {number} params.retryPolicy.backoffMs
     * @param {string} [params.timestamp]
     * @param {object} [params.telemetry]
     * @param {string} [params.correlationId]
     * @param {number} [params.responseLimit]
     * @param {string} [params.workerId]
     * @param {number} [params.requestNumber]
     */
    constructor({ executionId, targetId, timeout, retryPolicy, timestamp, telemetry, correlationId, responseLimit, workerId, requestNumber }) {
        if (!executionId) throw new Error('[NetworkExecutionContext] executionId is required');
        if (!targetId) throw new Error('[NetworkExecutionContext] targetId is required');
        if (typeof timeout !== 'number') throw new Error('[NetworkExecutionContext] timeout is required and must be a number');
        if (!retryPolicy || typeof retryPolicy.maxRetries !== 'number' || typeof retryPolicy.backoffMs !== 'number') {
            throw new Error('[NetworkExecutionContext] retryPolicy with maxRetries and backoffMs is required');
        }

        this.executionId   = executionId;
        this.targetId      = targetId;
        this.timeout       = timeout;
        this.retryPolicy   = retryPolicy;
        this.timestamp     = timestamp || new Date().toISOString();
        this.telemetry     = telemetry || {};
        this.correlationId = correlationId || executionId;
        this.responseLimit = responseLimit || 2 * 1024 * 1024; // Default 2 MB
        this.workerId      = workerId || null;
        this.requestNumber = requestNumber || 0;
        this.deadline      = Date.now() + this.timeout;

        Object.freeze(this);
    }

    remainingTime() {
        return Math.max(0, this.deadline - Date.now());
    }

    isExpired() {
        return Date.now() >= this.deadline;
    }
}

module.exports = { NetworkExecutionContext };
