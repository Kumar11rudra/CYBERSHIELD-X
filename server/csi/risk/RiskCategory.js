'use strict';

const riskWeights = require('./RiskWeights');

class RiskCategory {
    /**
     * Get allowed categories from weights config
     */
    static getAllowedCategories() {
        return riskWeights.getCategories();
    }

    /**
     * Checks if category is valid
     */
    static isValid(category) {
        return this.getAllowedCategories().includes(category);
    }
}

module.exports = RiskCategory;
