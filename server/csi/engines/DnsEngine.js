'use strict';

const { IIntelligenceEngine } = require('../interfaces/IIntelligenceEngine');
const { FindingDTO }          = require('../dtos/FindingDTO');

const ENGINE_ID      = 'dns';
const ENGINE_NAME    = 'DnsEngine';
const ENGINE_VERSION = '1.0.0';

/** Severity + weight table for all findings this engine can produce */
const FINDING_SPECS = Object.freeze({
    missing_spf             : { severity: 'medium', weight: 30 },
    missing_dmarc           : { severity: 'medium', weight: 35 },
    no_mx_record            : { severity: 'info',   weight: 10 },
    fast_flux_a_record      : { severity: 'high',   weight: 50 },
    missing_aaaa            : { severity: 'info',   weight: 5  },
    no_ns_records           : { severity: 'high',   weight: 40 },
});

class DnsEngine extends IIntelligenceEngine {
    /**
     * @param {import('../network/DnsClient').DnsClient} dnsClient
     * @param {import('../interfaces/IEvidenceStorage').IEvidenceStorage} evidenceStorage
     */
    constructor(dnsClient, evidenceStorage) {
        super();
        if (!dnsClient) throw new TypeError('[DnsEngine] dnsClient is required.');
        if (!evidenceStorage) throw new TypeError('[DnsEngine] evidenceStorage is required.');
        this._dnsClient       = dnsClient;
        this._evidenceStorage = evidenceStorage;
    }

    async initialize() {}

    supports(targetDTO) {
        return targetDTO && (targetDTO.type === 'domain' || targetDTO.type === 'url');
    }

    /**
     * @param {import('../dtos/TargetDTO').TargetDTO} targetDTO
     * @param {import('../network/NetworkExecutionContext').NetworkExecutionContext} ctx
     * @returns {Promise<{data: Buffer, contentType: string}[]>}
     */
    async collect(targetDTO, ctx) {
        const domain = targetDTO.metadata.apexDomain || targetDTO.normalized;

        const [aResult, aaaaResult, mxResult, txtResult, soaResult, nsResult, dmarcResult] =
            await Promise.allSettled([
                this._dnsClient.query(ctx, { recordType: 'A' }),
                this._dnsClient.query(ctx, { recordType: 'AAAA' }),
                this._dnsClient.query(ctx, { recordType: 'MX' }),
                this._dnsClient.query(ctx, { recordType: 'TXT' }),
                this._dnsClient.query(ctx, { recordType: 'SOA' }),
                this._dnsClient.query(ctx, { recordType: 'NS' }),
                this._dnsClient.query(ctx, { recordType: 'TXT', customTarget: `_dmarc.${domain}` }) // Pass customTarget if needed, though DnsClient uses ctx.targetId. Wait, DnsClient uses ctx.targetId! We need to override it for dmarc.
            ]);
            
        // Wait, if DnsClient uses ctx.targetId, we can't easily query _dmarc without making a new mock ctx or modifying params.
        // Let's modify DnsClient.query in the code above (mentally) to accept params.targetOverride, but since we didn't, let's create a child ctx or just pass a mock context for DMARC.
        // Actually, we can just create a child ctx for DMARC lookup.
        const { NetworkExecutionContext } = require('../network/NetworkExecutionContext');
        const dmarcCtx = new NetworkExecutionContext({
            executionId: ctx.executionId,
            targetId: `_dmarc.${domain}`,
            timeout: ctx.timeout,
            retryPolicy: ctx.retryPolicy
        });
        
        const dmarcActualResult = await this._dnsClient.query(dmarcCtx, { recordType: 'TXT' }).catch(() => ({ records: [] }));

        const rawPayload = {
            domain,
            A    : aResult.status     === 'fulfilled' ? aResult.value.records     : [],
            AAAA : aaaaResult.status  === 'fulfilled' ? aaaaResult.value.records  : [],
            MX   : mxResult.status    === 'fulfilled' ? mxResult.value.records    : [],
            TXT  : txtResult.status   === 'fulfilled' ? txtResult.value.records   : [],
            SOA  : soaResult.status   === 'fulfilled' ? soaResult.value.records   : null,
            NS   : nsResult.status    === 'fulfilled' ? nsResult.value.records    : [],
            DMARC: dmarcActualResult.records || [],
            collectedAt: new Date().toISOString(),
        };

        return [{
            data: Buffer.from(JSON.stringify(rawPayload, null, 2), 'utf8'),
            contentType: 'json'
        }];
    }

    /**
     * @param {import('../dtos/EvidenceDTO').EvidenceDTO[]} evidenceDTOs
     * @param {import('../network/NetworkExecutionContext').NetworkExecutionContext} ctx
     */
    async parse(evidenceDTOs, ctx) {
        if (!evidenceDTOs || evidenceDTOs.length === 0) return [];

        const findings = [];
        const collectionTime = new Date().toISOString();

        for (const evidenceDto of evidenceDTOs) {
            const rawBytes = await this._evidenceStorage.retrieve(evidenceDto.evidenceId);
            const rawPayload = JSON.parse(rawBytes.toString('utf8'));
            const domain = rawPayload.domain;

            const txtRecords  = rawPayload.TXT.flat();
            const dmarcRecords = rawPayload.DMARC.flat();

            const hasSPF = txtRecords.some(r => r.startsWith('v=spf1'));
            if (!hasSPF) {
                findings.push(this._mkFinding('missing_spf', {
                    detail: { domain, txtRecords, message: 'No SPF record found in TXT records.' },
                    evidenceDto, executionId: ctx.executionId, collectionTime,
                    confidence: 1.0, confidenceSource: 'DNS TXT Record', confidenceMethod: 'protocol'
                }));
            }

            const hasDMARC = dmarcRecords.some(r => r.startsWith('v=DMARC1'));
            if (!hasDMARC) {
                findings.push(this._mkFinding('missing_dmarc', {
                    detail: { domain, dmarcDomain: `_dmarc.${domain}`, message: 'No DMARC record found.' },
                    evidenceDto, executionId: ctx.executionId, collectionTime,
                    confidence: 1.0, confidenceSource: 'DNS TXT Record', confidenceMethod: 'protocol'
                }));
            }

            if (rawPayload.MX.length === 0) {
                findings.push(this._mkFinding('no_mx_record', {
                    detail: { domain, message: 'No MX records found. Domain cannot receive email.' },
                    evidenceDto, executionId: ctx.executionId, collectionTime,
                    confidence: 1.0, confidenceSource: 'DNS MX Record', confidenceMethod: 'protocol'
                }));
            }

            if (rawPayload.NS.length === 0) {
                findings.push(this._mkFinding('no_ns_records', {
                    detail: { domain, message: 'No NS records found.' },
                    evidenceDto, executionId: ctx.executionId, collectionTime,
                    confidence: 1.0, confidenceSource: 'DNS NS Record', confidenceMethod: 'protocol'
                }));
            }

            if (rawPayload.A.length > 8) {
                findings.push(this._mkFinding('fast_flux_a_record', {
                    detail: { domain, aRecordCount: rawPayload.A.length, aRecords: rawPayload.A,
                        message: `Unusually high A record count (${rawPayload.A.length}) may indicate fast-flux.` },
                    evidenceDto, executionId: ctx.executionId, collectionTime,
                    confidence: 0.8, confidenceSource: 'Heuristic Threshold', confidenceMethod: 'heuristic'
                }));
            }

            if (rawPayload.AAAA.length === 0) {
                findings.push(this._mkFinding('missing_aaaa', {
                    detail: { domain, message: 'No AAAA records found. Domain does not support IPv6.' },
                    evidenceDto, executionId: ctx.executionId, collectionTime,
                    confidence: 1.0, confidenceSource: 'DNS AAAA Record', confidenceMethod: 'protocol'
                }));
            }
        }
        return findings;
    }

    async validate(findings) {
        return Array.isArray(findings) && findings.every(f => f instanceof FindingDTO);
    }

    async healthCheck() {
        const start = Date.now();
        try {
            const result = await this._dnsClient.healthCheck();
            return {
                status   : result.healthy ? 'healthy' : 'degraded',
                latencyMs: result.latencyMs,
                message  : result.healthy ? 'DNS client operational.' : 'DNS client unreachable.',
            };
        } catch (err) {
            return { status: 'degraded', latencyMs: Date.now() - start, message: err.message };
        }
    }

    metadata() {
        return {
            id: ENGINE_ID,
            version: ENGINE_VERSION,
            owner: 'CyberShield Intelligence Team',
            supportedProtocols: ['dns'],
            supportedTargets: ['domain', 'url'],
            riskContribution: 10,
            requiredClients: ['DnsClient'],
            minimumNodeVersion: '18.0.0',
            defaultTimeout: 5000,
            retryPolicy: { maxRetries: 2, backoffMs: 500 }
        };
    }

    _mkFinding(findingType, { detail, evidenceDto, executionId, collectionTime, confidence, confidenceSource, confidenceMethod }) {
        const spec = FINDING_SPECS[findingType] || { severity: 'info', weight: 5 };
        return new FindingDTO({
            engineSource  : ENGINE_NAME,
            engineVersion : ENGINE_VERSION,
            findingType,
            severity      : spec.severity,
            weight        : spec.weight,
            confidence    : confidence || 1.0,
            confidenceSource : confidenceSource || 'DNS Response',
            confidenceMethod : confidenceMethod || 'protocol',
            detail,
            evidenceIds   : [evidenceDto.evidenceId],
            evidenceHash  : evidenceDto.sha256Hash,
            executionId,
            collectionTime,
        });
    }
}

module.exports = { DnsEngine, ENGINE_ID, FINDING_SPECS };
