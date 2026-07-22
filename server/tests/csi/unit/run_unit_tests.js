'use strict';

async function runAll() {
    let passes = 0, fails = 0;
    const pass = (msg) => { console.log(`  [PASS] ${msg}`); passes++; };
    const fail = (msg, err) => { console.error(`  [FAIL] ${msg}: ${err.message}`); fails++; };

    try {
        const runDnsUnitTests   = require('./DnsEngine.test.js');
        const runWhoisUnitTests = require('./WhoisEngine.test.js');
        const runSslUnitTests   = require('./SslEngine.test.js');

        await runDnsUnitTests(pass, fail);
        await runWhoisUnitTests(pass, fail);
        await runSslUnitTests(pass, fail);

        console.log('\n══════════════════════════════════');
        console.log(`  UNIT TESTS: ${passes} pass, ${fails} fail`);
        console.log('══════════════════════════════════\n');

        if (fails > 0) process.exit(1);
    } catch (err) {
        console.error('Fatal error running unit tests:', err);
        process.exit(1);
    }
}

if (require.main === module) {
    runAll();
}
