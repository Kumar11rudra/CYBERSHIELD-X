'use strict';

const { PipelineHealth } = require('../../../../server/csi/orchestration/PipelineHealth');

// Mock registries
jest.mock('../../../../server/csi/risk/RiskRuleRegistry', () => ({ initialized: true }));
jest.mock('../../../../server/csi/correlation/CorrelationRuleRegistry', () => ({ initialized: true }));
jest.mock('../../../../server/csi/ai/PromptRegistry', () => ({ initialized: true }));
jest.mock('../../../../server/csi/reports/ReportTemplateRegistry', () => ({ initialized: true }));

describe('PipelineHealth', () => {
    it('should return healthy when all dependencies exist and registries are initialized', () => {
        const deps = {
            engineRegistry: {},
            evidenceStorage: {},
            workerPool: {},
            reasoningEngine: {},
            executiveReportEngine: {}
        };
        const health = PipelineHealth.check(deps);
        expect(health.status).toBe('healthy');
        expect(health.checks.engineRegistry).toBe('ok');
        expect(health.checks.riskRegistry).toBe('ok');
    });

    it('should return unhealthy if a dependency is missing', () => {
        const deps = {
            engineRegistry: {},
            workerPool: {}
            // missing evidenceStorage and engines
        };
        const health = PipelineHealth.check(deps);
        expect(health.status).toBe('unhealthy');
        expect(health.checks.evidenceStorage).toBe('fail');
        expect(health.checks.reasoningEngine).toBe('fail');
    });
});
