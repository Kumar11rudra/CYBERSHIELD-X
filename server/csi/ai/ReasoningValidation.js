'use strict';

class ReasoningValidation {
    /**
     * @param {Object} parsedResponse 
     * @param {Array} originalFindings 
     */
    static validate(parsedResponse, originalFindings) {
        if (!parsedResponse) throw new TypeError('[ReasoningValidation] Response is null or undefined');

        const requiredFields = ['executiveSummary', 'observations', 'attackChains', 'remediation', 'confidenceExplanation'];
        for (const field of requiredFields) {
            if (!(field in parsedResponse)) {
                throw new Error(`[ReasoningValidation] Missing required field: ${field}`);
            }
        }

        const validFindingIds = new Set(originalFindings.map(f => f.findingId));
        const validEvidenceIds = new Set(originalFindings.map(f => f.evidenceHash)); // In our simplified DTO, evidence is hash.

        const serialized = JSON.stringify(parsedResponse);

        // Check length
        if (serialized.length > 20000) {
            throw new Error('[ReasoningValidation] Response exceeds length limit');
        }

        // Markdown safety check (no HTML or executable code blocks starting with ```js or similar)
        if (/<[a-z][\s\S]*>/i.test(serialized)) {
            throw new Error('[ReasoningValidation] HTML injection detected');
        }
        if (/```[a-z]+/i.test(serialized)) {
            throw new Error('[ReasoningValidation] Executable code block detected');
        }

        // Check for hallucinated finding IDs
        // Basic heuristic: scan string for UUID-like things and see if they belong
        const uuidRegex = /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/g;
        const potentialIds = serialized.match(uuidRegex) || [];
        
        for (const id of potentialIds) {
            // If it looks like an ID, it must be in the findings or evidence or rules
            // (Assuming rule IDs are not UUIDs but strings like CORR_X, they won't match the regex)
            // If we have UUID-based execution IDs, they might be in there, but we didn't pass executionId in context!
            if (!validFindingIds.has(id) && !validEvidenceIds.has(id)) {
                throw new Error(`[ReasoningValidation] Hallucinated ID detected: ${id}`);
            }
        }
    }
}

module.exports = ReasoningValidation;
