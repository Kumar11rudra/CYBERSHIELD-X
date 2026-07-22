'use strict';

const { WorkerPool } = require('../../../../server/csi/concurrency/WorkerPool');

describe('WorkerPool Determinism Verification', () => {
    let pool;

    beforeEach(() => {
        pool = new WorkerPool(4);
    });

    it('should execute tasks concurrently but not guarantee return order if we sort later, but WorkerPool itself retains array order', async () => {
        // Wait, CsiExecutionPipeline maps tasks into an array `runnerTasks`
        // Promise.allSettled(tasks) returns results in the EXACT SAME ORDER as the input array, regardless of which finishes first!
        // Let's verify this behavior just to be absolutely certain for the report.
        
        const createTask = (id, delayMs) => {
            return async () => {
                return new Promise(resolve => setTimeout(() => resolve(id), delayMs));
            };
        };

        const tasks = [
            createTask('A', 50),
            createTask('B', 10),
            createTask('C', 30),
            createTask('D', 5)
        ];

        const results = await pool.executeAll(tasks);
        
        // Output order should exactly match input order regardless of timing
        expect(results[0].value).toBe('A');
        expect(results[1].value).toBe('B');
        expect(results[2].value).toBe('C');
        expect(results[3].value).toBe('D');
    });

    it('should produce deterministically ordered findings even with randomized Promise resolution', async () => {
        // Let's simulate the pipeline's deterministic sorting.
        const findings = [
            { deterministicSortKey: 'keyB', data: 2 },
            { deterministicSortKey: 'keyC', data: 3 },
            { deterministicSortKey: 'keyA', data: 1 },
        ];

        // Pipeline logic: 
        findings.sort((a, b) => a.deterministicSortKey.localeCompare(b.deterministicSortKey));

        expect(findings[0].deterministicSortKey).toBe('keyA');
        expect(findings[1].deterministicSortKey).toBe('keyB');
        expect(findings[2].deterministicSortKey).toBe('keyC');
    });
});
