/**
 * @module PluginContext
 * @description Immutable context passed into plugins during lifecycle events.
 */
class PluginContext {
    /**
     * @param {Object} props
     * @param {string} props.environment
     * @param {Object} props.config
     */
    constructor(props) {
        this.environment = props.environment || 'production';
        this.config = props.config ? { ...props.config } : {};

        Object.freeze(this.config);
        Object.freeze(this);
    }
}

module.exports = PluginContext;
