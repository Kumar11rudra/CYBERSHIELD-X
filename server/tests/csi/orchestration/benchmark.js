'use strict';

const csiComposition = require('../../../../server/composition/csiComposition');

async function runBenchmark(iterations) {
    const orchestrator = csiComposition.csiOrchestrationService;
    const target = 'benchmark.local';
    
    console.log(`Starting benchmark for ${iterations} iterations...`);
    
    const startMemory = process.memoryUsage().heapUsed;
    const startTime = Date.now();
    let maxEventLoopLag = 0;

    // Track event loop lag
    const lagInterval = setInterval(() => {
        const start = Date.now();
        setImmediate(() => {
            const lag = Date.now() - start;
            if (lag > maxEventLoopLag) {
                maxEventLoopLag = lag;
            }
        });
    }, 10);

    for (let i = 0; i < iterations; i++) {
        await orchestrator.execute(target);
    }

    clearInterval(lagInterval);

    const endTime = Date.now();
    const endMemory = process.memoryUsage().heapUsed;

    const totalDuration = endTime - startTime;
    const avgDuration = totalDuration / iterations;
    const memoryGrowth = (endMemory - startMemory) / 1024 / 1024;

    console.log(`----------------------------------------`);
    console.log(`Iterations       : ${iterations}`);
    console.log(`Total Duration   : ${totalDuration} ms`);
    console.log(`Average Duration : ${avgDuration.toFixed(2)} ms/run`);
    console.log(`Max Event Lag    : ${maxEventLoopLag} ms`);
    console.log(`Memory Growth    : ${memoryGrowth.toFixed(2)} MB`);
    console.log(`----------------------------------------`);
}

async function main() {
    try {
        await runBenchmark(100);
        await runBenchmark(500);
        await runBenchmark(1000);
    } catch (e) {
        console.error('Benchmark failed:', e);
    }
}

main();
