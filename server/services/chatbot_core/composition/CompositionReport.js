/**
 * @module CompositionReport
 * @description Internal DTO converting validator output into structured datasets.
 */
class CompositionReport {
    /**
     * @param {Object} props
     * @param {Array<string>} props.missingDependencies
     * @param {Array<string>} props.circularDependencies
     * @param {Array<string>} props.duplicateRegistrations
     * @param {Array<string>} props.orphanComponents
     * @param {boolean} props.isValid
     */
    constructor(props) {
        this.missingDependencies = props.missingDependencies ? [...props.missingDependencies] : [];
        this.circularDependencies = props.circularDependencies ? [...props.circularDependencies] : [];
        this.duplicateRegistrations = props.duplicateRegistrations ? [...props.duplicateRegistrations] : [];
        this.orphanComponents = props.orphanComponents ? [...props.orphanComponents] : [];
        this.isValid = props.isValid ?? true;

        Object.freeze(this.missingDependencies);
        Object.freeze(this.circularDependencies);
        Object.freeze(this.duplicateRegistrations);
        Object.freeze(this.orphanComponents);
        Object.freeze(this);
    }
}

module.exports = CompositionReport;
