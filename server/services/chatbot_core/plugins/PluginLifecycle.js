const PluginResult = require('./PluginResult');

/**
 * @module PluginLifecycle
 * @description Defines lifecycle contracts. No real logic allowed. Returns PluginResult.
 */
class PluginLifecycle {
    /**
     * @param {import('./PluginContext')} context 
     * @returns {Promise<PluginResult>}
     */
    async initialize(context) {
        return new PluginResult({ success: true, status: 'INITIALIZED' });
    }

    /**
     * @param {import('./PluginContext')} context 
     * @returns {Promise<PluginResult>}
     */
    async activate(context) {
        return new PluginResult({ success: true, status: 'ACTIVATED' });
    }

    /**
     * @param {import('./PluginContext')} context 
     * @returns {Promise<PluginResult>}
     */
    async deactivate(context) {
        return new PluginResult({ success: true, status: 'DEACTIVATED' });
    }

    /**
     * @param {import('./PluginContext')} context 
     * @returns {Promise<PluginResult>}
     */
    async dispose(context) {
        return new PluginResult({ success: true, status: 'DISPOSED' });
    }
}

module.exports = PluginLifecycle;
