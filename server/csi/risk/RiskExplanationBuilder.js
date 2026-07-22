'use strict';

class RiskExplanationBuilder {
    constructor() {
        this.trace = [];
        this.stepCount = 0;
    }

    /**
     * Add a structured explanation step
     * @param {object} params
     * @param {string} params.findingId
     * @param {string} params.ruleId
     * @param {number} params.previousScore
     * @param {number} params.weight
     * @param {number} params.newScore
     * @param {string} params.category
     * @param {string} params.severity
     */
    addTraceStep({ findingId, ruleId, previousScore, weight, newScore, category, severity }) {
        this.stepCount++;
        this.trace.push({
            step: this.stepCount,
            findingId,
            ruleId,
            previousScore,
            weight,
            newScore,
            category,
            severity
        });
    }

    build() {
        return this.trace;
    }
}

module.exports = RiskExplanationBuilder;
