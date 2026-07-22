'use strict';

const fs = require('fs');
const ReasoningEngine = require('../../../../server/csi/ai/ReasoningEngine');
const LLMProviderMock = require('../../../../server/csi/ai/LLMProviderMock');
const PromptRegistry = require('../../../../server/csi/ai/PromptRegistry');

jest.mock('fs');

describe('Reasoning Regression', () => {
    beforeAll(() => {
        PromptRegistry.initialized = false;
        PromptRegistry.prompts = new Map();

        fs.existsSync.mockReturnValue(true);
        fs.readdirSync.mockReturnValue(['ReasoningPrompt.md']);
        fs.readFileSync.mockReturnValue('Mock prompt content');
    });

    test('should execute deterministically 100 consecutive times', async () => {
        const mockProvider = new LLMProviderMock();
        const engine = new ReasoningEngine(mockProvider);

        const findings = [
            { findingId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', findingType: 'type1', severity: 'high', evidenceHash: 'hash1' }
        ];
        const riskResult = { overallScore: 50, overallSeverity: 'MEDIUM', categories: {} };
        const correlationResult = { overallCorrelationScore: 20, categories: {}, chains: [] };

        let baseline = null;

        for (let i = 0; i < 100; i++) {
            const result = await engine.execute(findings, riskResult, correlationResult, 'exec1');
            
            // Serialize and strip timestamp (which changes)
            const serialized = JSON.stringify(result);
            const parsed = JSON.parse(serialized);
            delete parsed.timestamp;

            if (i === 0) {
                baseline = parsed;
                expect(baseline.executiveSummary).toBe('Mock summary');
                expect(baseline.observations).toContain('Observed a1b2c3d4-e5f6-7890-abcd-ef1234567890');
            } else {
                expect(parsed).toEqual(baseline);
            }
        }
    });
});
