/**
 * @module PluginResult
 * @description Standard response for plugin lifecycle and loading operations.
 */
class PluginResult {
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
        return new PluginResult({
            success: false,
            status: 'PLUGIN_ERROR',
            warnings: [reason]
        });
    }
}

module.exports = PluginResult;
