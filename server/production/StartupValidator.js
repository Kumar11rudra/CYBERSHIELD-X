const ReadinessReport = require('./ReadinessReport');
const EnvironmentValidator = require('./EnvironmentValidator');
const ConfigurationValidator = require('./ConfigurationValidator');
const ReleaseValidator = require('./ReleaseValidator');
const HealthCheckService = require('./HealthCheckService');

/**
 * @module StartupValidator
 * @description The primary facade orchestration pre-flight production checks.
 */
class StartupValidator {
    /**
     * @param {Object} deps
     * @param {Object} deps.envConfigProvider
     * @param {Object} deps.storageProvider
     * @param {Object} deps.compositionResult
     */
    constructor(deps) {
        this.envValidator = new EnvironmentValidator(deps.envConfigProvider);
        this.configValidator = new ConfigurationValidator(deps.envConfigProvider);
        this.releaseValidator = new ReleaseValidator(deps.compositionResult);
        this.healthCheck = new HealthCheckService(deps.storageProvider);
    }

    /**
     * Orchestrates the startup validation sequences safely.
     * @param {Array<string>} requiredEnvKeys
     * @returns {Promise<ReadinessReport>}
     */
    async validateStartup(requiredEnvKeys = ['NODE_ENV']) {
        const warnings = [];
        const errors = [];

        // 1. Validate Environment
        let envResult = { success: false, environment: {} };
        try {
            envResult = this.envValidator.validate(requiredEnvKeys);
            if (!envResult.success) errors.push(...(envResult.errors || []));
        } catch (err) {
            errors.push(`Environment validation crashed: ${err.message}`);
        }

        // 2. Validate Configuration
        let configResult = { success: false, configuration: {} };
        try {
            configResult = this.configValidator.validate();
            if (configResult.warnings) warnings.push(...configResult.warnings);
            if (!configResult.success) errors.push(...(configResult.errors || []));
        } catch (err) {
            errors.push(`Configuration validation crashed: ${err.message}`);
        }

        // 3. Validate Release & Composition Graph
        let releaseResult = { success: false, dependencies: {} };
        try {
            releaseResult = this.releaseValidator.validate();
            if (releaseResult.warnings) warnings.push(...releaseResult.warnings);
            if (!releaseResult.success) errors.push(...(releaseResult.errors || []));
        } catch (err) {
            errors.push(`Release validation crashed: ${err.message}`);
        }

        // 4. Validate Provider Health
        let healthResult = { success: false, components: {} };
        try {
            healthResult = await this.healthCheck.checkHealth();
            if (healthResult.warnings) warnings.push(...healthResult.warnings);
            if (!healthResult.success) errors.push(...(healthResult.errors || []));
        } catch (err) {
            errors.push(`Health check crashed: ${err.message}`);
        }

        const isDeployable = envResult.success && configResult.success && releaseResult.success && healthResult.success;

        return new ReadinessReport({
            isDeployable,
            environment: envResult.environment,
            configuration: configResult.configuration,
            dependencies: releaseResult.dependencies,
            health: healthResult.components,
            warnings,
            errors
        });
    }
}

module.exports = StartupValidator;
