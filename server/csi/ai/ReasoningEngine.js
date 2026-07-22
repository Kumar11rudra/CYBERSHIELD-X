'use strict';

const PromptRegistry = require('./PromptRegistry');
const ContextBuilder = require('./ContextBuilder');
const ReasoningValidation = require('./ReasoningValidation');
const { ReasoningResultDTO } = require('../dtos/ReasoningResultDTO');

class ReasoningEngine {
    /**
     * @param {import('./ILLMProvider')} llmProvider 
     */
    constructor(llmProvider) {
        if (!llmProvider || typeof llmProvider.generate !== 'function') {
            throw new TypeError('[ReasoningEngine] Invalid LLM Provider');
        }
        this.llmProvider = llmProvider;
        
        // Ensure registry is initialized
        PromptRegistry.initialize();
    }

    /**
     * Executes the AI reasoning pipeline.
     * @param {Array} findings 
     * @param {Object} riskResult 
     * @param {Object} correlationResult 
     * @param {string} executionId 
     * @returns {Promise<ReasoningResultDTO>}
     */
    async execute(findings, riskResult, correlationResult, executionId) {
        if (!Array.isArray(findings) || !riskResult || !correlationResult || !executionId) {
            throw new TypeError('[ReasoningEngine] Invalid execution parameters');
        }

        // 1. Load Prompt
        const promptDef = PromptRegistry.getPrompt('ReasoningPrompt');
        
        // 2. Assemble Context
        const contextStr = ContextBuilder.build(findings, riskResult, correlationResult);
        
        // 3. Invoke LLM
        const rawResponse = await this.llmProvider.generate(promptDef.content, contextStr);
        
        let parsedResponse;
        try {
            parsedResponse = JSON.parse(rawResponse);
        } catch (e) {
            throw new Error(`[ReasoningEngine] LLM provided invalid JSON: ${e.message}`);
        }

        // 4. Validate Output
        ReasoningValidation.validate(parsedResponse, findings);
        
        // 5. Create DTO
        return new ReasoningResultDTO({
            executiveSummary: parsedResponse.executiveSummary,
            observations: parsedResponse.observations,
            attackChains: parsedResponse.attackChains,
            remediation: parsedResponse.remediation,
            confidenceExplanation: parsedResponse.confidenceExplanation,
            reasoningVersion: promptDef.version,
            executionId: executionId
        });
    }
}

module.exports = ReasoningEngine;
