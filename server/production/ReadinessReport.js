/**
 * @module ReadinessReport
 * @description Immutable DTO representing the comprehensive startup readiness of the system.
 */
class ReadinessReport {
    constructor(props) {
        this.isDeployable = props.isDeployable ?? false;
        this.environment = props.environment || {};
        this.configuration = props.configuration || {};
        this.dependencies = props.dependencies || {};
        this.health = props.health || {};
        this.warnings = props.warnings ? [...props.warnings] : [];
        this.errors = props.errors ? [...props.errors] : [];
        this.metadata = props.metadata || { generatedAt: Date.now() };

        Object.freeze(this.environment);
        Object.freeze(this.configuration);
        Object.freeze(this.dependencies);
        Object.freeze(this.health);
        Object.freeze(this.warnings);
        Object.freeze(this.errors);
        Object.freeze(this.metadata);
        Object.freeze(this);
    }
}

module.exports = ReadinessReport;
