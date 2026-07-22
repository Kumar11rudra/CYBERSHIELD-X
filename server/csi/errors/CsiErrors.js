'use strict';

/**
 * CSI Error Model — All CSI-specific structured errors.
 *
 * Rules:
 *   - Engines must return structured errors, never throw raw Errors upstream.
 *   - Every error carries the engineSource, executionId, and original cause.
 *   - Callers distinguish error types via instanceof checks.
 */

/**
 * Base class for all CSI errors. Carries structured metadata.
 */
class CsiBaseError extends Error {
    /**
     * @param {string} message
     * @param {object} [context]
     * @param {string} [context.engineSource]
     * @param {string} [context.executionId]
     * @param {Error}  [context.cause]
     */
    constructor(message, context = {}) {
        super(message);
        this.name         = this.constructor.name;
        this.engineSource = context.engineSource || null;
        this.executionId  = context.executionId  || null;
        this.cause        = context.cause        || null;
        this.timestamp    = new Date().toISOString();
        if (Error.captureStackTrace) Error.captureStackTrace(this, this.constructor);
    }

    toJSON() {
        return {
            name:         this.name,
            message:      this.message,
            engineSource: this.engineSource,
            executionId:  this.executionId,
            timestamp:    this.timestamp,
            cause:        this.cause ? this.cause.message : null,
        };
    }
}

/** Thrown when a network operation exceeds its configured timeout. */
class CsiTimeoutError extends CsiBaseError {
    constructor(message, context = {}) {
        super(message, context);
        this.timeoutMs = context.timeoutMs || null;
    }
}

/** Thrown when input fails validation in the pipeline or inside an engine. */
class CsiValidationError extends CsiBaseError {
    constructor(message, context = {}) {
        super(message, context);
        this.rawInput = context.rawInput || null;
    }
}

/** Thrown when a generic TCP/IP network failure occurs (connection refused, ENOTFOUND, etc.). */
class CsiNetworkError extends CsiBaseError {
    constructor(message, context = {}) {
        super(message, context);
        this.target = context.target || null;
        this.code   = context.code   || null;
    }
}

/** Thrown when a DNS resolution operation fails. */
class CsiDnsError extends CsiBaseError {
    constructor(message, context = {}) {
        super(message, context);
        this.target     = context.target     || null;
        this.recordType = context.recordType || null;
        this.code       = context.code       || null;
    }
}

/** Thrown when a TLS handshake or certificate extraction fails. */
class CsiTlsError extends CsiBaseError {
    constructor(message, context = {}) {
        super(message, context);
        this.target = context.target || null;
        this.port   = context.port   || 443;
        this.code   = context.code   || null;
    }
}

/** Thrown when a WHOIS or RDAP lookup fails. */
class CsiWhoisError extends CsiBaseError {
    constructor(message, context = {}) {
        super(message, context);
        this.domain       = context.domain       || null;
        this.whoisServer  = context.whoisServer  || null;
        this.fallbackUsed = context.fallbackUsed || false;
    }
}

/** Thrown when evidence storage operations fail. */
class CsiEvidenceError extends CsiBaseError {
    constructor(message, context = {}) {
        super(message, context);
        this.evidenceId = context.evidenceId || null;
    }
}

class DuplicateEngineRegistrationError extends CsiBaseError {}
class EvidenceIntegrityError extends CsiBaseError {}
class ResponseTooLargeError extends CsiBaseError {}
class EngineTimeoutError extends CsiBaseError {}
class EngineExecutionError extends CsiBaseError {}
class SignatureLoadError extends CsiBaseError {}
class NetworkContextExpiredError extends CsiBaseError {}

// Milestone 6.6 Pipeline Errors
class ExecutionValidationError extends CsiBaseError {}
class PipelineInitializationError extends CsiBaseError {}
class PipelineDependencyError extends CsiBaseError {}
class PipelineExecutionError extends CsiBaseError {}
class PipelineHealthError extends CsiBaseError {}

module.exports = {
    CsiBaseError,
    CsiTimeoutError,
    CsiValidationError,
    CsiNetworkError,
    CsiDnsError,
    CsiTlsError,
    CsiWhoisError,
    CsiEvidenceError,
    DuplicateEngineRegistrationError,
    EvidenceIntegrityError,
    ResponseTooLargeError,
    EngineTimeoutError,
    EngineExecutionError,
    SignatureLoadError,
    NetworkContextExpiredError,
    ExecutionValidationError,
    PipelineInitializationError,
    PipelineDependencyError,
    PipelineExecutionError,
    PipelineHealthError
};

