const DependencyHealthReport = require('./DependencyHealthReport');

/**
 * @module HealthCheckService
 * @description Orchestrates health checks strictly for readiness pings.
 */
class HealthCheckService {
    /**
     * @param {import('../providers/storage/IStorageProvider')} storageProvider 
     */
    constructor(storageProvider) {
        this.storageProvider = storageProvider;
    }

    async checkHealth() {
        const warnings = [];
        const errors = [];
        const components = {};

        try {
            // Use Promise.race to enforce a hard timeout on the health ping
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Storage health ping timed out')), 2000)
            );
            
            // Assuming storageProvider has an initialization or liveness check logic mapped
            // Here we safely call a harmless operation or just check status
            const connectPromise = this.storageProvider.connect ? this.storageProvider.connect() : Promise.resolve({ success: true, connected: true });
            
            const storageResult = await Promise.race([connectPromise, timeoutPromise]);
            
            if (storageResult && storageResult.success) {
                components.storage = 'HEALTHY';
            } else {
                components.storage = 'UNHEALTHY';
                errors.push(`Storage provider reported unhealthy: ${storageResult.status || 'Unknown error'}`);
            }
        } catch (err) {
            components.storage = 'UNHEALTHY';
            errors.push(`Storage provider health check failed: ${err.message}`);
        }

        return new DependencyHealthReport({
            success: errors.length === 0,
            status: errors.length === 0 ? 'READY' : 'DEGRADED',
            components,
            warnings,
            errors
        });
    }
}

module.exports = HealthCheckService;
