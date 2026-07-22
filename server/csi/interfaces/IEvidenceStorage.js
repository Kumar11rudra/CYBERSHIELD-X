'use strict';

const { CsiNotImplementedError } = require('./IIntelligenceEngine');

/**
 * IEvidenceStorage
 *
 * Abstract base for all CSI evidence storage backends.
 * V1 implementation: LocalEvidenceStorage (filesystem).
 * Future: S3EvidenceStorage (drop-in replacement, zero engine changes).
 *
 * Immutability Rules:
 *   - store() computes SHA-256 internally; the caller cannot supply a hash.
 *   - No update() method exists. Evidence bytes are write-once.
 *   - delete() exists only for GDPR compliance and logs an immutable audit event.
 *   - EvidenceDTO.sha256Hash is sealed after construction.
 *
 * @abstract
 */
class IEvidenceStorage {
    constructor() {
        if (new.target === IEvidenceStorage) {
            throw new CsiNotImplementedError(
                'constructor',
                'IEvidenceStorage cannot be instantiated directly. Extend it.'
            );
        }
    }

    /**
     * Store raw bytes as an immutable evidence artifact.
     * Computes SHA-256 hash internally.
     * @param {Buffer} data              - Raw bytes to store
     * @param {object} metadata
     * @param {string} metadata.engineSource  - Engine that produced this evidence
     * @param {string} metadata.contentType   - 'pem'|'json'|'html'|'hex'|'text'
     * @param {string} metadata.executionId   - Orchestration job UUID
     * @returns {Promise<import('../dtos/EvidenceDTO')>}
     */
    async store(data, metadata) { // eslint-disable-line no-unused-vars
        throw new CsiNotImplementedError('store', this.constructor.name);
    }

    /**
     * Retrieve raw bytes for a stored evidence artifact.
     * @param {string} evidenceId - UUID of the evidence artifact
     * @returns {Promise<Buffer>}
     */
    async retrieve(evidenceId) { // eslint-disable-line no-unused-vars
        throw new CsiNotImplementedError('retrieve', this.constructor.name);
    }

    /**
     * Check whether an evidence artifact exists.
     * @param {string} evidenceId
     * @returns {Promise<boolean>}
     */
    async exists(evidenceId) { // eslint-disable-line no-unused-vars
        throw new CsiNotImplementedError('exists', this.constructor.name);
    }

    /**
     * Delete an evidence artifact (GDPR only). Logs an audit event before deletion.
     * @param {string} evidenceId
     * @returns {Promise<void>}
     */
    async delete(evidenceId) { // eslint-disable-line no-unused-vars
        throw new CsiNotImplementedError('delete', this.constructor.name);
    }

    /**
     * Architecture Hook (Future Milestone): Sign an evidence artifact using Ed25519.
     * @param {string} evidenceId
     * @returns {Promise<string>} - The digital signature
     */
    async signEvidence(evidenceId) { // eslint-disable-line no-unused-vars
        throw new CsiNotImplementedError('signEvidence', this.constructor.name);
    }
}

module.exports = { IEvidenceStorage };
