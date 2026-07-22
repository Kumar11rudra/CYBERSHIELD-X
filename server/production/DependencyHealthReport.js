/**
 * @module DependencyHealthReport
 * @description Immutable DTO for dependency graph and provider health check states.
 */
class DependencyHealthReport {
    constructor(props) {
        this.success = props.success ?? false;
        this.status = props.status || 'UNKNOWN';
        this.components = props.components || {};
        this.warnings = props.warnings ? [...props.warnings] : [];
        this.errors = props.errors ? [...props.errors] : [];

        Object.freeze(this.components);
        Object.freeze(this.warnings);
        Object.freeze(this.errors);
        Object.freeze(this);
    }
}

module.exports = DependencyHealthReport;
