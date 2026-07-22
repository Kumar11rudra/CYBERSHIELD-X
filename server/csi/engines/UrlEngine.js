'use strict';

const { IIntelligenceEngine } = require('../interfaces/IIntelligenceEngine');
const { FindingDTO }          = require('../dtos/FindingDTO');
const url                     = require('url');

const ENGINE_ID      = 'url';
const ENGINE_NAME    = 'UrlEngine';
const ENGINE_VERSION = '1.0.0';

const FINDING_SPECS = Object.freeze({
    open_redirect              : { severity: 'high',   weight: 60 },
    scheme_downgrade_redirect  : { severity: 'medium', weight: 40 },
    suspicious_url_parameter   : { severity: 'medium', weight: 35 },
    excessive_redirect_chain   : { severity: 'low',    weight: 15 },
});

// Patterns often used to test open redirects or SSRF via URL parameters
const SUSPICIOUS_PARAMS = ['url', 'redirect', 'next', 'return', 'goto', 'target', 'dest', 'uri', 'path', 'continue', 'window', 'out'];

class UrlEngine extends IIntelligenceEngine {
    /**
     * @param {import('../network/HttpClient').HttpClient} httpClient
     * @param {import('../interfaces/IEvidenceStorage').IEvidenceStorage} evidenceStorage
     */
    constructor(httpClient, evidenceStorage) {
        super();
        if (!httpClient) throw new TypeError('[UrlEngine] httpClient is required.');
        if (!evidenceStorage) throw new TypeError('[UrlEngine] evidenceStorage is required.');
        this._httpClient       = httpClient;
        this._evidenceStorage = evidenceStorage;
    }

    async initialize() {}

    supports(targetDTO) {
        return targetDTO && targetDTO.type === 'url';
    }

    /**
     * @param {import('../dtos/TargetDTO').TargetDTO} targetDTO
     * @param {import('../network/NetworkExecutionContext').NetworkExecutionContext} ctx
     */
    async collect(targetDTO, ctx) {
        const { UrlCanonicalizer } = require('../utils/UrlCanonicalizer');
        const startUrl = UrlCanonicalizer.canonicalize(targetDTO.rawInput || targetDTO.normalized);
        const maxRedirects = 10;
        let currentUrl = startUrl;
        let hops = [];
        
        const { NetworkExecutionContext } = require('../network/NetworkExecutionContext');

        for (let i = 0; i < maxRedirects; i++) {
            const childCtx = new NetworkExecutionContext({
                executionId: ctx.executionId,
                targetId: currentUrl,
                timeout: ctx.timeout,
                retryPolicy: { maxRetries: 0, backoffMs: 0 } // Don't retry each hop to avoid long loops
            });

            try {
                // followRedirects = false so we can track each hop manually
                const res = await this._httpClient.query(childCtx, { method: 'GET', followRedirects: false });
                
                hops.push({
                    url: currentUrl,
                    statusCode: res.statusCode,
                    location: res.headers.location || null
                });

                if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
                    currentUrl = new url.URL(res.headers.location, currentUrl).toString();
                } else {
                    break; // No more redirects
                }
            } catch (err) {
                hops.push({
                    url: currentUrl,
                    error: err.message
                });
                break;
            }
        }

        const payload = {
            startUrl,
            hops,
            collectedAt: new Date().toISOString()
        };

        return [{
            data: Buffer.from(JSON.stringify(payload, null, 2), 'utf8'),
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
            const hops = payload.hops || [];
            const startUrl = payload.startUrl;

            // 1. Excessive redirect chain
            if (hops.length >= 7) {
                findings.push(this._mkFinding('excessive_redirect_chain', {
                    detail: { startUrl, hopCount: hops.length, message: `Excessive redirect chain detected (${hops.length} hops).` },
                    evidenceDto, executionId: ctx.executionId, collectionTime,
                    confidence: 1.0, confidenceSource: 'Hop Count', confidenceMethod: 'deterministic'
                }));
            }

            let startParsed;
            try { startParsed = new url.URL(startUrl); } catch { continue; }

            // 2. Suspicious URL parameters
            const suspiciousFound = [];
            for (const [key, val] of startParsed.searchParams.entries()) {
                if (SUSPICIOUS_PARAMS.includes(key.toLowerCase())) {
                    suspiciousFound.push({ key, val });
                }
            }
            if (suspiciousFound.length > 0) {
                findings.push(this._mkFinding('suspicious_url_parameter', {
                    detail: { startUrl, parameters: suspiciousFound, message: 'URL contains parameters commonly used for open redirect or SSRF.' },
                    evidenceDto, executionId: ctx.executionId, collectionTime,
                    confidence: 0.8, confidenceSource: 'Parameter List Match', confidenceMethod: 'heuristic'
                }));
            }

            // 3. Scheme downgrade (https -> http) & Open Redirect (redirecting to a different domain)
            let currentProtocol = startParsed.protocol;
            let currentHost = startParsed.hostname;

            for (const hop of hops) {
                if (hop.location) {
                    try {
                        const nextUrl = new url.URL(hop.location, hop.url);
                        
                        if (currentProtocol === 'https:' && nextUrl.protocol === 'http:') {
                            findings.push(this._mkFinding('scheme_downgrade_redirect', {
                                detail: { from: hop.url, to: hop.location, message: 'Redirect downgrades from HTTPS to HTTP.' },
                                evidenceDto, executionId: ctx.executionId, collectionTime,
                                confidence: 1.0, confidenceSource: 'URL Parsing', confidenceMethod: 'deterministic'
                            }));
                        }

                        // Open redirect: redirects to a completely different host
                        // In reality, this requires deeper analysis (e.g., if it's SSO). But this is an intelligence engine.
                        if (nextUrl.hostname !== currentHost && !nextUrl.hostname.endsWith('.' + currentHost)) {
                            findings.push(this._mkFinding('open_redirect', {
                                detail: { from: hop.url, to: hop.location, message: `Redirect leaves the original domain boundaries (${currentHost} -> ${nextUrl.hostname}).` },
                                evidenceDto, executionId: ctx.executionId, collectionTime,
                                confidence: 0.7, confidenceSource: 'Domain Boundary Check', confidenceMethod: 'heuristic'
                            }));
                        }

                        currentProtocol = nextUrl.protocol;
                        currentHost = nextUrl.hostname;
                    } catch {
                        // Invalid location URL
                    }
                }
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
            supportedTargets: ['url'],
            riskContribution: 10,
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
            confidenceSource : confidenceSource || 'URL Inspection',
            confidenceMethod : confidenceMethod || 'protocol',
            detail,
            evidenceIds   : [evidenceDto.evidenceId],
            evidenceHash  : evidenceDto.sha256Hash,
            executionId,
            collectionTime,
        });
    }
}

module.exports = { UrlEngine, ENGINE_ID, FINDING_SPECS };
