const { NetworkExecutionContext } = require('../../../csi/network/NetworkExecutionContext');

describe('NetworkExecutionContext', () => {
    const validParams = {
        executionId: 'exec-1',
        targetId: 'example.com',
        timeout: 100,
        retryPolicy: { maxRetries: 1, backoffMs: 10 }
    };

    it('should calculate remainingTime correctly', async () => {
        const ctx = new NetworkExecutionContext({ ...validParams, timeout: 200 });
        
        // Initial remaining time should be close to 200
        const initial = ctx.remainingTime();
        expect(initial).toBeGreaterThan(150);
        expect(initial).toBeLessThanOrEqual(200);

        // Wait 50ms
        await new Promise(resolve => setTimeout(resolve, 50));
        
        const afterWait = ctx.remainingTime();
        expect(afterWait).toBeLessThan(160);
    });

    it('should return 0 for remainingTime if expired', async () => {
        const ctx = new NetworkExecutionContext({ ...validParams, timeout: 10 });
        await new Promise(resolve => setTimeout(resolve, 20));
        expect(ctx.remainingTime()).toBe(0);
    });

    it('should correctly report isExpired', async () => {
        const ctx = new NetworkExecutionContext({ ...validParams, timeout: 50 });
        expect(ctx.isExpired()).toBe(false);
        await new Promise(resolve => setTimeout(resolve, 60));
        expect(ctx.isExpired()).toBe(true);
    });

    it('should propagate properties correctly', () => {
        const params = {
            ...validParams,
            workerId: 'worker-1',
            requestNumber: 42,
            responseLimit: 1024,
            correlationId: 'corr-2',
            telemetry: { engineId: 'test_engine' }
        };
        const ctx = new NetworkExecutionContext(params);
        expect(ctx.workerId).toBe('worker-1');
        expect(ctx.requestNumber).toBe(42);
        expect(ctx.responseLimit).toBe(1024);
        expect(ctx.correlationId).toBe('corr-2');
        expect(ctx.telemetry.engineId).toBe('test_engine');
    });

    it('should throw Error on missing required fields', () => {
        expect(() => new NetworkExecutionContext({ ...validParams, executionId: null })).toThrow(/executionId is required/);
        expect(() => new NetworkExecutionContext({ ...validParams, targetId: null })).toThrow(/targetId is required/);
        expect(() => new NetworkExecutionContext({ ...validParams, timeout: '100' })).toThrow(/timeout is required and must be a number/);
        expect(() => new NetworkExecutionContext({ ...validParams, retryPolicy: null })).toThrow(/retryPolicy.*is required/);
        expect(() => new NetworkExecutionContext({ ...validParams, retryPolicy: { maxRetries: '0', backoffMs: 0 } })).toThrow(/retryPolicy.*is required/);
    });
});
