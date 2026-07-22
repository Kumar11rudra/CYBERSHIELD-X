'use strict';

const fs = require('fs');
const path = require('path');
const CorrelationCategory = require('./CorrelationCategory');
const { VALID_EDGE_TYPES } = require('../dtos/CorrelationEdgeDTO');

class CorrelationRuleRegistry {
    constructor() {
        this.rulesByRuleId = new Map();
        this.initialized = false;
    }

    /**
     * @throws {Error} if rules fail validation
     */
    initialize() {
        if (this.initialized) return;

        const configPath = path.join(__dirname, '../config/correlation-rules.json');
        let config;
        try {
            const raw = fs.readFileSync(configPath, 'utf8');
            config = JSON.parse(raw);
        } catch (error) {
            throw new Error(`[CorrelationRuleRegistry] Failed to load configuration: ${error.message}`);
        }

        if (!config.categories || !Array.isArray(config.categories)) {
            throw new Error('[CorrelationRuleRegistry] Missing or invalid categories array in config');
        }

        CorrelationCategory.initialize(config.categories);

        if (!config.rules || !Array.isArray(config.rules)) {
            throw new Error('[CorrelationRuleRegistry] Missing or invalid rules array in config');
        }

        const seenRuleIds = new Set();
        const seenSignatures = new Set();

        for (const rule of config.rules) {
            if (!rule.ruleId || !rule.requiredFindings || !Array.isArray(rule.requiredFindings) || typeof rule.weight !== 'number' || !rule.category || !rule.edgeType || !rule.reasonCode) {
                throw new Error(`[CorrelationRuleRegistry] Rule missing required fields: ${JSON.stringify(rule)}`);
            }

            if (seenRuleIds.has(rule.ruleId)) {
                throw new Error(`[CorrelationRuleRegistry] Duplicate rule ID found: ${rule.ruleId}`);
            }
            seenRuleIds.add(rule.ruleId);

            if (rule.weight < 0) {
                throw new Error(`[CorrelationRuleRegistry] Rule ${rule.ruleId} has negative weight: ${rule.weight}`);
            }

            if (!CorrelationCategory.isValidCategory(rule.category)) {
                throw new Error(`[CorrelationRuleRegistry] Rule ${rule.ruleId} maps to unknown category: ${rule.category}`);
            }

            if (!VALID_EDGE_TYPES.includes(rule.edgeType)) {
                throw new Error(`[CorrelationRuleRegistry] Rule ${rule.ruleId} uses invalid edgeType: ${rule.edgeType}`);
            }

            // Create deterministic signature by sorting finding types
            const sortedFindings = [...rule.requiredFindings].sort();
            const signature = sortedFindings.join('|');
            if (seenSignatures.has(signature)) {
                throw new Error(`[CorrelationRuleRegistry] Duplicate rule signature found for requiredFindings: ${signature}`);
            }
            seenSignatures.add(signature);

            // Freeze the rule to prevent runtime mutation
            Object.freeze(rule.requiredFindings);
            Object.freeze(rule);

            this.rulesByRuleId.set(rule.ruleId, rule);
        }

        this.initialized = true;
    }

    getAllRules() {
        if (!this.initialized) {
            throw new Error('[CorrelationRuleRegistry] Not initialized');
        }
        return Array.from(this.rulesByRuleId.values());
    }

    getRule(ruleId) {
        if (!this.initialized) {
            throw new Error('[CorrelationRuleRegistry] Not initialized');
        }
        return this.rulesByRuleId.get(ruleId);
    }
}

module.exports = new CorrelationRuleRegistry();
