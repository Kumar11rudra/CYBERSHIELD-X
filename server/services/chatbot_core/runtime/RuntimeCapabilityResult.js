/**
 * @module RuntimeCapabilityResult
 * @description Unified response signature for capability runtime boundaries.
 */
class RuntimeCapabilityResult {
    /**
     * @param {Object} props
     * @param {boolean} props.success
     * @param {string} props.status
     * @param {Object} props.data
     * @param {Array<string>} props.warnings
     * @param {Object} props.metadata
     */
    constructor(props) {
        this.success = props.success ?? true;
        this.status = props.status || 'OK';
        this.data = props.data ? { ...props.data } : {};
        this.warnings = props.warnings ? [...props.warnings] : [];
        this.metadata = props.metadata ? { ...props.metadata } : {};

        Object.freeze(this.data);
        Object.freeze(this.warnings);
        Object.freeze(this.metadata);
        Object.freeze(this);
    }

    static fallbackError(reason) {
        return new RuntimeCapabilityResult({
            success: false,
            status: 'RUNTIME_ERROR',
            warnings: [reason]
        });
    }
}

module.exports = RuntimeCapabilityResult;
