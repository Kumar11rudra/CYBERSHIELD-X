'use strict';

const { randomUUID, createHash } = require('crypto');

/**
 * EvidenceDTO
 *
 * Immutable pointer to a stored raw evidence artifact.
 * Created exclusively by IEvidenceStorage.store() — never by engines directly.
 *
 * Invariants:
 *   - Frozen via Object.freeze().
 *   - sha256Hash is computed by the storage layer, never supplied externally.
 *   - storagePath refers to the physical location of the raw bytes.
 */

const VALID_CONTENT_TYPES = Object.freeze(['pem', 'json', 'html', 'hex', 'text']);

class EvidenceDTO {
    /**
     * @param {object} params
     * @param {string} [params.evidenceId]   - UUID (auto-generated if omitted)
     * @param {string} params.schemaVersion  - e.g. '1.0'
     * @param {string} params.collectorVersion - e.g. '1.0.0'
     * @param {string} params.engineVersion  - e.g. '1.0.0'
     * @param {string} params.collectionTimestamp - ISO-8601 when evidence was captured
     * @param {string} params.hashAlgorithm  - e.g. 'sha-256'
     * @param {string} [params.futureSignature] - placeholder for Ed25519 digital signatures
     * @param {string} params.sha256Hash     - SHA-256 hex digest of the raw bytes
     * @param {string} params.storagePath    - Absolute path or S3 key to the artifact
     * @param {string} params.contentType    - 'pem'|'json'|'html'|'hex'|'text'
     * @param {string} params.engineSource   - Name of the engine that produced this evidence
     * @param {string} params.executionId    - UUID of the orchestration job
     * @param {string} [params.capturedAt]   - ISO-8601 timestamp (defaults to now)
     * @param {string} [params.storageBackend] - e.g. 'local', 's3'
     * @param {string} [params.storageVersion] - e.g. '1.0'
     * @param {string} [params.verificationStatus] - 'verified' or 'unverified'
     */
    constructor({ 
        evidenceId, schemaVersion, collectorVersion, engineVersion, 
        collectionTimestamp, hashAlgorithm, futureSignature, 
        sha256Hash, storagePath, contentType, engineSource, 
        executionId, capturedAt, storageBackend, storageVersion, verificationStatus
    }) {
        if (!schemaVersion) throw new TypeError('[EvidenceDTO] schemaVersion is required.');
        if (!collectorVersion) throw new TypeError('[EvidenceDTO] collectorVersion is required.');
        if (!engineVersion) throw new TypeError('[EvidenceDTO] engineVersion is required.');
        if (!collectionTimestamp) throw new TypeError('[EvidenceDTO] collectionTimestamp is required.');
        if (!hashAlgorithm) throw new TypeError('[EvidenceDTO] hashAlgorithm is required.');
        if (!sha256Hash || typeof sha256Hash !== 'string') {
            throw new TypeError('[EvidenceDTO] sha256Hash is required.');
        }
        if (!storagePath || typeof storagePath !== 'string') {
            throw new TypeError('[EvidenceDTO] storagePath is required.');
        }
        if (!VALID_CONTENT_TYPES.includes(contentType)) {
            throw new TypeError(`[EvidenceDTO] contentType must be one of: ${VALID_CONTENT_TYPES.join(', ')}.`);
        }
        if (!engineSource) throw new TypeError('[EvidenceDTO] engineSource is required.');
        if (!executionId)  throw new TypeError('[EvidenceDTO] executionId is required.');

        this.evidenceId          = evidenceId || randomUUID();
        this.schemaVersion       = schemaVersion;
        this.collectorVersion    = collectorVersion;
        this.engineVersion       = engineVersion;
        this.collectionTimestamp = collectionTimestamp;
        this.hashAlgorithm       = hashAlgorithm;
        this.futureSignature     = futureSignature || null;
        this.sha256Hash          = sha256Hash;
        this.storagePath         = storagePath;
        this.contentType         = contentType;
        this.engineSource        = engineSource;
        this.executionId         = executionId;
        this.capturedAt          = capturedAt || new Date().toISOString();
        this.storageBackend      = storageBackend || 'local';
        this.storageVersion      = storageVersion || '1.0';
        this.verificationStatus  = verificationStatus || 'unverified';

        const keyMaterial = `${this.engineSource}|${this.contentType}|${this.sha256Hash}`;
        this.deterministicSortKey = createHash('sha256').update(keyMaterial).digest('hex');

        Object.freeze(this);
    }
}

module.exports = { EvidenceDTO, VALID_CONTENT_TYPES };
