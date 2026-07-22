/**
 * @module CapabilityAuthorizationResult
 * @description Immutable DTO defining the result of capability authorization.
 */
class CapabilityAuthorizationResult {
    /**
     * @param {Object} data 
     * @param {boolean} data.success
     * @param {boolean} data.isGranted
     * @param {string} data.reason
     * @param {Object} data.capabilityMetadata
     */
    constructor({ success, isGranted, reason, capabilityMetadata = null }) {
        this.success = Boolean(success);
        this.isGranted = Boolean(isGranted);
        this.reason = reason || '';
        this.capabilityMetadata = capabilityMetadata ? Object.freeze({ ...capabilityMetadata }) : null;
        Object.freeze(this);
    }
}
module.exports = CapabilityAuthorizationResult;
