'use strict';

const fs = require('fs');
const path = require('path');

class RiskWeights {
    constructor() {
        this.config = null;
    }

    /**
     * Load and validate weights configuration
     */
    initialize() {
        if (this.config) return; // Cache after startup

        const configPath = path.join(__dirname, '../config/risk-weights.json');
        let rawConfig;
        try {
            rawConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        } catch (error) {
            throw new Error(`[RiskWeights] Failed to load configuration: ${error.message}`);
        }

        this._validateConfig(rawConfig);
        this.config = rawConfig;
    }

    _validateConfig(config) {
        if (!config || typeof config !== 'object') {
            throw new Error('[RiskWeights] Invalid JSON schema');
        }

        if (!config.normalization || typeof config.normalization.minScore !== 'number' || typeof config.normalization.maxScore !== 'number') {
            throw new Error('[RiskWeights] Invalid normalization config');
        }

        if (!Array.isArray(config.severities) || config.severities.length === 0) {
            throw new Error('[RiskWeights] Missing severities config');
        }

        if (!Array.isArray(config.categories) || config.categories.length === 0) {
            throw new Error('[RiskWeights] Missing categories config');
        }

        // Validate severities
        let previousMax = -1;
        const sortedSeverities = [...config.severities].sort((a, b) => a.minScore - b.minScore);
        
        for (const sev of sortedSeverities) {
            if (!sev.severity) throw new Error('[RiskWeights] Missing severity name');
            if (typeof sev.minScore !== 'number' || typeof sev.maxScore !== 'number') {
                throw new Error('[RiskWeights] Invalid score ranges');
            }
            if (sev.minScore < 0 || sev.maxScore < 0) {
                throw new Error('[RiskWeights] Negative values are not allowed in severities');
            }
            if (sev.minScore > sev.maxScore) {
                throw new Error('[RiskWeights] minScore cannot be greater than maxScore');
            }
            if (sev.minScore !== previousMax + 1) {
                throw new Error('[RiskWeights] Overlapping score ranges or gaps between score ranges detected');
            }
            previousMax = sev.maxScore;
        }
    }

    getNormalizationConfig() {
        this.initialize();
        return this.config.normalization;
    }

    getSeverities() {
        this.initialize();
        return this.config.severities;
    }

    getCategories() {
        this.initialize();
        return this.config.categories;
    }
}

// Export as singleton for caching
module.exports = new RiskWeights();
