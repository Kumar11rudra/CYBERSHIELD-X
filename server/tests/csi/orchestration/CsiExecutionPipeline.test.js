'use strict';

const { CsiExecutionPipeline } = require('../../../../server/csi/orchestration/CsiExecutionPipeline');
const { PipelineDependencyError, PipelineExecutionError } = require('../../../../server/csi/errors/CsiErrors');
const { ExportBundleDTO } = require('../../../../server/csi/dtos/ExportBundleDTO');

describe('CsiExecutionPipeline', () => {
    let mockDeps;

    beforeEach(() => {
        mockDeps = {
            engineRunner: class MockEngineRunner {
                constructor() {}
                async execute() { return [{ findingId: 'f1' }]; }
            },
            engineRegistry: { resolve: jest.fn().mockReturnValue([{ metadata: () => ({ id: 'e1', version: '1.0' }) }]) },
            riskEngine: { execute: jest.fn().mockReturnValue(Object.freeze({ overallScore: 5 })) },
            correlationEngine: { execute: jest.fn().mockReturnValue(Object.freeze({ overallCorrelationScore: 5 })) },
            reasoningEngine: { execute: jest.fn().mockResolvedValue(Object.freeze({ reasoningVersion: '1.0' })) },
            executiveReportEngine: {
                execute: jest.fn().mockReturnValue(new ExportBundleDTO({
                    markdown: 'md', html: 'html', json: '{}', sarif: '{}', stix: '{}', executionId: '1'
                }))
            },
            workerPool: {
                executeAll: jest.fn().mockImplementation(async tasks => {
                    return Promise.all(tasks.map(t => t())).then(results => results.map(v => ({ status: 'fulfilled', value: v })));
                })
            },
            executionValidator: { validate: jest.fn() },
            pipelineHealth: { check: jest.fn().mockReturnValue({ status: 'healthy' }) },
            evidenceStorage: {},
            targetNormalizer: { normalize: jest.fn().mockReturnValue('example.com') },
            targetClassifier: { classify: jest.fn().mockReturnValue({ value: 'example.com', targetType: 'domain' }) }
        };
    });

    it('should initialize and validate dependencies', () => {
        const pipeline = new CsiExecutionPipeline(mockDeps);
        expect(pipeline).toBeDefined();
    });

    it('should throw if missing dependencies', () => {
        delete mockDeps.riskEngine;
        expect(() => new CsiExecutionPipeline(mockDeps)).toThrow(PipelineDependencyError);
    });

    it('should throw if health check fails', () => {
        mockDeps.pipelineHealth.check.mockReturnValue({ status: 'unhealthy' });
        expect(() => new CsiExecutionPipeline(mockDeps)).toThrow(PipelineDependencyError);
    });

    it('should execute pipeline in correct order and return ExecutionResultDTO', async () => {
        const pipeline = new CsiExecutionPipeline(mockDeps);
        const result = await pipeline.execute('example.com');

        expect(mockDeps.targetNormalizer.normalize).toHaveBeenCalledWith('example.com');
        expect(mockDeps.targetClassifier.classify).toHaveBeenCalledWith('example.com');
        expect(mockDeps.engineRegistry.resolve).toHaveBeenCalled();
        expect(mockDeps.workerPool.executeAll).toHaveBeenCalled();
        expect(mockDeps.riskEngine.execute).toHaveBeenCalled();
        expect(mockDeps.correlationEngine.execute).toHaveBeenCalled();
        expect(mockDeps.reasoningEngine.execute).toHaveBeenCalled();
        expect(mockDeps.executiveReportEngine.execute).toHaveBeenCalled();
        expect(mockDeps.executionValidator.validate).toHaveBeenCalledWith(result);

        expect(result.executionId).toBeDefined();
        expect(result.findings).toBeDefined();
        expect(result.risk.overallScore).toBe(5);
        expect(result.correlation.overallCorrelationScore).toBe(5);
    });
});
