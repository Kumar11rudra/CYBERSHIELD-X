const { HealthMonitor } = require('../../../csi/monitor/HealthMonitor');

describe('HealthMonitor', () => {
    let mockRegistry;
    let mockEngines;
    let monitor;

    beforeEach(() => {
        mockEngines = [
            {
                metadata: () => ({ id: 'engine1' }),
                healthCheck: jest.fn().mockResolvedValue({ status: 'healthy', latencyMs: 10, message: 'OK' })
            },
            {
                metadata: () => ({ id: 'engine2' }),
                healthCheck: jest.fn().mockResolvedValue({ status: 'healthy', latencyMs: 20, message: 'OK' })
            }
        ];
        
        mockRegistry = {
            getAllEngines: () => mockEngines
        };

        monitor = new HealthMonitor(mockRegistry, 1000);
    });

    afterEach(() => {
        monitor.stop();
    });

    it('should report overall status as healthy when all engines are healthy', async () => {
        await monitor._runChecks();
        expect(monitor.overallStatus()).toBe('healthy');
        const snap = monitor.snapshot();
        expect(snap.engine1.status).toBe('healthy');
        expect(snap.engine2.status).toBe('healthy');
    });

    it('should report overall status as degraded when one engine is degraded', async () => {
        mockEngines[1].healthCheck.mockResolvedValue({ status: 'degraded', latencyMs: 30, message: 'Slow' });
        await monitor._runChecks();
        expect(monitor.overallStatus()).toBe('degraded');
        const snap = monitor.snapshot();
        expect(snap.engine1.status).toBe('healthy');
        expect(snap.engine2.status).toBe('degraded');
    });

    it('should report overall status as degraded when all engines are degraded (critical state)', async () => {
        mockEngines[0].healthCheck.mockResolvedValue({ status: 'degraded', latencyMs: 50, message: 'Fail' });
        mockEngines[1].healthCheck.mockRejectedValue(new Error('Network error'));
        await monitor._runChecks();
        expect(monitor.overallStatus()).toBe('degraded');
        const snap = monitor.snapshot();
        expect(snap.engine1.status).toBe('degraded');
        expect(snap.engine2.status).toBe('degraded');
        expect(snap.engine2.lastMessage).toBe('Network error');
    });

    it('should report overall status as unknown if no engines present', () => {
        const emptyMonitor = new HealthMonitor({ getAllEngines: () => [] });
        expect(emptyMonitor.overallStatus()).toBe('unknown');
    });

    it('should preserve snapshot immutability', async () => {
        await monitor._runChecks();
        const snap1 = monitor.snapshot();
        expect(snap1.engine1.status).toBe('healthy');

        // Modifying the snapshot should not affect internal state
        snap1.engine1.status = 'degraded';
        
        const snap2 = monitor.snapshot();
        expect(snap2.engine1.status).toBe('healthy');
    });
});
