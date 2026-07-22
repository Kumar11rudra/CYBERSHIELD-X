/**
 * @module SecurityFindingDTO
 * @description Standard model for a single security finding from a scanner.
 */
class SecurityFindingDTO {
    /**
     * @param {Object} data 
     * @param {string} data.id - Unique identifier for this finding.
     * @param {string} data.scannerId - Source scanner ID (e.g. 'nmap').
     * @param {string} data.type - 'port', 'vulnerability', 'misconfiguration', 'information'.
     * @param {string} data.title - Short description.
     * @param {string} data.description - Detailed description.
     * @param {string} data.target - The affected target/asset.
     * @param {Object} [data.metadata] - Raw/scanner-specific fields.
     */
    constructor(data) {
        if (!data.id || !data.scannerId || !data.type || !data.title || !data.target) {
            throw new Error('SecurityFindingDTO missing required fields');
        }

        this.id = data.id;
        this.scannerId = data.scannerId;
        this.type = data.type;
        this.title = data.title;
        this.description = data.description || '';
        this.target = data.target;
        this.metadata = data.metadata ? { ...data.metadata } : {};

        Object.freeze(this.metadata);
        Object.freeze(this);
    }
}
module.exports = SecurityFindingDTO;
