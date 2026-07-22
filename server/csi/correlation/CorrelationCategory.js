'use strict';

class CorrelationCategory {
    constructor() {
        this.categories = new Set();
    }

    initialize(allowedCategories) {
        if (!Array.isArray(allowedCategories)) {
            throw new TypeError('[CorrelationCategory] allowedCategories must be an array');
        }
        this.categories = new Set(allowedCategories);
    }

    isValidCategory(category) {
        return this.categories.has(category);
    }

    getAllowedCategories() {
        return Array.from(this.categories);
    }
}

module.exports = new CorrelationCategory(); // Singleton pattern as requested for categorization matching
