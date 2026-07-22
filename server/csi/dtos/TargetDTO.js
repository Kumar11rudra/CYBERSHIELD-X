'use strict';

/**
 * TargetDTO
 *
 * Immutable representation of a normalized, classified intelligence target.
 * Created exclusively by TargetClassifier — never by controllers or engines.
 *
 * Invariants:
 *   - Frozen via Object.freeze() — mutation throws TypeError in strict mode.
 *   - `type` is always one of the VALID_TYPES enum values.
 *   - `normalized` is always lowercase, trimmed, and protocol-stripped.
 */

const VALID_TYPES = Object.freeze(['ip', 'domain', 'url', 'email']);

class TargetDTO {
    /**
     * @param {object} params
     * @param {string} params.rawInput    - Original user input (preserved for forensics)
     * @param {string} params.normalized  - Cleaned, lowercase value
     * @param {'ip'|'domain'|'url'|'email'} params.type
     * @param {object} [params.metadata]  - Type-specific extras: { tld, apexDomain, port, path }
     */
    constructor({ rawInput, normalized, type, metadata = {} }) {
        if (!rawInput || typeof rawInput !== 'string') {
            throw new TypeError('[TargetDTO] rawInput must be a non-empty string.');
        }
        if (!normalized || typeof normalized !== 'string') {
            throw new TypeError('[TargetDTO] normalized must be a non-empty string.');
        }
        if (!VALID_TYPES.includes(type)) {
            throw new TypeError(`[TargetDTO] type must be one of: ${VALID_TYPES.join(', ')}.`);
        }

        this.rawInput   = rawInput;
        this.normalized = normalized;
        this.type       = type;
        this.metadata   = Object.freeze({ ...metadata });

        Object.freeze(this);
    }

    /**
     * Returns true if this target is a domain or derivable domain (url).
     */
    isDomain() {
        return this.type === 'domain' || this.type === 'url';
    }

    /**
     * Returns true if this target is an IP address.
     */
    isIp() {
        return this.type === 'ip';
    }
}

module.exports = { TargetDTO, VALID_TYPES };
