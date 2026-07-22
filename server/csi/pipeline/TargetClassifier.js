'use strict';

const { TargetDTO } = require('../dtos/TargetDTO');
const { TargetNormalizer } = require('./TargetNormalizer');

/**
 * CsiValidationError
 * Thrown when TargetClassifier cannot classify an input as a valid target type.
 */
class CsiValidationError extends Error {
    constructor(message, rawInput) {
        super(`[TargetClassifier] ${message}`);
        this.name = 'CsiValidationError';
        this.rawInput = rawInput;
    }
}

// RFC-compliant regex patterns
const PATTERNS = Object.freeze({
    // IPv4: 0.0.0.0 – 255.255.255.255
    ipv4: /^(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)\.(25[0-5]|2[0-4]\d|[01]?\d\d?)$/,

    // IPv6: full and compressed forms (post-bracket normalization)
    ipv6: /^(([0-9a-f]{1,4}:){7}[0-9a-f]{1,4}|(([0-9a-f]{1,4}:)*[0-9a-f]{1,4})?::(([0-9a-f]{1,4}:)*[0-9a-f]{1,4})?)$/i,

    // Email: simple RFC 5321 compatible
    email: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,

    // URL: must retain a path or query string component after normalization
    url: /^[a-z0-9]([a-z0-9\-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9\-]{0,61}[a-z0-9])?)*\/[^\s]*$/,

    // Domain: standard hostname regex (FQDN or apex)
    domain: /^(?!-)([a-z0-9-]{1,63}(?<!-)\.)+[a-z]{2,63}$/,
});

/**
 * TargetClassifier
 *
 * Second stage of the Target Processing Pipeline.
 * Accepts a raw input string, normalizes it via TargetNormalizer,
 * classifies it into a type, and returns an immutable TargetDTO.
 *
 * Throws CsiValidationError for unrecognizable or malformed inputs.
 */
class TargetClassifier {
    constructor() {
        this._normalizer = new TargetNormalizer();
    }

    /**
     * Normalize and classify a raw input string into a TargetDTO.
     * @param {string} rawInput - User-supplied input
     * @returns {TargetDTO}
     * @throws {CsiValidationError} If the input cannot be classified
     */
    classify(rawInput) {
        if (!rawInput || typeof rawInput !== 'string') {
            throw new CsiValidationError('Input must be a non-empty string.', rawInput);
        }

        const normalized = this._normalizer.normalize(rawInput);

        // Test in priority order: IP → Email → URL → Domain
        if (PATTERNS.ipv4.test(normalized)) {
            const parts = normalized.split('.').map(Number);
            return new TargetDTO({
                rawInput,
                normalized,
                type: 'ip',
                metadata: { version: 4, octets: parts },
            });
        }

        if (PATTERNS.ipv6.test(normalized)) {
            return new TargetDTO({
                rawInput,
                normalized,
                type: 'ip',
                metadata: { version: 6 },
            });
        }

        if (PATTERNS.email.test(normalized)) {
            const [local, domainPart] = normalized.split('@');
            return new TargetDTO({
                rawInput,
                normalized,
                type: 'email',
                metadata: { local, domain: domainPart },
            });
        }

        if (PATTERNS.url.test(normalized)) {
            const slashIdx = normalized.indexOf('/');
            const host = normalized.substring(0, slashIdx);
            const path = normalized.substring(slashIdx);
            const dotParts = host.split('.');
            const tld = dotParts[dotParts.length - 1];
            const apexDomain = dotParts.slice(-2).join('.');
            return new TargetDTO({
                rawInput,
                normalized,
                type: 'url',
                metadata: { host, path, tld, apexDomain },
            });
        }

        if (PATTERNS.domain.test(normalized)) {
            const parts = normalized.split('.');
            const tld = parts[parts.length - 1];
            const apexDomain = parts.slice(-2).join('.');
            return new TargetDTO({
                rawInput,
                normalized,
                type: 'domain',
                metadata: { tld, apexDomain, labels: parts },
            });
        }

        throw new CsiValidationError(
            `Cannot classify input as IP, domain, URL, or email: "${normalized}"`,
            rawInput
        );
    }
}

module.exports = { TargetClassifier, CsiValidationError, PATTERNS };
