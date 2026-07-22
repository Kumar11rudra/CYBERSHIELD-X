const CompositionResult = require('./CompositionResult');
const DependencyGraph = require('./DependencyGraph');
const CompositionValidator = require('./CompositionValidator');

/**
 * @module SystemComposer
 * @description Analyzes structural composition and returns a final deeply immutable validation artifact.
 */
class SystemComposer {
    /**
     * @param {Object} serviceMap - Dictionary mapping string names to their required dependency arrays.
     */
    constructor(serviceMap = {}) {
        this.serviceMap = serviceMap;
    }

    /**
     * Executes the composition validation safely.
     * @returns {CompositionResult}
     */
    compose() {
        try {
            const graph = new DependencyGraph();
            const duplicateRegistrations = [];

            // Attempt registration
            for (const [nodeId, deps] of Object.entries(this.serviceMap)) {
                try {
                    graph.register(nodeId, deps);
                } catch (err) {
                    if (err.message.includes('DuplicateRegistration')) {
                        duplicateRegistrations.push(nodeId);
                    } else {
                        throw err; // Should never happen unless structural DTO fails
                    }
                }
            }

            const validator = new CompositionValidator();
            const report = validator.validate(graph);

            const allDuplicates = [...report.duplicateRegistrations, ...duplicateRegistrations];
            const isValid = report.isValid && allDuplicates.length === 0;

            const warnings = [];
            if (report.missingDependencies.length > 0) warnings.push(`Missing dependencies: ${report.missingDependencies.join(', ')}`);
            if (report.circularDependencies.length > 0) warnings.push(`Circular dependencies: ${report.circularDependencies.join(', ')}`);
            if (allDuplicates.length > 0) warnings.push(`Duplicate registrations: ${allDuplicates.join(', ')}`);
            if (report.orphanComponents.length > 0) warnings.push(`Orphan components detected: ${report.orphanComponents.join(', ')}`);

            return new CompositionResult({
                success: isValid,
                status: isValid ? 'COMPOSITION_VALID' : 'COMPOSITION_INVALID',
                graph: graph.toStructure(),
                validation: {
                    missingDependencies: report.missingDependencies,
                    circularDependencies: report.circularDependencies,
                    duplicateRegistrations: allDuplicates,
                    orphanComponents: report.orphanComponents
                },
                warnings
            });

        } catch (error) {
            return CompositionResult.fallbackError([`Fatal composition failure: ${error.message}`]);
        }
    }
}

module.exports = SystemComposer;
