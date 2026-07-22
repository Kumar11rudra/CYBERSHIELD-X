const CompositionReport = require('./CompositionReport');

/**
 * @module CompositionValidator
 * @description Validator scanning the DependencyGraph structurally without throwing exceptions.
 */
class CompositionValidator {
    /**
     * Validates a purely structural graph.
     * @param {import('./DependencyGraph')} graph 
     * @returns {import('./CompositionReport')}
     */
    validate(graph) {
        const missingDeps = [];
        const circularDeps = [];
        const orphanComponents = [];
        
        // Track targets to find orphans (registered but never depended on, excluding roots)
        const allDependedUpon = new Set();
        
        // Simple Missing Dependency check
        for (const [nodeId, deps] of graph.nodes.entries()) {
            for (const dep of deps) {
                if (!graph.nodes.has(dep)) {
                    missingDeps.push(`${nodeId} -> ${dep}`);
                }
                allDependedUpon.add(dep);
            }
        }

        // Circular Dependency DFS Check
        const visited = new Set();
        const stack = new Set();

        const dfs = (nodeId) => {
            if (stack.has(nodeId)) {
                circularDeps.push(nodeId);
                return true;
            }
            if (visited.has(nodeId)) {
                return false;
            }

            visited.add(nodeId);
            stack.add(nodeId);

            const deps = graph.nodes.get(nodeId) || new Set();
            for (const dep of deps) {
                if (graph.nodes.has(dep)) {
                    dfs(dep);
                }
            }

            stack.delete(nodeId);
            return false;
        };

        for (const nodeId of graph.nodes.keys()) {
            if (!visited.has(nodeId)) {
                dfs(nodeId);
            }
        }

        // Orphan Check (Arbitrary heuristic: if it's not 'SystemRoot' or 'SystemComposer' and nobody depends on it)
        const roots = new Set(['SystemComposer', 'SystemRoot']);
        for (const nodeId of graph.nodes.keys()) {
            if (!roots.has(nodeId) && !allDependedUpon.has(nodeId)) {
                orphanComponents.push(nodeId);
            }
        }

        return new CompositionReport({
            missingDependencies: missingDeps,
            circularDependencies: circularDeps,
            orphanComponents,
            isValid: missingDeps.length === 0 && circularDeps.length === 0
        });
    }
}

module.exports = CompositionValidator;
