'use strict';

const fs = require('fs');
const CorrelationRuleRegistry = require('../../../../server/csi/correlation/CorrelationRuleRegistry');

jest.mock('fs');

describe('CorrelationRuleRegistry', () => {
    beforeEach(() => {
        CorrelationRuleRegistry.initialized = false;
        CorrelationRuleRegistry.rulesByRuleId = new Map();
        jest.resetAllMocks();
    });

    test('should initialize successfully with valid config', () => {
        const validConfig = {
            categories: ['TLS_CHAIN'],
            rules: [
                {
                    ruleId: 'R1',
                    requiredFindings: ['f1', 'f2'],
                    weight: 10,
                    category: 'TLS_CHAIN',
                    edgeType: 'strengthens',
                    reasonCode: 'R_CODE'
                }
            ]
        };
        fs.readFileSync.mockReturnValue(JSON.stringify(validConfig));

        expect(() => CorrelationRuleRegistry.initialize()).not.toThrow();
        expect(CorrelationRuleRegistry.initialized).toBe(true);

        const rule = CorrelationRuleRegistry.getRule('R1');
        expect(rule).toBeDefined();
        expect(rule.weight).toBe(10);
    });

    test('should fail if missing categories', () => {
        const invalidConfig = {
            rules: []
        };
        fs.readFileSync.mockReturnValue(JSON.stringify(invalidConfig));

        expect(() => CorrelationRuleRegistry.initialize()).toThrow(/categories array in config/);
    });

    test('should fail on duplicate ruleId', () => {
        const invalidConfig = {
            categories: ['TLS_CHAIN'],
            rules: [
                { ruleId: 'R1', requiredFindings: ['f1'], weight: 10, category: 'TLS_CHAIN', edgeType: 'supports', reasonCode: 'R1' },
                { ruleId: 'R1', requiredFindings: ['f2'], weight: 20, category: 'TLS_CHAIN', edgeType: 'supports', reasonCode: 'R2' }
            ]
        };
        fs.readFileSync.mockReturnValue(JSON.stringify(invalidConfig));

        expect(() => CorrelationRuleRegistry.initialize()).toThrow(/Duplicate rule ID/);
    });

    test('should fail on duplicate requiredFindings signature', () => {
        const invalidConfig = {
            categories: ['TLS_CHAIN'],
            rules: [
                { ruleId: 'R1', requiredFindings: ['f1', 'f2'], weight: 10, category: 'TLS_CHAIN', edgeType: 'supports', reasonCode: 'R1' },
                { ruleId: 'R2', requiredFindings: ['f2', 'f1'], weight: 20, category: 'TLS_CHAIN', edgeType: 'supports', reasonCode: 'R2' }
            ]
        };
        fs.readFileSync.mockReturnValue(JSON.stringify(invalidConfig));

        expect(() => CorrelationRuleRegistry.initialize()).toThrow(/Duplicate rule signature/);
    });

    test('should fail on unknown category', () => {
        const invalidConfig = {
            categories: ['TLS_CHAIN'],
            rules: [
                { ruleId: 'R1', requiredFindings: ['f1'], weight: 10, category: 'UNKNOWN_CAT', edgeType: 'supports', reasonCode: 'R1' }
            ]
        };
        fs.readFileSync.mockReturnValue(JSON.stringify(invalidConfig));

        expect(() => CorrelationRuleRegistry.initialize()).toThrow(/maps to unknown category/);
    });

    test('should fail on negative weight', () => {
        const invalidConfig = {
            categories: ['TLS_CHAIN'],
            rules: [
                { ruleId: 'R1', requiredFindings: ['f1'], weight: -10, category: 'TLS_CHAIN', edgeType: 'supports', reasonCode: 'R1' }
            ]
        };
        fs.readFileSync.mockReturnValue(JSON.stringify(invalidConfig));

        expect(() => CorrelationRuleRegistry.initialize()).toThrow(/negative weight/);
    });
});
