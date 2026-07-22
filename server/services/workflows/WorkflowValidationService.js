/**
 * @module WorkflowValidationService
 * @description Validates workflow definitions and parameters.
 */
class WorkflowValidationService {
    /**
     * @param {Object} deps 
     * @param {import('../chatbot_core/capabilities/CapabilityResolver')} deps.capabilityResolver 
     * @param {import('../scanners/ScanExecutionService')} deps.scanExecutionService
     */
    constructor({ capabilityResolver, scanExecutionService }) {
        this.capabilityResolver = capabilityResolver;
        this.scanExecutionService = scanExecutionService;
    }

    /**
     * Validates that all capabilities referenced in a template exist.
     * @param {import('./dto/WorkflowDefinitionDTO')} template 
     */
    validateTemplateCapabilities(template) {
        const errors = [];
        for (const stage of template.stages) {
            for (const step of stage.steps) {
                const isScanner = this.scanExecutionService.providers.has(step.capabilityId);
                const cap = this.capabilityResolver.resolve(step.capabilityId);
                if (!cap && !isScanner) {
                    errors.push(`Capability '${step.capabilityId}' in stage '${stage.name}' is not registered or valid.`);
                }
            }
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }
}

module.exports = WorkflowValidationService;
