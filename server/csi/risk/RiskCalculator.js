'use strict';

const riskRuleRegistry = require('./RiskRuleRegistry');
const RiskExplanationBuilder = require('./RiskExplanationBuilder');
const RiskValidation = require('./RiskValidation');
const RiskSeverity = require('./RiskSeverity');
const { RiskFactorDTO } = require('../dtos/RiskFactorDTO');

class RiskCalculator {
    /**
     * Deterministically calculates risk from an array of findings.
     * @param {FindingDTO[]} findings 
     * @returns {object} { rawScore, normalizedScore, categories, trace, riskFactors }
     */
    static calculate(findings) {
        RiskValidation.checkDuplicateFindings(findings);

        let rawScore = 0;
        const categories = {};
        const riskFactors = [];
        const builder = new RiskExplanationBuilder();

        for (const finding of findings) {
            const rule = riskRuleRegistry.getRuleByFindingType(finding.findingType);
            
            if (!rule) {
                // Ignore unknown findings deterministically
                continue;
            }

            const previousScore = rawScore;
            rawScore += rule.weight;
            
            // Maintain category score independently (no normalization applied yet)
            if (!categories[rule.category]) {
                categories[rule.category] = 0;
            }
            categories[rule.category] += rule.weight;

            builder.addTraceStep({
                findingId: finding.findingId,
                ruleId: rule.ruleId,
                previousScore: previousScore,
                weight: rule.weight,
                newScore: rawScore,
                category: rule.category,
                severity: rule.severity
            });

            riskFactors.push(new RiskFactorDTO({
                findingId: finding.findingId,
                ruleId: rule.ruleId,
                weight: rule.weight,
                category: rule.category,
                severity: rule.severity,
                reason: `Triggered rule ${rule.ruleId} via ${finding.findingType}`,
                confidence: finding.confidence
            }));
        }

        const normalizedScore = RiskValidation.normalizeScore(rawScore);

        return {
            rawScore,
            normalizedScore,
            categories,
            trace: builder.build(),
            riskFactors
        };
    }
}

module.exports = RiskCalculator;
