/**
 * @module AuditMetadata
 * @description Immutable standard metadata for an audit event.
 */
class AuditMetadata {
    /**
     * @param {Object} props
     * @param {string} props.executionId
     * @param {string} props.capabilityId
     * @param {number} props.timestamp
     */
    constructor(props) {
        this.executionId = props.executionId || `audit-exec-${Date.now()}`;
        this.capabilityId = props.capabilityId || 'system';
        this.timestamp = props.timestamp || Date.now();
        this.providerInfo = props.providerInfo || {};
        
        Object.freeze(this);
    }
}

module.exports = AuditMetadata;
