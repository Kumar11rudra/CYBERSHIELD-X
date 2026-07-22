'use strict';

const CorrelationRuleRegistry = require('./CorrelationRuleRegistry');
const CorrelationGraph = require('./CorrelationGraph');
const CorrelationValidation = require('./CorrelationValidation');
const CorrelationExplanationBuilder = require('./CorrelationExplanationBuilder');
const CorrelationCalculator = require('./CorrelationCalculator');
const { CorrelationResultDTO } = require('../dtos/CorrelationResultDTO');

const ENGINE_VERSION = '1.0.0';

class ThreatCorrelationEngine {
    /**
     * Executes the Threat Correlation Engine as a deterministic pure function.
     * 
     * @param {import('../dtos/FindingDTO').FindingDTO[]} findings 
     * @param {import('../dtos/RiskResultDTO').RiskResultDTO} riskResult 
     * @param {object[]} evidences 
     * @param {string} executionId 
     * @returns {CorrelationResultDTO}
     */
    static execute(findings, riskResult, evidences, executionId) {
        if (!executionId || typeof executionId !== 'string') {
            throw new TypeError('[ThreatCorrelationEngine] executionId is required');
        }

        // Initialize and validate rules. Fails-fast if configuration is invalid.
        CorrelationRuleRegistry.initialize();

        // Ensure inputs are valid and unique
        CorrelationValidation.validateInputs(findings, riskResult, evidences);

        const graph = new CorrelationGraph();
        const explanationBuilder = new CorrelationExplanationBuilder();

        // 1. Add Finding Nodes
        const findingTypes = [];
        const findingNodes = [];

        // Sort findings to ensure deterministic graph population
        const sortedFindings = [...findings].sort((a, b) => a.findingId.localeCompare(b.findingId));
        
        for (const finding of sortedFindings) {
            findingTypes.push(finding.findingType);
            const node = graph.addNode('finding', finding.findingId, { findingType: finding.findingType });
            findingNodes.push(node);
        }

        // 2. Add Risk Node
        const riskNode = graph.addNode('risk', executionId, { overallRiskScore: riskResult.overallScore });
        
        // Link findings to risk
        for (const findingNode of findingNodes) {
            graph.addEdge(findingNode.nodeId, riskNode.nodeId, 'supports');
        }

        // 3. Add Evidence Nodes
        const sortedEvidences = [...evidences].sort((a, b) => a.evidenceId.localeCompare(b.evidenceId));
        for (const ev of sortedEvidences) {
            const evNode = graph.addNode('evidence', ev.evidenceId);
            // Deterministically link evidence to finding
            const relatedFindingNode = findingNodes.find(n => n.referenceId === ev.findingId);
            if (relatedFindingNode) {
                graph.addEdge(evNode.nodeId, relatedFindingNode.nodeId, 'supports');
            }
        }

        // 4. Calculate Scores and Chaining (Adds Category nodes and edges)
        const calcResult = CorrelationCalculator.calculate(graph, explanationBuilder, findingTypes, findingNodes);

        // 5. Final Graph Validation
        CorrelationValidation.checkGraphCycles(graph);

        // 6. Build Result
        return new CorrelationResultDTO({
            overallCorrelationScore: calcResult.overallScore,
            chains: calcResult.chains,
            categories: calcResult.categories,
            nodes: graph.getNodes(), // guaranteed sorted
            edges: graph.getEdges(), // guaranteed sorted
            trace: explanationBuilder.build(),
            executionId,
            version: ENGINE_VERSION,
            timestamp: new Date().toISOString() // Only permitted timestamp attachment point
        });
    }
}

module.exports = ThreatCorrelationEngine;
