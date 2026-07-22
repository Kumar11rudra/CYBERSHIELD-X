'use strict';

const PromptRegistry = require('../ai/PromptRegistry');
const ReportTemplateRegistry = require('../reports/ReportTemplateRegistry');
const RiskRuleRegistry = require('../risk/RiskRuleRegistry');
const CorrelationRuleRegistry = require('../correlation/CorrelationRuleRegistry');

class PipelineHealth {
    /**
     * @param {Object} deps
     */
    static check(deps) {
        const health = {
            status: 'healthy',
            checks: {}
        };

        const addCheck = (name, condition) => {
            health.checks[name] = condition ? 'ok' : 'fail';
            if (!condition) health.status = 'unhealthy';
        };

        // Check injected dependencies
        addCheck('engineRegistry', !!deps.engineRegistry);
        addCheck('evidenceStorage', !!deps.evidenceStorage);
        addCheck('workerPool', !!deps.workerPool);
        
        // Note: Risk, Correlation, and Reasoning are checked via registries since Risk/Correlation are static
        // ExecutiveReportEngine and ReasoningEngine are injected instances
        addCheck('reasoningEngine', !!deps.reasoningEngine);
        addCheck('executiveReportEngine', !!deps.executiveReportEngine);

        // Check global registries initialized synchronously
        addCheck('riskRegistry', RiskRuleRegistry.initialized);
        addCheck('correlationRegistry', CorrelationRuleRegistry.initialized);
        addCheck('promptRegistry', PromptRegistry.initialized);
        addCheck('templateRegistry', ReportTemplateRegistry.initialized);

        return health;
    }
}

module.exports = { PipelineHealth };
