'use strict';

const fs = require('fs');
const RiskRuleRegistry = require('../../../../server/csi/risk/RiskRuleRegistry');

// Mock fs to simulate corrupted configurations
jest.mock('fs');

describe('RiskRuleRegistry', () => {
    beforeEach(() => {
        // Reset singleton
        RiskRuleRegistry.initialized = false;
        RiskRuleRegistry.rulesByFindingType = new Map();
        RiskRuleRegistry.rulesByRuleId = new Map();
        jest.resetAllMocks();
    });

    test('should initialize successfully with valid config', () => {
        const validConfig = {
            rules: [
                {
                    ruleId: 'R1',
                    findingType: 'f1',
                    weight: 10,
                    category: 'DNS',
                    severity: 'LOW'
                }
            ]
        };
        fs.readFileSync.mockReturnValue(JSON.stringify(validConfig));

        expect(() => RiskRuleRegistry.initialize(['DNS'])).not.toThrow();
        expect(RiskRuleRegistry.initialized).toBe(true);

        const rule = RiskRuleRegistry.getRuleByFindingType('f1');
        expect(rule).toBeDefined();
        expect(rule.ruleId).toBe('R1');
    });

    test('should fail if missing required fields', () => {
        const invalidConfig = {
            rules: [
                { ruleId: 'R1', findingType: 'f1' } // Missing weight, category, severity
            ]
        };
        fs.readFileSync.mockReturnValue(JSON.stringify(invalidConfig));

        expect(() => RiskRuleRegistry.initialize([])).toThrow(/missing required fields/);
    });

    test('should fail on duplicate ruleId', () => {
        const invalidConfig = {
            rules: [
                { ruleId: 'R1', findingType: 'f1', weight: 10, category: 'DNS', severity: 'LOW' },
                { ruleId: 'R1', findingType: 'f2', weight: 20, category: 'DNS', severity: 'MEDIUM' }
            ]
        };
        fs.readFileSync.mockReturnValue(JSON.stringify(invalidConfig));

        expect(() => RiskRuleRegistry.initialize(['DNS'])).toThrow(/Duplicate rule ID/);
    });

    test('should fail on negative weight', () => {
        const invalidConfig = {
            rules: [
                { ruleId: 'R1', findingType: 'f1', weight: -10, category: 'DNS', severity: 'LOW' }
            ]
        };
        fs.readFileSync.mockReturnValue(JSON.stringify(invalidConfig));

        expect(() => RiskRuleRegistry.initialize(['DNS'])).toThrow(/negative weight/);
    });

    test('should fail on duplicate finding mapping', () => {
        const invalidConfig = {
            rules: [
                { ruleId: 'R1', findingType: 'f1', weight: 10, category: 'DNS', severity: 'LOW' },
                { ruleId: 'R2', findingType: 'f1', weight: 20, category: 'DNS', severity: 'MEDIUM' }
            ]
        };
        fs.readFileSync.mockReturnValue(JSON.stringify(invalidConfig));

        expect(() => RiskRuleRegistry.initialize(['DNS'])).toThrow(/Duplicate finding mapping/);
    });
});
