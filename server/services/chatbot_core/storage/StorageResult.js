/**
 * @module StorageResult
 * @description Immutable DTO representing the outcome of a storage orchestration sequence.
 */
class StorageResult {
    /**
     * @param {Object} props
     * @param {boolean} props.success
     * @param {string} props.status
     * @param {Array<string>} props.warnings
     * @param {number} props.durationMs
     */
    constructor(props) {
        this.success = props.success ?? true;
        this.status = props.status || 'OK';
        this.warnings = props.warnings ? [...props.warnings] : [];
        this.durationMs = props.durationMs || 0;

        Object.freeze(this.warnings);
        Object.freeze(this);
    }
}

module.exports = StorageResult;
