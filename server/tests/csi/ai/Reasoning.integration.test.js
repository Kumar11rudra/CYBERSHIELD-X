'use strict';

const fs = require('fs');
const ReasoningEngine = require('../../../../server/csi/ai/ReasoningEngine');
const LLMProviderMock = require('../../../../server/csi/ai/LLMProviderMock');
const PromptRegistry = require('../../../../server/csi/ai/PromptRegistry');

jest.mock('fs');

describe('Reasoning Integration', () => {
    beforeAll(() => {
        PromptRegistry.initialized = false;
        PromptRegistry.prompts = new Map();

        fs.existsSync.mockReturnValue(true);
        fs.readdirSync.mockReturnValue(['ReasoningPrompt.md']);
        fs.readFileSync.mockReturnValue('Mock prompt content');
    });

    test('should execute E2E successfully with DTO generation', async () => {
        const mockProvider = new LLMProviderMock();
        const engine = new ReasoningEngine(mockProvider);

        const findings = [
            { findingId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', findingType: 'type1', severity: 'high', evidenceHash: 'hash1' }
        ];
        const riskResult = { overallScore: 50, overallSeverity: 'MEDIUM', categories: {} };
        const correlationResult = { overallCorrelationScore: 20, categories: {}, chains: [] };

        const result = await engine.execute(findings, riskResult, correlationResult, 'exec1');

        expect(result.executiveSummary).toBe('Mock summary');
        expect(result.observations).toContain('Observed a1b2c3d4-e5f6-7890-abcd-ef1234567890');
        expect(result.executionId).toBe('exec1');

        // Check immutability recursively
        expect(Object.isFrozen(result)).toBe(true);
        expect(Object.isFrozen(result.observations)).toBe(true);
        expect(Object.isFrozen(result.attackChains)).toBe(true);
    });
});
