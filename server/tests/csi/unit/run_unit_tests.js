'use strict';

// Mock Jest globals for plain node execution
global.describe = (name, fn) => {
    console.log(`Suite: ${name}`);
    fn();
};
global.it = (name, fn) => {
    try {
        fn();
        console.log(`  [PASS] ${name}`);
    } catch (err) {
        console.error(`  [FAIL] ${name}: ${err.message}`);
        process.exitCode = 1;
    }
};
global.expect = (val) => ({
    toBe: (expected) => {
        if (val !== expected) throw new Error(`Expected ${expected}, got ${val}`);
    }
});

async function runAll() {
    try {
        require('./DnsEngine.test.js');
        require('./WhoisEngine.test.js');
        require('./SslEngine.test.js');

        console.log('\n══════════════════════════════════');
        console.log(`  UNIT TESTS COMPLETE`);
        console.log('══════════════════════════════════\n');
    } catch (err) {
        console.error('Fatal error running unit tests:', err);
        process.exit(1);
    }
}

if (require.main === module) {
    runAll();
}
