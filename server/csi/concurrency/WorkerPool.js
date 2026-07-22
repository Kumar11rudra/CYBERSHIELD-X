'use strict';

/**
 * WorkerPool
 *
 * A reusable queue-based asynchronous worker pool for enforcing bounded concurrency.
 * - Enforces a maximum number of concurrent tasks (default: 10).
 * - Implements queue-based scheduling.
 * - Tasks fail-fast individually without canceling the entire batch.
 */
class WorkerPool {
    /**
     * @param {number} concurrency - Maximum concurrent tasks (default 10)
     */
    constructor(concurrency = 10) {
        this.concurrency = concurrency;
        this.activeCount = 0;
        this.queue = [];
    }

    /**
     * Enqueue an array of tasks (functions returning a Promise).
     * @param {Array<() => Promise<any>>} tasks
     * @returns {Promise<Array<{ status: 'fulfilled' | 'rejected', value?: any, reason?: any }>>}
     */
    async executeAll(tasks) {
        if (!Array.isArray(tasks)) throw new TypeError('WorkerPool.executeAll requires an array of task functions.');
        
        return new Promise((resolve) => {
            const results = new Array(tasks.length);
            let completedCount = 0;
            let index = 0;

            const next = () => {
                // If all tasks are completed, resolve the main promise
                if (completedCount === tasks.length) {
                    return resolve(results);
                }

                // Fill active slots up to concurrency limit
                while (this.activeCount < this.concurrency && index < tasks.length) {
                    const currentIndex = index++;
                    const task = tasks[currentIndex];

                    this.activeCount++;

                    task()
                        .then(value => {
                            results[currentIndex] = { status: 'fulfilled', value };
                        })
                        .catch(reason => {
                            results[currentIndex] = { status: 'rejected', reason };
                        })
                        .finally(() => {
                            this.activeCount--;
                            completedCount++;
                            next();
                        });
                }
            };

            next(); // Start processing
        });
    }
}

module.exports = { WorkerPool };
