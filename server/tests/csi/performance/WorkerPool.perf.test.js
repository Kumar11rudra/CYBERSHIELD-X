const { WorkerPool } = require('../../../../server/csi/concurrency/WorkerPool');
const crypto = require('crypto');

describe('WorkerPool Performance', () => {
    
    const runStressTest = async (taskCount, concurrencyLimit) => {
        const pool = new WorkerPool(concurrencyLimit);
        let currentConcurrency = 0;
        let maxConcurrency = 0;
        let completed = 0;
        let failed = 0;

        const tasks = Array.from({ length: taskCount }, (_, i) => {
            return async () => {
                currentConcurrency++;
                maxConcurrency = Math.max(maxConcurrency, currentConcurrency);
                
                // Simulate variable CPU work + network latency
                const workMs = Math.floor(Math.random() * 5) + 1;
                await new Promise(resolve => setTimeout(resolve, workMs));
                
                // Random failure (5% chance)
                if (Math.random() < 0.05) {
                    currentConcurrency--;
                    failed++;
                    throw new Error('Random simulated failure');
                }

                currentConcurrency--;
                completed++;
                return `Result ${i}`;
            };
        });

        const startTime = Date.now();
        const results = await pool.executeAll(tasks);
        const endTime = Date.now();

        expect(maxConcurrency).toBeLessThanOrEqual(concurrencyLimit);
        expect(results.length).toBe(taskCount);
        expect(completed + failed).toBe(taskCount);
        
        return {
            executionTime: endTime - startTime,
            maxConcurrency,
            completed,
            failed,
            concurrencyLimit
        };
    };

    it('should handle 100 tasks under stress without starvation', async () => {
        const metrics = await runStressTest(100, 10);
        console.log(`[WorkerPool Perf] 100 tasks: ${metrics.executionTime}ms, Max Conc: ${metrics.maxConcurrency}, Failed: ${metrics.failed}`);
        expect(metrics.maxConcurrency).toBeLessThanOrEqual(10);
    });

    it('should handle 500 tasks under stress without deadlock', async () => {
        const metrics = await runStressTest(500, 20);
        console.log(`[WorkerPool Perf] 500 tasks: ${metrics.executionTime}ms, Max Conc: ${metrics.maxConcurrency}, Failed: ${metrics.failed}`);
        expect(metrics.maxConcurrency).toBeLessThanOrEqual(20);
    });

    it('should handle 1000 tasks under stress with queue processing', async () => {
        const metrics = await runStressTest(1000, 50);
        console.log(`[WorkerPool Perf] 1000 tasks: ${metrics.executionTime}ms, Max Conc: ${metrics.maxConcurrency}, Failed: ${metrics.failed}`);
        expect(metrics.maxConcurrency).toBeLessThanOrEqual(50);
    });
});
