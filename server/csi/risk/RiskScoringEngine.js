'use strict';

const { randomUUID } = require('crypto');
const RiskWeights = require('./RiskWeights');
const RiskRuleRegistry = require('./RiskRuleRegistry');
const RiskCategory = require('./RiskCategory');
const RiskSeverity = require('./RiskSeverity');
const RiskCalculator = require('./RiskCalculator');
const { RiskResultDTO } = require('../dtos/RiskResultDTO');

// Initialize caches synchronously at module load time to fail fast per rules
RiskWeights.initialize();
RiskRuleRegistry.initialize(RiskCategory.getAllowedCategories());

const RISK_ENGINE_VERSION = '1.0.0';

class RiskScoringEngine {
    /**
     * Executes the risk scoring deterministically from finding DTOs.
     * @param {FindingDTO[]} findings 
     * @param {string} executionId 
     * @returns {RiskResultDTO}
     */
    static execute(findings, executionId) {
        if (!Array.isArray(findings)) {
            throw new TypeError('[RiskScoringEngine] Input must be an array of FindingDTO');
        }
        if (!executionId || typeof executionId !== 'string') {
            throw new TypeError('[RiskScoringEngine] executionId is required');
        }

        const calculationResult = RiskCalculator.calculate(findings);

        const overallSeverity = RiskSeverity.mapScoreToSeverity(calculationResult.normalizedScore);

        return new RiskResultDTO({
            overallScore: calculationResult.normalizedScore,
            overallSeverity: overallSeverity,
            categories: calculationResult.categories,
            riskFactors: calculationResult.riskFactors,
            calculationTrace: calculationResult.trace,
            version: RISK_ENGINE_VERSION,
            executionId: executionId,
            timestamp: new Date().toISOString()
        });
    }
}

module.exports = RiskScoringEngine;
