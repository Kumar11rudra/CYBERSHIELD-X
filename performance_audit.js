const path = require('path');
const baseDir = '/Users/anil/Documents/New project/cybershield-x/server';
const platformComposition = require(path.join(baseDir, 'composition/platformComposition.js'));
const mongoose = require('mongoose');

async function runPerformanceAudit() {
    console.log("=== Phase 6: Performance & Load Profiling ===");
    let passed = 0;
    
    // 1. Aggregation Latency
    try {
        const start = Date.now();
        const stats = await platformComposition.dashboardAggregationService.getStats('mock_org_123');
        const duration = Date.now() - start;
        
        if (duration < 500) {
            console.log(`[PASS] Dashboard Aggregation Latency: ${duration}ms (Threshold <500ms)`);
            passed++;
        } else {
            console.log(`[WARN] Dashboard Aggregation Latency high: ${duration}ms`);
        }
    } catch(err) {
        console.log("[FAIL] Dashboard Aggregation crashed.", err.message);
    }

    // 2. Dispatcher Throughput Mock Simulation
    // We'll simulate 100 concurrent async operations against the composition root to ensure it scales
    try {
        const start = Date.now();
        const promises = [];
        for(let i=0; i<100; i++) {
            promises.push(platformComposition.dashboardAggregationService.getStats('mock_org_123'));
        }
        await Promise.all(promises);
        const duration = Date.now() - start;
        
        if (duration < 2000) {
            console.log(`[PASS] Dispatcher Throughput (100 concurrent requests): ${duration}ms (Threshold <2000ms)`);
            passed++;
        } else {
            console.log(`[WARN] Dispatcher Throughput slow: ${duration}ms`);
        }
    } catch(err) {
        console.log("[FAIL] Dispatcher Throughput crashed.", err.message);
    }

    // 3. Memory Usage
    try {
        const memoryUsage = process.memoryUsage();
        const heapUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
        if (heapUsedMB < 100) {
            console.log(`[PASS] Memory Usage: ${heapUsedMB} MB (Threshold <100MB)`);
            passed++;
        } else {
            console.log(`[WARN] Memory Usage high: ${heapUsedMB} MB`);
        }
    } catch(err) {
        console.log("[FAIL] Memory Usage check crashed.", err.message);
    }

    if (passed >= 3) {
        console.log("Performance Profiling Completed Successfully!");
        process.exit(0);
    } else {
        console.log("Performance Profiling Failed!");
        process.exit(1);
    }
}

runPerformanceAudit();
