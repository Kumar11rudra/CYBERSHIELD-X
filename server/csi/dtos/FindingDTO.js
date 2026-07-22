'use strict';

const { randomUUID, createHash } = require('crypto');

/**
 * FindingDTO
 *
 * Immutable representation of a single intelligence finding produced by an engine.
 *
 * Traceability fields (mandatory per ADR-005):
 *   - engineVersion:    Semantic version of the engine that produced this finding.
 *   - collectionTime:   ISO-8601 timestamp when raw data was collected.
 *   - executionId:      UUID of the orchestration job.
 *   - evidenceHash:     SHA-256 of the linked evidence artifact (forensic proof).
 *
 * Invariants:
 *   - Frozen via Object.freeze().
 *   - AI layer cannot add, remove, or modify findings.
 *   - weight is used deterministically by RiskScoringEngine.
 */

const VALID_SEVERITIES = Object.freeze(['critical', 'high', 'medium', 'low', 'info']);
const VALID_CONFIDENCE_METHODS = Object.freeze(['protocol', 'heuristic', 'deterministic']);

class FindingDTO {
    /**
     * @param {object} params
     * @param {string} [params.findingId]      - UUID (auto-generated if omitted)
     * @param {string} params.engineSource     - Name of engine that produced this finding
     * @param {string} params.engineVersion    - Semantic version of that engine (e.g. '1.0.0')
     * @param {string} params.findingType      - Machine-readable type (e.g. 'missing_hsts')
     * @param {'critical'|'high'|'medium'|'low'|'info'} params.severity
     * @param {number} params.weight           - 0–100, used by RiskScoringEngine
     * @param {number} params.confidence       - 0.0–1.0, precision of finding
     * @param {string} params.confidenceSource - e.g. 'regex', 'header', 'dns_response'
     * @param {'protocol'|'heuristic'|'deterministic'} params.confidenceMethod
     * @param {object} params.detail           - Engine-specific structured data (always an object)
     * @param {string[]} [params.evidenceIds]  - Array of EvidenceDTO UUIDs
     * @param {string} params.evidenceHash     - SHA-256 of the primary evidence artifact
     * @param {string} params.executionId      - UUID of the orchestration job
     * @param {string} [params.collectionTime] - ISO-8601 when raw data was collected (defaults to now)
     * @param {string} [params.discoveredAt]   - ISO-8601 when finding was created (defaults to now)
     */
    constructor({
        findingId, engineSource, engineVersion, findingType, severity,
        weight, confidence, confidenceSource, confidenceMethod,
        detail, evidenceIds = [], evidenceHash, executionId,
        collectionTime, discoveredAt
    }) {
        if (!engineSource)      throw new TypeError('[FindingDTO] engineSource is required.');
        if (!engineVersion)     throw new TypeError('[FindingDTO] engineVersion is required.');
        if (!findingType)       throw new TypeError('[FindingDTO] findingType is required.');
        if (!VALID_SEVERITIES.includes(severity)) {
            throw new TypeError(`[FindingDTO] severity must be one of: ${VALID_SEVERITIES.join(', ')}.`);
        }
        if (typeof weight !== 'number' || weight < 0 || weight > 100) {
            throw new TypeError('[FindingDTO] weight must be a number between 0 and 100.');
        }
        if (typeof confidence !== 'number' || confidence < 0 || confidence > 1) {
            throw new TypeError('[FindingDTO] confidence must be a number between 0.0 and 1.0.');
        }
        if (!confidenceSource || typeof confidenceSource !== 'string') {
            throw new TypeError('[FindingDTO] confidenceSource is required as a string.');
        }
        if (!VALID_CONFIDENCE_METHODS.includes(confidenceMethod)) {
            throw new TypeError(`[FindingDTO] confidenceMethod must be one of: ${VALID_CONFIDENCE_METHODS.join(', ')}.`);
        }
        if (!detail || typeof detail !== 'object') {
            throw new TypeError('[FindingDTO] detail must be an object.');
        }
        if (!evidenceHash)      throw new TypeError('[FindingDTO] evidenceHash is required.');
        if (!executionId)       throw new TypeError('[FindingDTO] executionId is required.');

        this.findingId        = findingId || randomUUID();
        this.engineSource     = engineSource;
        this.engineVersion    = engineVersion;
        this.findingType      = findingType;
        this.severity         = severity;
        this.weight           = weight;
        this.confidence       = confidence;
        this.confidenceSource = confidenceSource;
        this.confidenceMethod = confidenceMethod;
        this.detail           = Object.freeze({ ...detail });
        this.evidenceIds      = Object.freeze([...evidenceIds]);
        this.evidenceHash     = evidenceHash;
        this.executionId      = executionId;
        this.collectionTime   = collectionTime || new Date().toISOString();
        this.discoveredAt     = discoveredAt   || new Date().toISOString();

        const keyMaterial = `${this.engineSource}|${this.findingType}|${this.severity}|${this.evidenceHash}|${JSON.stringify(this.detail)}`;
        this.deterministicSortKey = createHash('sha256').update(keyMaterial).digest('hex');

        Object.freeze(this);
    }
}

module.exports = { FindingDTO, VALID_SEVERITIES, VALID_CONFIDENCE_METHODS };
