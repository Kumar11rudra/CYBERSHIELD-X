const path = require('path');
const baseDir = '/Users/anil/Documents/New project/cybershield-x/server';
const platformComposition = require(path.join(baseDir, 'composition/platformComposition.js'));

async function testChaos() {
    console.log("=== Phase 6: Chaos Testing (Failover Verification) ===");
    let passed = 0;
    
    // 1. Simulate Enzoic Failure (API Key Missing)
    delete process.env.ENZOIC_API_KEY;
    try {
        const res = await platformComposition.breachIntelligenceService.checkEmail('test@test.com', 'mock_user');
        if (res.source.includes('Simulated') || res.source.includes('Mock')) {
            console.log("[PASS] Breach Provider Manager fell back to Mock when ENZOIC_API_KEY was missing.");
            passed++;
        } else {
            console.log("[FAIL] Breach Provider Manager did NOT fall back.");
        }
    } catch(err) {
        console.log("[FAIL] Breach Provider Manager crashed on Enzoic missing key.", err.message);
    }

    // 2. Simulate Enzoic Failure (Exception thrown)
    process.env.ENZOIC_API_KEY = "dummy_key";
    // Monkey patch the provider to simulate a network crash
    const originalCheckEmail = platformComposition.breachProviderManager.enzoic.checkEmail;
    platformComposition.breachProviderManager.enzoic.checkEmail = async () => { throw new Error('NETWORK TIMEOUT'); };
    try {
        const res = await platformComposition.breachIntelligenceService.checkEmail('test@test.com', 'mock_user');
        if (res.source.includes('Mock') || res.source.includes('Simulated')) {
            console.log("[PASS] Breach Provider Manager gracefully handled Enzoic network crash.");
            passed++;
        } else {
            console.log("[FAIL] Breach Provider Manager failed to fallback on network crash.");
        }
    } catch(err) {
        console.log("[FAIL] Breach Provider Manager crashed on Enzoic network timeout.", err.message);
    }
    // Restore
    platformComposition.breachProviderManager.enzoic.checkEmail = originalCheckEmail;

    // 3. Simulate HIBP Password failure
    const originalPassword = platformComposition.breachProviderManager.hibp.checkPassword;
    platformComposition.breachProviderManager.hibp.checkPassword = async () => { throw new Error('HIBP RATE LIMIT EXCEEDED'); };
    try {
        const res = await platformComposition.breachIntelligenceService.checkPassword('password123');
        if (res.source === 'Local Heuristics') {
            console.log("[PASS] Breach Provider Manager gracefully handled HIBP Rate Limit.");
            passed++;
        } else {
            console.log("[FAIL] Breach Provider Manager failed to fallback on HIBP Rate Limit.");
        }
    } catch(err) {
        console.log("[FAIL] Breach Provider Manager crashed on HIBP Rate Limit.", err.message);
    }

    if (passed === 3) {
        console.log("Chaos Testing Completed Successfully!");
        process.exit(0);
    } else {
        console.log("Chaos Testing Failed!");
        process.exit(1);
    }
}

testChaos();
