'use strict';

const fs = require('fs');
const PromptRegistry = require('../../../../server/csi/ai/PromptRegistry');

jest.mock('fs');

describe('PromptRegistry', () => {
    beforeEach(() => {
        PromptRegistry.initialized = false;
        PromptRegistry.prompts = new Map();
        jest.resetAllMocks();
    });

    test('should load valid prompts and compute checksums', () => {
        fs.existsSync.mockReturnValue(true);
        fs.readdirSync.mockReturnValue(['ReasoningPrompt.md']);
        fs.readFileSync.mockReturnValue('Mock prompt content');

        PromptRegistry.initialize();

        expect(PromptRegistry.initialized).toBe(true);
        const prompt = PromptRegistry.getPrompt('ReasoningPrompt');
        expect(prompt.content).toBe('Mock prompt content');
        expect(prompt.checksum).toBeDefined();
        expect(prompt.version).toBe('1.0');
    });

    test('should fail fast if directory is missing', () => {
        fs.existsSync.mockReturnValue(false);
        expect(() => PromptRegistry.initialize()).toThrow(/Base directory not found/);
    });

    test('should fail fast on duplicate prompt names', () => {
        fs.existsSync.mockReturnValue(true);
        // Pretend we somehow got two files that resolve to the same name
        fs.readdirSync.mockReturnValue(['ReasoningPrompt.md', 'ReasoningPrompt.md']);
        fs.readFileSync.mockReturnValue('Mock prompt content');

        expect(() => PromptRegistry.initialize()).toThrow(/Duplicate prompt detected/);
    });

    test('should throw if getting prompt before initialization', () => {
        expect(() => PromptRegistry.getPrompt('ReasoningPrompt')).toThrow(/Not initialized/);
    });

    test('should throw if prompt does not exist', () => {
        fs.existsSync.mockReturnValue(true);
        fs.readdirSync.mockReturnValue([]);
        PromptRegistry.initialize();

        expect(() => PromptRegistry.getPrompt('UnknownPrompt')).toThrow(/Prompt not found/);
    });
});
