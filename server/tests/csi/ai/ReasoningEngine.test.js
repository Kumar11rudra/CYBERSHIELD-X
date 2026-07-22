'use strict';

const fs = require('fs');
const ReasoningEngine = require('../../../../server/csi/ai/ReasoningEngine');
const LLMProviderMock = require('../../../../server/csi/ai/LLMProviderMock');
const PromptRegistry = require('../../../../server/csi/ai/PromptRegistry');

jest.mock('fs');

describe('ReasoningEngine', () => {
    let engine;
    let mockProvider;

    beforeEach(() => {
        PromptRegistry.initialized = false;
        PromptRegistry.prompts = new Map();

        fs.existsSync.mockReturnValue(true);
        fs.readdirSync.mockReturnValue(['ReasoningPrompt.md']);
        fs.readFileSync.mockReturnValue('Mock prompt content');

        mockProvider = new LLMProviderMock();
        engine = new ReasoningEngine(mockProvider);
    });

    test('should execute full pipeline successfully', async () => {
        const findings = [{ findingId: 'f1', findingType: 'type1', severity: 'high', evidenceHash: 'h1' }];
        const riskResult = { overallScore: 50, overallSeverity: 'MEDIUM', categories: {} };
        const correlationResult = { overallCorrelationScore: 20, categories: {}, chains: [] };

        const result = await engine.execute(findings, riskResult, correlationResult, 'exec1');

        expect(result.executiveSummary).toBe('Mock summary');
        expect(result.observations).toContain('Observed f1');
        expect(result.executionId).toBe('exec1');
        expect(result.reasoningVersion).toBe('1.0');
    });

    test('should reject invalid LLM JSON response', async () => {
        mockProvider.generate = jest.fn().mockResolvedValue('Invalid JSON string');

        const findings = [{ findingId: 'f1', findingType: 'type1', severity: 'high', evidenceHash: 'h1' }];
        const riskResult = { overallScore: 50, overallSeverity: 'MEDIUM', categories: {} };
        const correlationResult = { overallCorrelationScore: 20, categories: {}, chains: [] };

        await expect(engine.execute(findings, riskResult, correlationResult, 'exec1'))
            .rejects.toThrow(/LLM provided invalid JSON/);
    });

    test('should bubble up validation errors', async () => {
        mockProvider.setOverride({
            executiveSummary: 'Summary',
            observations: ['Hallucinated ID 12345678-1234-1234-1234-1234567890ab'],
            attackChains: [],
            remediation: [],
            confidenceExplanation: 'High'
        });

        const findings = [{ findingId: 'f1', findingType: 'type1', severity: 'high', evidenceHash: 'h1' }];
        const riskResult = { overallScore: 50, overallSeverity: 'MEDIUM', categories: {} };
        const correlationResult = { overallCorrelationScore: 20, categories: {}, chains: [] };

        await expect(engine.execute(findings, riskResult, correlationResult, 'exec1'))
            .rejects.toThrow(/Hallucinated ID detected/);
    });
});
