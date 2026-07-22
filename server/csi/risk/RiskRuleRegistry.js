'use strict';

const fs = require('fs');
const path = require('path');

class RiskRuleRegistry {
    constructor() {
        this.rulesByFindingType = new Map();
        this.rulesByRuleId = new Map();
        this.initialized = false;
    }

    /**
     * Load and validate risk rules configuration
     */
    initialize(categories = []) {
        if (this.initialized) return;

        const configPath = path.join(__dirname, '../config/risk-rules.json');
        let rawConfig;
        try {
            rawConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        } catch (error) {
            throw new Error(`[RiskRuleRegistry] Failed to load configuration: ${error.message}`);
        }

        this._validateAndLoadConfig(rawConfig, categories);
        this.initialized = true;
    }

    _validateAndLoadConfig(config, categories) {
        if (!config || !Array.isArray(config.rules)) {
            throw new Error('[RiskRuleRegistry] Invalid JSON schema');
        }

        for (const rule of config.rules) {
            if (!rule.ruleId || !rule.findingType || typeof rule.weight !== 'number' || !rule.category || !rule.severity) {
                throw new Error(`[RiskRuleRegistry] Rule ${rule.ruleId || 'unknown'} is missing required fields`);
            }

            if (rule.weight < 0) {
                throw new Error(`[RiskRuleRegistry] Rule ${rule.ruleId} has negative weight`);
            }

            if (this.rulesByRuleId.has(rule.ruleId)) {
                throw new Error(`[RiskRuleRegistry] Duplicate rule ID: ${rule.ruleId}`);
            }

            if (this.rulesByFindingType.has(rule.findingType)) {
                throw new Error(`[RiskRuleRegistry] Duplicate finding mapping: ${rule.findingType}`);
            }

            if (categories.length > 0 && !categories.includes(rule.category)) {
                throw new Error(`[RiskRuleRegistry] Invalid category: ${rule.category}`);
            }

            this.rulesByRuleId.set(rule.ruleId, rule);
            this.rulesByFindingType.set(rule.findingType, rule);
        }
    }

    getRuleByFindingType(findingType) {
        if (!this.initialized) {
            throw new Error('[RiskRuleRegistry] Registry not initialized');
        }
        return this.rulesByFindingType.get(findingType) || null;
    }
}

// Export as singleton for caching
module.exports = new RiskRuleRegistry();
