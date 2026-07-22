/**
 * @module EnvironmentValidator
 * @description Validates presence of necessary environment variables safely.
 */
class EnvironmentValidator {
    constructor(envConfigProvider) {
        this.config = envConfigProvider;
    }

    validate(requiredKeys = ['NODE_ENV']) {
        const errors = [];
        const environment = {};

        requiredKeys.forEach(key => {
            const hasKey = this.config.has(key);
            environment[key] = hasKey ? 'PRESENT' : 'MISSING';
            if (!hasKey) {
                errors.push(`Missing required environment variable: ${key}`);
            }
        });

        return {
            success: errors.length === 0,
            environment,
            errors
        };
    }
}

module.exports = EnvironmentValidator;
