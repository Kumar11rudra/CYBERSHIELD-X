/**
 * @module EventResult
 * @description Unified response contract for event dispatching.
 */
class EventResult {
    /**
     * @param {Object} props
     * @param {boolean} props.success
     * @param {string} props.status
     * @param {Array<string>} props.completedSubscribers
     * @param {Array<string>} props.failedSubscribers
     * @param {Array<string>} props.warnings
     * @param {Object} props.metadata
     */
    constructor(props) {
        this.success = props.success ?? true;
        this.status = props.status || 'OK';
        this.completedSubscribers = props.completedSubscribers ? [...props.completedSubscribers] : [];
        this.failedSubscribers = props.failedSubscribers ? [...props.failedSubscribers] : [];
        this.warnings = props.warnings ? [...props.warnings] : [];
        this.metadata = props.metadata ? { ...props.metadata } : {};

        Object.freeze(this.completedSubscribers);
        Object.freeze(this.failedSubscribers);
        Object.freeze(this.warnings);
        Object.freeze(this.metadata);
        Object.freeze(this);
    }

    static fallbackError(reason) {
        return new EventResult({
            success: false,
            status: 'DISPATCH_ERROR',
            completedSubscribers: [],
            failedSubscribers: [],
            warnings: [reason],
            metadata: {}
        });
    }
}

module.exports = EventResult;
