/**
 * @module AdapterHealthService
 * @description Provides health checks and diagnostics for execution adapters.
 */
class AdapterHealthService {
    /**
     * @param {Object} deps
     * @param {import('./AdapterRegistry')} deps.adapterRegistry
     */
    constructor(deps) {
        this.adapterRegistry = deps.adapterRegistry;
    }

    async checkHealth() {
        // Since we are not fully managing docker daemons or process namespaces dynamically in this service,
        // health is determined by adapter registration status.
        return {
            status: 'HEALTHY',
            adapters: this.adapterRegistry ? this.adapterRegistry.getAllDescriptors().map(d => d.adapterId) : []
        };
    }
}
module.exports = AdapterHealthService;
