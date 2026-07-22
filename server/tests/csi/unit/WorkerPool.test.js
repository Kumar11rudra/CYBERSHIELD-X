const { WorkerPool } = require('../../../csi/concurrency/WorkerPool');

describe('WorkerPool', () => {
    it('should limit maximum concurrency', async () => {
        const pool = new WorkerPool(3);
        let currentConcurrency = 0;
        let maxConcurrency = 0;
        
        const tasks = Array.from({ length: 10 }, () => {
            return async () => {
                currentConcurrency++;
                maxConcurrency = Math.max(maxConcurrency, currentConcurrency);
                await new Promise(resolve => setTimeout(resolve, 50));
                currentConcurrency--;
                return 'done';
            };
        });

        const results = await pool.executeAll(tasks);
        expect(maxConcurrency).toBe(3);
        expect(results.length).toBe(10);
        results.forEach(res => {
            expect(res.status).toBe('fulfilled');
            expect(res.value).toBe('done');
        });
    });

    it('should process tasks in queue order', async () => {
        const pool = new WorkerPool(1); // Concurrency 1 ensures exact order
        const executionOrder = [];
        
        const tasks = [
            async () => { executionOrder.push(1); return 1; },
            async () => { executionOrder.push(2); return 2; },
            async () => { executionOrder.push(3); return 3; },
        ];

        await pool.executeAll(tasks);
        expect(executionOrder).toEqual([1, 2, 3]);
    });

    it('should isolate failures without crashing pool', async () => {
        const pool = new WorkerPool(2);
        
        const tasks = [
            async () => 'success1',
            async () => { throw new Error('fail'); },
            async () => 'success2',
        ];

        const results = await pool.executeAll(tasks);
        expect(results[0].status).toBe('fulfilled');
        expect(results[1].status).toBe('rejected');
        expect(results[1].reason.message).toBe('fail');
        expect(results[2].status).toBe('fulfilled');
    });

    it('should throw if tasks is not an array', async () => {
        const pool = new WorkerPool(2);
        await expect(pool.executeAll(null)).rejects.toThrow(TypeError);
        await expect(pool.executeAll('not array')).rejects.toThrow(TypeError);
    });
});
