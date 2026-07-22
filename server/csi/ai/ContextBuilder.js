'use strict';

class ContextBuilder {
    /**
     * @param {Array} findings 
     * @param {Object} riskResult 
     * @param {Object} correlationResult 
     * @returns {string} Serialized context for the LLM
     */
    static build(findings, riskResult, correlationResult) {
        // Deterministic ordering by ID to prevent regression drift
        const sortedFindings = [...findings].sort((a, b) => a.findingId.localeCompare(b.findingId));
        
        // Strip out forbidden fields or overly verbose execution traces from risk/correlation
        const cleanRisk = {
            overallScore: riskResult.overallScore,
            overallSeverity: riskResult.overallSeverity,
            categories: riskResult.categories,
            // we omit executionId and timestamp intentionally to prevent contextual drift
        };

        const cleanCorrelation = {
            overallCorrelationScore: correlationResult.overallCorrelationScore,
            categories: correlationResult.categories,
            chains: correlationResult.chains,
            // we omit trace to save tokens, and chains have enough info
        };

        const contextObj = {
            findings: sortedFindings.map(f => ({
                findingId: f.findingId,
                findingType: f.findingType,
                severity: f.severity,
                evidenceHash: f.evidenceHash
            })),
            risk: cleanRisk,
            correlation: cleanCorrelation
        };

        const serialized = JSON.stringify(contextObj);
        
        // Ensure token budget (simple length check for now, can be improved to actual tokenizer)
        if (serialized.length > 50000) {
            throw new Error('[ContextBuilder] Context exceeds maximum allowed size (50,000 characters)');
        }

        return serialized;
    }
}

module.exports = ContextBuilder;
