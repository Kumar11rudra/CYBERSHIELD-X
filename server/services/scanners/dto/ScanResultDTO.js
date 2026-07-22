/**
 * @module ScanResultDTO
 * @description Immutable DTO representing structured findings normalized from raw scanner output.
 */
class ScanResultDTO {
    /**
     * @param {Object} data
     * @param {string} data.scannerId - The ID of the scanner that produced this result.
     * @param {boolean} data.success - Whether the scan executed successfully.
     * @param {string} [data.target] - The target of the scan.
     * @param {Object|Array} data.findings - Structured findings (e.g., open ports, vulnerabilities).
     * @param {string} [data.rawOutput] - Original raw output (stdout).
     * @param {string} [data.error] - Error message if execution failed.
     */
    constructor(data) {
        if (!data || !data.scannerId || typeof data.success !== 'boolean') {
            throw new Error('ScanResultDTO requires scannerId and success flag');
        }

        this.scannerId = data.scannerId;
        this.success = data.success;
        this.target = data.target || 'Unknown Target';
        this.findings = Array.isArray(data.findings) ? [...data.findings] : { ...data.findings };
        this.rawOutput = data.rawOutput || null;
        this.error = data.error || null;

        Object.freeze(this.findings);
        Object.freeze(this);
    }
}

module.exports = ScanResultDTO;
