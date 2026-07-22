'use strict';

class CorrelationExplanationBuilder {
    constructor() {
        this.trace = [];
        this.stepCounter = 1;
    }

    /**
     * @param {object} params
     * @param {string} params.ruleId
     * @param {string[]} params.findingIds
     * @param {number} params.previousScore
     * @param {number} params.weight
     * @param {number} params.newScore
     * @param {string} params.category
     * @param {string} params.reasonCode
     */
    addTraceStep({ ruleId, findingIds, previousScore, weight, newScore, category, reasonCode }) {
        this.trace.push(Object.freeze({
            step: this.stepCounter++,
            ruleId,
            findingIds: Object.freeze([...findingIds]),
            previousScore,
            weight,
            newScore,
            category,
            reasonCode
        }));
    }

    build() {
        return Object.freeze([...this.trace]);
    }
}

module.exports = CorrelationExplanationBuilder;
