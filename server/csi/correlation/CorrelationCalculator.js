'use strict';

const CorrelationRuleRegistry = require('./CorrelationRuleRegistry');
const CorrelationValidation = require('./CorrelationValidation');

class CorrelationCalculator {
    /**
     * @param {import('./CorrelationGraph')} graph
     * @param {import('./CorrelationExplanationBuilder')} explanationBuilder
     * @param {Array} findingTypes - Pre-extracted array of finding types present
     * @param {Array} findingNodes - Pre-extracted finding nodes for ID references
     */
    static calculate(graph, explanationBuilder, findingTypes, findingNodes) {
        let overallScore = 0;
        const categories = {};
        const chains = [];

        const availableFindingTypes = new Set(findingTypes);
        
        // Ensure rules are sorted deterministically by ruleId before evaluating
        const rules = CorrelationRuleRegistry.getAllRules().sort((a, b) => a.ruleId.localeCompare(b.ruleId));

        for (const rule of rules) {
            // Check if all required findings for this rule are present
            const isMatch = rule.requiredFindings.every(findingType => availableFindingTypes.has(findingType));

            if (isMatch) {
                const previousScore = overallScore;
                overallScore += rule.weight;
                
                // Track category score
                categories[rule.category] = (categories[rule.category] || 0) + rule.weight;

                chains.push({
                    ruleId: rule.ruleId,
                    score: rule.weight
                });

                // Find the exact finding IDs that matched to build trace
                const matchedFindingIds = findingNodes
                    .filter(node => rule.requiredFindings.includes(node.metadata.findingType))
                    .map(node => node.referenceId)
                    .sort(); // sort for determinism

                explanationBuilder.addTraceStep({
                    ruleId: rule.ruleId,
                    findingIds: matchedFindingIds,
                    previousScore,
                    weight: rule.weight,
                    newScore: overallScore,
                    category: rule.category,
                    reasonCode: rule.reasonCode
                });

                // Construct graph edges for this rule
                const categoryNode = graph.addNode('category', rule.category);
                for (const node of findingNodes) {
                    if (rule.requiredFindings.includes(node.metadata.findingType)) {
                        graph.addEdge(node.nodeId, categoryNode.nodeId, rule.edgeType);
                    }
                }
            }
        }

        CorrelationValidation.validateScore(overallScore);

        return {
            overallScore,
            categories,
            chains
        };
    }
}

module.exports = CorrelationCalculator;
