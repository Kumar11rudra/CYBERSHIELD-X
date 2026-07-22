'use strict';

const { CsiExecutionPipeline } = require('../../../../server/csi/orchestration/CsiExecutionPipeline');
const { PipelineExecutionError } = require('../../../../server/csi/errors/CsiErrors');

describe('PipelineFailureIsolation', () => {
    let mockDeps;

    beforeEach(() => {
        mockDeps = {
            engineRunner: class MockEngineRunner {
                async execute() { return []; }
            },
            engineRegistry: { resolve: jest.fn().mockReturnValue([{ metadata: () => ({ id: 'e1', version: '1.0' }) }]) },
            riskEngine: { execute: jest.fn().mockReturnValue(Object.freeze({ overallScore: 5 })) },
            correlationEngine: { execute: jest.fn().mockReturnValue(Object.freeze({ overallCorrelationScore: 5 })) },
            reasoningEngine: { execute: jest.fn().mockResolvedValue({ reasoningVersion: '1.0' }) },
            executiveReportEngine: { execute: jest.fn().mockReturnValue({ json: '{}' }) },
            workerPool: {
                executeAll: jest.fn().mockResolvedValue([{ status: 'fulfilled', value: [] }])
            },
            executionValidator: { validate: jest.fn() },
            pipelineHealth: { check: jest.fn().mockReturnValue({ status: 'healthy' }) },
            evidenceStorage: {},
            targetNormalizer: { normalize: jest.fn().mockReturnValue('example.com') },
            targetClassifier: { classify: jest.fn().mockReturnValue({ value: 'example.com', targetType: 'domain' }) }
        };
    });

    it('should terminate immediately and preserve original error if ReasoningEngine throws', async () => {
        mockDeps.reasoningEngine.execute.mockRejectedValue(new Error('LLM Timeout'));
        const pipeline = new CsiExecutionPipeline(mockDeps);
        
        await expect(pipeline.execute('example.com')).rejects.toThrow(PipelineExecutionError);
        
        try {
            await pipeline.execute('example.com');
        } catch (e) {
            expect(e.message).toMatch(/Pipeline execution failed: LLM Timeout/);
            expect(e.cause).toBeDefined();
            expect(e.cause.message).toBe('LLM Timeout');
        }

        // ExecutiveReportEngine MUST NOT be executed
        expect(mockDeps.executiveReportEngine.execute).not.toHaveBeenCalled();
    });

    it('should terminate immediately if RiskEngine throws', async () => {
        mockDeps.riskEngine.execute.mockImplementation(() => { throw new Error('Risk Fault'); });
        const pipeline = new CsiExecutionPipeline(mockDeps);
        
        await expect(pipeline.execute('example.com')).rejects.toThrow(PipelineExecutionError);
        
        try {
            await pipeline.execute('example.com');
        } catch (e) {
            expect(e.message).toMatch(/Pipeline execution failed: Risk Fault/);
            expect(e.cause.message).toBe('Risk Fault');
        }

        // Subsequent engines MUST NOT be executed
        expect(mockDeps.correlationEngine.execute).not.toHaveBeenCalled();
        expect(mockDeps.reasoningEngine.execute).not.toHaveBeenCalled();
        expect(mockDeps.executiveReportEngine.execute).not.toHaveBeenCalled();
    });

    it('should terminate immediately if CorrelationEngine throws', async () => {
        mockDeps.correlationEngine.execute.mockImplementation(() => { throw new Error('Correlation Fault'); });
        const pipeline = new CsiExecutionPipeline(mockDeps);
        
        await expect(pipeline.execute('example.com')).rejects.toThrow(PipelineExecutionError);
        
        try {
            await pipeline.execute('example.com');
        } catch (e) {
            expect(e.message).toMatch(/Pipeline execution failed: Correlation Fault/);
            expect(e.cause.message).toBe('Correlation Fault');
        }

        expect(mockDeps.riskEngine.execute).toHaveBeenCalled();
        expect(mockDeps.reasoningEngine.execute).not.toHaveBeenCalled();
        expect(mockDeps.executiveReportEngine.execute).not.toHaveBeenCalled();
    });

    it('should terminate immediately if ExecutiveReportEngine throws', async () => {
        mockDeps.executiveReportEngine.execute.mockImplementation(() => { throw new Error('Report Fault'); });
        const pipeline = new CsiExecutionPipeline(mockDeps);
        
        await expect(pipeline.execute('example.com')).rejects.toThrow(PipelineExecutionError);
        
        try {
            await pipeline.execute('example.com');
        } catch (e) {
            expect(e.message).toMatch(/Pipeline execution failed: Report Fault/);
            expect(e.cause.message).toBe('Report Fault');
        }

        expect(mockDeps.riskEngine.execute).toHaveBeenCalled();
        expect(mockDeps.correlationEngine.execute).toHaveBeenCalled();
        expect(mockDeps.reasoningEngine.execute).toHaveBeenCalled();
        expect(mockDeps.executionValidator.validate).not.toHaveBeenCalled(); // Skipping final validation
    });
});
