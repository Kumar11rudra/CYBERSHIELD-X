'use strict';

const fs        = require('fs');
const path      = require('path');
const crypto    = require('crypto');
const { randomUUID } = require('crypto');

const { IEvidenceStorage }  = require('../interfaces/IEvidenceStorage');
const { EvidenceDTO }       = require('../dtos/EvidenceDTO');
const { CsiEvidenceError, EvidenceIntegrityError }  = require('../errors/CsiErrors');

/**
 * LocalEvidenceStorage
 *
 * V1 implementation of IEvidenceStorage.
 * Stores raw bytes to the local filesystem.
 * Path pattern: {baseDir}/{YYYY-MM-DD}/{sha256}.{ext}
 *
 * Immutability guarantee:
 *   - store() computes SHA-256 from the raw bytes; callers cannot supply a hash.
 *   - No update() method exists.
 *   - delete() logs an audit event before removal.
 *
 * Future: Replace with S3EvidenceStorage — zero engine changes required.
 */
class LocalEvidenceStorage extends IEvidenceStorage {
    /**
     * @param {object} [options]
     * @param {string} [options.baseDir] - Root directory for evidence storage.
     *   Defaults to CSI_EVIDENCE_DIR env var or '{cwd}/evidence'.
     */
    constructor(options = {}) {
        super();
        this._baseDir = options.baseDir
            || process.env.CSI_EVIDENCE_DIR
            || path.join(process.cwd(), 'evidence');

        // Ensure base directory exists
        fs.mkdirSync(this._baseDir, { recursive: true });

        /** @type {Map<string, string>} in-memory index: evidenceId → absolutePath */
        this._index = new Map();
    }

    /**
     * Store raw bytes as an immutable evidence artifact.
     * @param {Buffer} data
     * @param {object} metadata
     * @returns {Promise<EvidenceDTO>}
     */
    async store(data, metadata = {}) {
        if (!Buffer.isBuffer(data)) {
            throw new CsiEvidenceError('[LocalEvidenceStorage] data must be a Buffer.');
        }

        const sha256Hash  = crypto.createHash('sha256').update(data).digest('hex');
        const evidenceId  = randomUUID();
        const contentType = metadata.contentType || 'text';
        const ext         = this._contentTypeToExt(contentType);
        const dateDir     = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
        const dirPath     = path.join(this._baseDir, dateDir);

        fs.mkdirSync(dirPath, { recursive: true });

        const filePath = path.join(dirPath, `${sha256Hash}.${ext}`);

        // Write-once: skip if identical hash already exists on disk
        if (!fs.existsSync(filePath)) {
            fs.writeFileSync(filePath, data);
        }
        
        // Read-after-write verification
        const readData = fs.readFileSync(filePath);
        const readHash = crypto.createHash('sha256').update(readData).digest('hex');
        if (readHash !== sha256Hash) {
            fs.unlinkSync(filePath);
            throw new EvidenceIntegrityError(`[LocalEvidenceStorage] Read-after-write verification failed for evidenceId: ${evidenceId}`);
        }

        const dto = new EvidenceDTO({
            evidenceId,
            schemaVersion: '1.0',
            collectorVersion: '1.0.0',
            engineVersion: metadata.engineVersion || '1.0.0',
            collectionTimestamp: new Date().toISOString(),
            hashAlgorithm: 'sha-256',
            futureSignature: null,
            sha256Hash,
            storagePath:  filePath,
            contentType,
            engineSource: metadata.engineSource || 'unknown',
            executionId:  metadata.executionId  || 'untracked',
            capturedAt:   new Date().toISOString(),
        });

        this._index.set(evidenceId, { filePath, sha256Hash });
        return dto;
    }

    /**
     * Retrieve raw bytes by evidenceId.
     * @param {string} evidenceId
     * @returns {Promise<Buffer>}
     */
    async retrieve(evidenceId) {
        const entry = this._index.get(evidenceId);
        if (!entry || !fs.existsSync(entry.filePath)) {
            throw new CsiEvidenceError(
                `[LocalEvidenceStorage] Evidence not found: ${evidenceId}`,
                { evidenceId }
            );
        }
        
        const data = fs.readFileSync(entry.filePath);
        const actualHash = crypto.createHash('sha256').update(data).digest('hex');
        
        if (actualHash !== entry.sha256Hash) {
            throw new EvidenceIntegrityError(
                `[LocalEvidenceStorage] Evidence corrupted on disk! Expected hash: ${entry.sha256Hash}, actual: ${actualHash}`
            );
        }
        
        return data;
    }

    /**
     * @param {string} evidenceId
     * @returns {Promise<boolean>}
     */
    async exists(evidenceId) {
        const entry = this._index.get(evidenceId);
        return !!(entry && fs.existsSync(entry.filePath));
    }

    /**
     * Delete an evidence artifact (GDPR compliance only).
     * Logs an audit event before deletion.
     * @param {string} evidenceId
     * @returns {Promise<void>}
     */
    async delete(evidenceId) {
        const entry = this._index.get(evidenceId);
        if (!entry) return;

        // Immutable audit log before deletion
        console.warn(`[CSI AUDIT] Evidence deleted: ${evidenceId} at ${new Date().toISOString()}`);

        if (fs.existsSync(entry.filePath)) fs.unlinkSync(entry.filePath);
        this._index.delete(evidenceId);
    }

    /**
     * Architecture Hook (Future Milestone): Sign an evidence artifact using Ed25519.
     * @param {string} evidenceId
     * @returns {Promise<string>}
     */
    async signEvidence(evidenceId) {
        if (!this._index.has(evidenceId)) {
            throw new CsiEvidenceError(`[LocalEvidenceStorage] Cannot sign unknown evidence: ${evidenceId}`);
        }
        // Architecture hook implementation pending
        return 'NOT_IMPLEMENTED_YET';
    }

    /** @param {string} contentType @returns {string} file extension */
    _contentTypeToExt(contentType) {
        const map = { pem: 'pem', json: 'json', html: 'html', hex: 'hex', text: 'txt' };
        return map[contentType] || 'bin';
    }

    /** Returns the number of stored artifacts (for diagnostics). */
    get count() { return this._index.size; }
}

module.exports = { LocalEvidenceStorage };
