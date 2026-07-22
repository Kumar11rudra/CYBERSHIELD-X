const { DnsEngine } = require('../../../csi/engines/DnsEngine');
const { WhoisEngine } = require('../../../csi/engines/WhoisEngine');
const { SslEngine } = require('../../../csi/engines/SslEngine');
const { TargetDTO } = require('../../../csi/dtos/TargetDTO');
const { NetworkExecutionContext } = require('../../../csi/network/NetworkExecutionContext');
const { LocalEvidenceStorage } = require('../../../csi/evidence/LocalEvidenceStorage');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

describe('CSI Engine Regression Baseline', () => {
    let storageDir;
    let evidenceStorage;
    let ctx;
    let target;

    beforeAll(() => {
        storageDir = fs.mkdtempSync(path.join(os.tmpdir(), 'csi-regression-'));
        evidenceStorage = new LocalEvidenceStorage({ baseDir: storageDir });
        
        ctx = new NetworkExecutionContext({
            executionId: 'regression-exec',
            targetId: 'example.com',
            timeout: 5000,
            retryPolicy: { maxRetries: 0, backoffMs: 0 }
        });
        target = new TargetDTO({ rawInput: 'example.com', normalized: 'example.com', type: 'domain' });
    });

    afterAll(() => {
        if (fs.existsSync(storageDir)) {
            fs.rmSync(storageDir, { recursive: true, force: true });
        }
    });

    describe('DnsEngine Regression', () => {
        it('should deterministically parse fixed DNS evidence into findings', async () => {
            const mockDnsClient = {};
            const engine = new DnsEngine(mockDnsClient, evidenceStorage);

            // 1. Immutable Regression Fixture
            const fixturePayload = {
                domain: 'example.com',
                A: ['93.184.216.34', '1.2.3.4', '1.2.3.5', '1.2.3.6', '1.2.3.7', '1.2.3.8', '1.2.3.9', '1.2.3.10', '1.2.3.11'],
                AAAA: [],
                MX: [],
                TXT: ['v=spf1 -all'],
                SOA: ['ns1.example.com'],
                NS: ['ns1.example.com'],
                DMARC: [],
                collectedAt: '2026-07-11T00:00:00Z'
            };
            const fixtureBytes = Buffer.from(JSON.stringify(fixturePayload));
            const evidenceDto = await evidenceStorage.store(fixtureBytes, { contentType: 'json' });

            // 2. Process
            const startTime = process.hrtime.bigint();
            const findings = await engine.parse([evidenceDto], ctx);
            const endTime = process.hrtime.bigint();

            // 3. Assert baseline equality
            expect(findings).toBeInstanceOf(Array);
            expect(findings.length).toBe(4);
            
            const findingTypes = findings.map(f => f.findingType).sort();
            expect(findingTypes).toEqual([
                'fast_flux_a_record',
                'missing_aaaa',
                'missing_dmarc',
                'no_mx_record'
            ]);

            // Assert exact hashing match
            const expectedHash = crypto.createHash('sha256').update(fixtureBytes).digest('hex');
            expect(findings[0].evidenceHash).toBe(expectedHash);
            
            // Log performance for the report
            const elapsedMs = Number(endTime - startTime) / 1e6;
            console.log(`[Regression] DnsEngine parse time: ${elapsedMs.toFixed(3)}ms`);
        });
    });

    describe('WhoisEngine Regression', () => {
        it('should deterministically parse fixed WHOIS evidence', async () => {
            const mockTcpClient = {};
            const engine = new WhoisEngine(mockTcpClient, evidenceStorage);

            const fixturePayload = {
                target: 'example.com',
                rawText: 'Domain Name: EXAMPLE.COM\nRegistry Expiry Date: 2026-07-12T00:00:00Z\nCreation Date: 2026-07-10T00:00:00Z',
                collectedAt: '2026-07-11T00:00:00Z'
            };
            
            const fixtureBytes = Buffer.from(JSON.stringify(fixturePayload));
            const evidenceDto = await evidenceStorage.store(fixtureBytes, { contentType: 'json' });

            const startTime = process.hrtime.bigint();
            const findings = await engine.parse([evidenceDto], ctx);
            const endTime = process.hrtime.bigint();

            expect(findings).toBeInstanceOf(Array);
            expect(findings.length).toBe(2);

            const findingTypes = findings.map(f => f.findingType).sort();
            expect(findingTypes).toEqual(['expiring_domain', 'newly_registered_domain']);
            
            const elapsedMs = Number(endTime - startTime) / 1e6;
            console.log(`[Regression] WhoisEngine parse time: ${elapsedMs.toFixed(3)}ms`);
        });
    });

    describe('SslEngine Regression', () => {
        it('should deterministically parse fixed SSL evidence', async () => {
            const mockTlsClient = {};
            const engine = new SslEngine(mockTlsClient, evidenceStorage);

            // Certificate expires in 5 days
            const validTo = new Date(Date.now() + 5 * 86400000).toISOString();
            
            const fixturePayload = {
                host: 'example.com',
                parsed: {
                    subject: { CN: 'example.com' },
                    issuer: { CN: 'Let\'s Encrypt' },
                    validFrom: '2020-01-01T00:00:00Z',
                    validTo: validTo,
                    fingerprint: 'XX:XX'
                },
                protocol: 'TLSv1.1',
                cipher: { name: 'RC4-SHA', version: 'TLSv1' },
                collectedAt: '2026-07-11T00:00:00Z'
            };
            
            const fixtureBytes = Buffer.from(JSON.stringify(fixturePayload));
            const evidenceDto = await evidenceStorage.store(fixtureBytes, { contentType: 'json' });

            const startTime = process.hrtime.bigint();
            const findings = await engine.parse([evidenceDto], ctx);
            const endTime = process.hrtime.bigint();

            expect(findings).toBeInstanceOf(Array);
            expect(findings.length).toBe(3);

            const findingTypes = findings.map(f => f.findingType).sort();
            expect(findingTypes).toEqual([
                'cert_expiring_soon',
                'tls_version_deprecated',
                'weak_cipher'
            ]);
            
            const elapsedMs = Number(endTime - startTime) / 1e6;
            console.log(`[Regression] SslEngine parse time: ${elapsedMs.toFixed(3)}ms`);
        });
    });
});
