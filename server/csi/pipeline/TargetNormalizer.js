'use strict';

/**
 * TargetNormalizer
 *
 * First stage of the Target Processing Pipeline.
 * Accepts raw user input (string) and returns a clean, normalized string.
 *
 * Rules:
 *   - Does NOT classify the type (that is TargetClassifier's responsibility).
 *   - Does NOT validate input correctness (Classifier validates).
 *   - Is pure — no side effects, no I/O, no state.
 *
 * Normalization steps (applied in order):
 *   1. Trim leading/trailing whitespace.
 *   2. Lowercase (domains and emails are case-insensitive).
 *   3. Strip URL scheme (http://, https://, ftp://).
 *   4. Strip trailing slashes for domain extraction.
 *   5. Strip port from domain-only input (e.g., example.com:8080 → example.com).
 *   6. Normalize IPv6 brackets: [::1] → ::1.
 */
class TargetNormalizer {
    /**
     * Normalize a raw input string.
     * @param {string} rawInput
     * @returns {string} Normalized string
     * @throws {TypeError} If rawInput is not a non-empty string
     */
    normalize(rawInput) {
        if (!rawInput || typeof rawInput !== 'string') {
            throw new TypeError('[TargetNormalizer] Input must be a non-empty string.');
        }

        let value = rawInput.trim();

        // Lowercase (safe for IPs, domains, emails, URLs)
        value = value.toLowerCase();

        // Strip URL scheme (http://, https://, ftp://, etc.)
        value = value.replace(/^[a-z][a-z0-9+\-.]*:\/\//, '');

        // Strip a trailing slash only when it is the sole path character
        // (e.g. "example.com/" → "example.com") but leave "/path" intact
        value = value.replace(/\/$/, '');

        // If value still has an internal slash it is a URL (has path/query)
        const hasPath = value.includes('/');

        if (!hasPath) {
            // Strip port suffix from bare domain/IP (example.com:8080 → example.com)
            // but only when there's no path — port in URL context is preserved
            value = value.replace(/:(\d+)$/, '');
        }

        // Normalize IPv6 bracket notation: [::1] → ::1
        value = value.replace(/^\[([^\]]+)]$/, '$1');

        return value;
    }
}

module.exports = { TargetNormalizer };
