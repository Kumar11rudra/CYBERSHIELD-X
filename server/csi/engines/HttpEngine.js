'use strict';

const { IIntelligenceEngine } = require('../interfaces/IIntelligenceEngine');
const { FindingDTO }          = require('../dtos/FindingDTO');

const ENGINE_ID      = 'http';
const ENGINE_NAME    = 'HttpEngine';
const ENGINE_VERSION = '1.0.0';

const FINDING_SPECS = Object.freeze({
    missing_hsts             : { severity: 'medium', weight: 40 },
    missing_csp              : { severity: 'medium', weight: 45 },
    missing_x_frame_options  : { severity: 'low',    weight: 20 },
    missing_x_content_type   : { severity: 'low',    weight: 15 },
    server_header_exposed    : { severity: 'info',   weight: 10 },
    clickjacking_risk        : { severity: 'medium', weight: 30 },
});

class HttpEngine extends IIntelligenceEngine {
    /**
     * @param {import('../network/HttpClient').HttpClient} httpClient
     * @param {import('../interfaces/IEvidenceStorage').IEvidenceStorage} evidenceStorage
     */
    constructor(httpClient, evidenceStorage) {
        super();
        if (!httpClient) throw new TypeError('[HttpEngine] httpClient is required.');
        if (!evidenceStorage) throw new TypeError('[HttpEngine] evidenceStorage is required.');
        this._httpClient       = httpClient;
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
        const { NetworkExecutionContext } = require('../network/NetworkExecutionContext');

        const execute = async (protocol) => {
            const childCtx = new NetworkExecutionContext({
                executionId: ctx.executionId,
                targetId: `${protocol}://${domain}`,
                timeout: ctx.timeout,
                retryPolicy: ctx.retryPolicy
            });
            try {
                return await this._httpClient.query(childCtx, { method: 'GET', followRedirects: false });
            } catch (err) {
                return { error: err.message, targetUrl: `${protocol}://${domain}` };
            }
        };

        const [httpRes, httpsRes] = await Promise.all([execute('http'), execute('https')]);

        const evidencePayload = {
            domain,
            http: httpRes,
            https: httpsRes,
            collectedAt: new Date().toISOString()
        };

        return [{
            data: Buffer.from(JSON.stringify(evidencePayload, null, 2), 'utf8'),
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
            const payload = JSON.parse(rawBytes.toString('utf8'));
            const domain = payload.domain;

            // Prefer HTTPS response for header analysis if available
            const res = (!payload.https.error && payload.https.statusCode) ? payload.https : payload.http;

            if (!res || res.error) continue; // Both failed

            const headers = res.headers || {};
            const getHeader = (name) => {
                const key = Object.keys(headers).find(k => k.toLowerCase() === name.toLowerCase());
                return key ? headers[key] : null;
            };

            const hsts = getHeader('strict-transport-security');
            if (!hsts && res === payload.https) {
                findings.push(this._mkFinding('missing_hsts', {
                    detail: { domain, message: 'Strict-Transport-Security header is missing.' },
                    evidenceDto, executionId: ctx.executionId, collectionTime,
                    confidence: 1.0, confidenceSource: 'HTTP Headers', confidenceMethod: 'protocol'
                }));
            }

            const csp = getHeader('content-security-policy');
            if (!csp) {
                findings.push(this._mkFinding('missing_csp', {
                    detail: { domain, message: 'Content-Security-Policy header is missing.' },
                    evidenceDto, executionId: ctx.executionId, collectionTime,
                    confidence: 1.0, confidenceSource: 'HTTP Headers', confidenceMethod: 'protocol'
                }));
            }

            const xframe = getHeader('x-frame-options');
            if (!xframe) {
                findings.push(this._mkFinding('missing_x_frame_options', {
                    detail: { domain, message: 'X-Frame-Options header is missing.' },
                    evidenceDto, executionId: ctx.executionId, collectionTime,
                    confidence: 1.0, confidenceSource: 'HTTP Headers', confidenceMethod: 'protocol'
                }));
                findings.push(this._mkFinding('clickjacking_risk', {
                    detail: { domain, message: 'Missing X-Frame-Options or CSP frame-ancestors increases clickjacking risk.' },
                    evidenceDto, executionId: ctx.executionId, collectionTime,
                    confidence: 0.8, confidenceSource: 'Heuristic Inference', confidenceMethod: 'heuristic'
                }));
            }

            const xcto = getHeader('x-content-type-options');
            if (!xcto || xcto.toLowerCase() !== 'nosniff') {
                findings.push(this._mkFinding('missing_x_content_type', {
                    detail: { domain, message: 'X-Content-Type-Options header is missing or not nosniff.' },
                    evidenceDto, executionId: ctx.executionId, collectionTime,
                    confidence: 1.0, confidenceSource: 'HTTP Headers', confidenceMethod: 'protocol'
                }));
            }

            const server = getHeader('server') || getHeader('x-powered-by');
            if (server) {
                findings.push(this._mkFinding('server_header_exposed', {
                    detail: { domain, serverHeader: server, message: 'Server or framework identity is exposed in headers.' },
                    evidenceDto, executionId: ctx.executionId, collectionTime,
                    confidence: 1.0, confidenceSource: 'HTTP Headers', confidenceMethod: 'protocol'
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
            const result = await this._httpClient.healthCheck();
            return {
                status   : result.healthy ? 'healthy' : 'degraded',
                latencyMs: result.latencyMs,
                message  : result.healthy ? 'HTTP client operational.' : 'HTTP client unreachable.',
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
            supportedProtocols: ['http', 'https'],
            supportedTargets: ['domain', 'url'],
            riskContribution: 15,
            requiredClients: ['HttpClient'],
            minimumNodeVersion: '18.0.0',
            defaultTimeout: 10000,
            retryPolicy: { maxRetries: 1, backoffMs: 1000 }
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
            confidenceSource : confidenceSource || 'HTTP Inspection',
            confidenceMethod : confidenceMethod || 'protocol',
            detail,
            evidenceIds   : [evidenceDto.evidenceId],
            evidenceHash  : evidenceDto.sha256Hash,
            executionId,
            collectionTime,
        });
    }
}

module.exports = { HttpEngine, ENGINE_ID, FINDING_SPECS };
