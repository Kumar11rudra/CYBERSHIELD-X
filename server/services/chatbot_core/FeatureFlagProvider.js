/**
 * @module FeatureFlagProvider
 * @description Lightweight in-memory feature flag provider for RuntimePipeline.
 */
class FeatureFlagProvider {
    constructor(initialFlags = {}) {
        this.flags = {
            'RuntimePipeline': true,
            'Governance': true,
            'Safety': true,
            'CapabilityLayer': true,
            'Metrics': true,
            'Tracing': true,
            'Hooks': true,
            ...initialFlags
        };
    }

    /**
     * Checks if a flag is enabled.
     * @param {string} flagName
     * @returns {boolean}
     */
    isEnabled(flagName) {
        return !!this.flags[flagName];
    }
}

module.exports = FeatureFlagProvider;
