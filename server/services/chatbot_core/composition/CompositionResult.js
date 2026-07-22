/**
 * @module CompositionResult
 * @description Standard deeply immutable response DTO for system composition validation.
 */
class CompositionResult {
    /**
     * @param {Object} props 
     * @param {boolean} props.success
     * @param {Object} props.graph
     * @param {Object} props.validation
     * @param {Array<string>} props.warnings
     * @param {Object} props.metadata
     */
    constructor(props) {
        this.success = props.success ?? true;
        this.graph = props.graph ? { ...props.graph } : {};
        this.validation = props.validation ? { ...props.validation } : {};
        this.warnings = props.warnings ? [...props.warnings] : [];
        this.metadata = props.metadata ? { ...props.metadata } : {};

        Object.freeze(this.graph);
        Object.freeze(this.validation);
        Object.freeze(this.warnings);
        Object.freeze(this.metadata);
        Object.freeze(this);
    }

    static fallbackError(warnings = []) {
        return new CompositionResult({
            success: false,
            warnings
        });
    }
}

module.exports = CompositionResult;
