/**
 * @module ScanProfileDTO
 * @description Immutable DTO representing a normalized execution plan for a scanner provider.
 */
class ScanProfileDTO {
    /**
     * @param {Object} data
     * @param {string} data.target - The target IP, domain, or URL.
     * @param {string[]} data.arguments - Array of strictly validated command-line arguments.
     * @param {number} [data.timeout] - Timeout in milliseconds.
     * @param {Object} [data.env] - Environment variables required by the scanner.
     */
    constructor(data) {
        if (!data || !data.target || !Array.isArray(data.arguments)) {
            throw new Error('ScanProfileDTO requires a valid target and an array of arguments');
        }

        this.target = data.target;
        this.arguments = [...data.arguments];
        this.timeout = data.timeout || 60000;
        this.env = data.env ? { ...data.env } : {};

        Object.freeze(this.arguments);
        Object.freeze(this.env);
        Object.freeze(this);
    }
}

module.exports = ScanProfileDTO;
