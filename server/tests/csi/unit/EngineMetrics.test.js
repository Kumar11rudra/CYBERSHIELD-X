const { EngineMetrics } = require('../../../csi/metrics/EngineMetrics');

describe('EngineMetrics', () => {
    let metrics;

    beforeEach(() => {
        metrics = new EngineMetrics();
    });

    it('should aggregate latency and count executions correctly', () => {
        metrics.recordExecution('engine1', 100);
        metrics.recordExecution('engine1', 200);

        const snap = metrics.snapshot();
        expect(snap.engine1.executionCount).toBe(2);
        expect(snap.engine1.successCount).toBe(2);
        expect(snap.engine1.failureCount).toBe(0);
        expect(snap.engine1.averageLatency).toBe(150);
        expect(snap.engine1.minimumLatency).toBe(100);
        expect(snap.engine1.maximumLatency).toBe(200);
    });

    it('should accurately count bytes collected', () => {
        metrics.recordBytes('engine2', 1024);
        metrics.recordBytes('engine2', 2048);

        const snap = metrics.snapshot();
        expect(snap.engine2.bytesCollected).toBe(3072);
    });

    it('should freeze snapshot immutably', () => {
        metrics.recordExecution('engine3', 10);
        const snap1 = metrics.snapshot();
        
        // Mutate snapshot
        snap1.engine3.executionCount = 999;
        
        const snap2 = metrics.snapshot();
        expect(snap2.engine3.executionCount).toBe(1);
    });

    it('should reset internal state on reset()', () => {
        metrics.recordExecution('engine4', 50);
        metrics.reset();
        
        const snap = metrics.snapshot();
        expect(snap.engine4).toBeUndefined();
    });

    it('should record failures and update latencies', () => {
        metrics.recordExecution('engine5', 50);
        metrics.recordFailure('engine5', 150);

        const snap = metrics.snapshot();
        expect(snap.engine5.executionCount).toBe(2);
        expect(snap.engine5.successCount).toBe(1);
        expect(snap.engine5.failureCount).toBe(1);
        expect(snap.engine5.averageLatency).toBe(100);
        expect(snap.engine5.minimumLatency).toBe(50);
        expect(snap.engine5.maximumLatency).toBe(150);
        expect(snap.engine5.lastFailure).toBeTruthy();
    });
});
