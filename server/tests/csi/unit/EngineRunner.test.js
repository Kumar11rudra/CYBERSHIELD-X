const { EngineRunner } = require('../../../csi/runner/EngineRunner');
const { engineMetrics } = require('../../../csi/metrics/EngineMetrics');

describe('EngineRunner', () => {
    let mockEngine;
    let mockStorage;
    let targetDTO;

    beforeEach(() => {
        engineMetrics.reset();
        
        mockEngine = {
            metadata: () => ({
                id: 'mock_engine',
                version: '1.0',
                defaultTimeout: 100,
                retryPolicy: { maxRetries: 1, backoffMs: 10 }
            }),
            collect: jest.fn().mockResolvedValue([{ data: Buffer.from('test'), contentType: 'text' }]),
            parse: jest.fn().mockResolvedValue([{ findingType: 'test_finding' }]),
            validate: jest.fn().mockResolvedValue(true)
        };

        mockStorage = {
            store: jest.fn().mockResolvedValue({ evidenceId: 'ev-123' })
        };

        targetDTO = { value: 'example.com' };
    });

    it('should respect lifecycle ordering', async () => {
        const order = [];
        const hooks = {
            beforeCollect: jest.fn().mockImplementation(async () => order.push('beforeCollect')),
            afterCollect: jest.fn().mockImplementation(async () => order.push('afterCollect')),
            beforeParse: jest.fn().mockImplementation(async () => order.push('beforeParse')),
            afterParse: jest.fn().mockImplementation(async () => order.push('afterParse')),
            onFailure: jest.fn()
        };

        const runner = new EngineRunner(mockEngine, mockStorage, hooks);
        await runner.execute(targetDTO);

        expect(order).toEqual(['beforeCollect', 'afterCollect', 'beforeParse', 'afterParse']);
    });

    it('should retry execution on failure and succeed', async () => {
        let attempts = 0;
        mockEngine.collect = jest.fn().mockImplementation(async () => {
            attempts++;
            if (attempts === 1) throw new Error('Temporary Network Error');
            return [{ data: Buffer.from('test') }];
        });

        const runner = new EngineRunner(mockEngine, mockStorage);
        const findings = await runner.execute(targetDTO);
        
        expect(attempts).toBe(2);
        expect(findings).toEqual([{ findingType: 'test_finding' }]);
    });

    it('should enforce timeout and trigger panic recovery', async () => {
        mockEngine.collect = jest.fn().mockImplementation(async () => {
            await new Promise(resolve => setTimeout(resolve, 200)); // longer than 100ms timeout
            return [{ data: Buffer.from('too late') }];
        });

        let failed = false;
        const hooks = {
            onFailure: jest.fn().mockImplementation(async () => { failed = true; })
        };

        const runner = new EngineRunner(mockEngine, mockStorage, hooks);
        const findings = await runner.execute(targetDTO);
        
        expect(failed).toBe(true);
        expect(findings).toEqual([]); // Panic recovery returns empty array
        
        const metrics = engineMetrics.snapshot();
        expect(metrics.mock_engine.failureCount).toBe(1);
    });

    it('should recover from engine internal crash (panic recovery)', async () => {
        mockEngine.parse = jest.fn().mockImplementation(async () => {
            throw new Error('Fatal Parse Error');
        });

        const hooks = { onFailure: jest.fn() };
        const runner = new EngineRunner(mockEngine, mockStorage, hooks);
        
        const findings = await runner.execute(targetDTO);
        
        expect(findings).toEqual([]);
        expect(hooks.onFailure).toHaveBeenCalled();
    });

    it('should record execution metrics correctly', async () => {
        const runner = new EngineRunner(mockEngine, mockStorage);
        await runner.execute(targetDTO);

        const metrics = engineMetrics.snapshot();
        expect(metrics.mock_engine.executionCount).toBe(1);
        expect(metrics.mock_engine.successCount).toBe(1);
        expect(metrics.mock_engine.bytesCollected).toBe(4); // 'test' is 4 bytes
    });
});
