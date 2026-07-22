const ExecutionDispatcher = require('./server/services/ExecutionDispatcher');
const capabilityConfig = require('./server/config/capabilityRegistry.config');

async function verify() {
    console.log("=== V13 MILESTONE 4 VALIDATION ===");
    
    // 1. Capability Registration Check
    console.log(`[+] Registered Capabilities: ${capabilityConfig.capabilities.length}`);
    if (capabilityConfig.capabilities.length !== 24) {
        console.error("[-] Expected 24 capabilities registered.");
        return;
    }
    
    // 2. Dispatcher Resolution Check
    const whoisCap = ExecutionDispatcher.resolveCapability('whois.scan');
    if (!whoisCap || whoisCap.adapter !== 'WhoisAdapter') {
        console.error("[-] Failed to resolve capability 'whois.scan'.");
        return;
    }
    console.log(`[+] Dispatcher correctly resolved whois.scan -> ${whoisCap.adapter}`);

    // Note: To test execution we'd need mock DI container populated with adapter instances,
    // which requires the DI initialization logic (e.g. from securityComposition).
    
    console.log("=== VALIDATION COMPLETED (SIMULATED PASSED) ===");
}

verify().catch(console.error);
