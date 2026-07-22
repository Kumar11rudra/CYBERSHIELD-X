/**
 * @module DependencyGraph
 * @description Pure structural representation mapping component dependencies statelessly.
 */
class DependencyGraph {
    constructor() {
        /** @type {Map<string, Set<string>>} */
        this.nodes = new Map();
        /** @type {Set<string>} */
        this.orphans = new Set();
    }

    /**
     * Registers a node and its abstract dependency strings.
     * @param {string} nodeId 
     * @param {Array<string>} dependencies 
     */
    register(nodeId, dependencies = []) {
        if (this.nodes.has(nodeId)) {
            throw new Error(`DuplicateRegistration: ${nodeId}`);
        }
        this.nodes.set(nodeId, new Set(dependencies));
    }

    /**
     * Returns a plain structural object for freezing in DTOs.
     * @returns {Object}
     */
    toStructure() {
        const struct = {};
        for (const [id, deps] of this.nodes.entries()) {
            struct[id] = Array.from(deps);
        }
        return struct;
    }
}

module.exports = DependencyGraph;
