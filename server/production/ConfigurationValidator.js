/**
 * @module ConfigurationValidator
 * @description Validates application configuration consistency without side effects.
 */
class ConfigurationValidator {
    constructor(envConfigProvider) {
        this.config = envConfigProvider;
    }

    validate() {
        const warnings = [];
        const errors = [];
        
        const env = this.config.get('NODE_ENV', 'development');
        if (env !== 'production' && env !== 'development' && env !== 'test') {
            warnings.push(`Unrecognized NODE_ENV value: ${env}`);
        }

        return {
            success: errors.length === 0,
            configuration: {
                nodeEnv: env
            },
            warnings,
            errors
        };
    }
}

module.exports = ConfigurationValidator;
