'use strict';

const ILLMProvider = require('./ILLMProvider');

class LLMProviderMock extends ILLMProvider {
    constructor() {
        super();
        this.overrideResponse = null;
    }

    setOverride(responseObj) {
        this.overrideResponse = responseObj;
    }

    async generate(prompt, context) {
        if (this.overrideResponse !== null) {
            return JSON.stringify(this.overrideResponse);
        }

        // Default deterministic response for regression tests based on context
        const contextData = JSON.parse(context);
        const findingIds = contextData.findings.map(f => f.findingId);
        
        return JSON.stringify({
            executiveSummary: "Mock summary",
            observations: findingIds.map(id => `Observed ${id}`),
            attackChains: ["Chain 1"],
            remediation: ["Fix it"],
            confidenceExplanation: "High confidence due to deterministic rules"
        });
    }
}

module.exports = LLMProviderMock;
