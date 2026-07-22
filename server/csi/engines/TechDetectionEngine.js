'use strict';

const { IIntelligenceEngine } = require('../interfaces/IIntelligenceEngine');
const { FindingDTO }          = require('../dtos/FindingDTO');

const ENGINE_ID      = 'tech_detection';
const ENGINE_NAME    = 'TechnologyDetectionEngine';
const ENGINE_VERSION = '1.0.0';

const FINDING_SPECS = Object.freeze({
    eol_cms_version         : { severity: 'high',   weight: 65 },
    outdated_framework      : { severity: 'medium', weight: 45 },
    mixed_content_served    : { severity: 'medium', weight: 30 },
});

const fs = require('fs');
const path = require('path');
const { SignatureLoadError } = require('../errors/CsiErrors');

let TECH_SIGNATURES = [];

class TechnologyDetectionEngine extends IIntelligenceEngine {
    /**
     * @param {import('../network/HttpClient').HttpClient} httpClient
     * @param {import('../interfaces/IEvidenceStorage').IEvidenceStorage} evidenceStorage
     */
    constructor(httpClient, evidenceStorage) {
        super();
        if (!httpClient) throw new TypeError('[TechnologyDetectionEngine] httpClient is required.');
        if (!evidenceStorage) throw new TypeError('[TechnologyDetectionEngine] evidenceStorage is required.');
        this._httpClient       = httpClient;
        this._evidenceStorage = evidenceStorage;
    }

    async initialize() {
        const sigPath = path.join(__dirname, '../signatures/technology-signatures.json');
        try {
            const data = fs.readFileSync(sigPath, 'utf8');
            const parsed = JSON.parse(data);
            TECH_SIGNATURES = parsed.map(sig => ({
                ...sig,
                regex: new RegExp(sig.regex, 'i'),
                versionRegex: sig.versionRegex ? new RegExp(sig.versionRegex, 'i') : undefined
            }));
        } catch (err) {
            throw new SignatureLoadError(`Failed to load technology signatures from ${sigPath}: ${err.message}`, { path: sigPath });
        }
    }

    supports(targetDTO) {
        return targetDTO && (targetDTO.type === 'domain' || targetDTO.type === 'url');
    }

    /**
     * @param {import('../dtos/TargetDTO').TargetDTO} targetDTO
     * @param {import('../network/NetworkExecutionContext').NetworkExecutionContext} ctx
     */
    async collect(targetDTO, ctx) {
        const domain = targetDTO.metadata.apexDomain || targetDTO.normalized;
        const targetUrl = targetDTO.type === 'url' ? targetDTO.rawInput : `https://${domain}`;
        
        const { NetworkExecutionContext } = require('../network/NetworkExecutionContext');
        const childCtx = new NetworkExecutionContext({
            executionId: ctx.executionId,
            targetId: targetUrl,
            timeout: ctx.timeout,
            retryPolicy: ctx.retryPolicy
        });

        let res;
        try {
            res = await this._httpClient.query(childCtx, { method: 'GET', followRedirects: true });
        } catch (err) {
            return [{
                data: Buffer.from(JSON.stringify({ error: err.message, targetUrl }), 'utf8'),
                contentType: 'json'
            }];
        }

        // Limit HTML snippet to first 10KB
        const bodySnippet = (res.body || '').substring(0, 10240);
        
        const payload = {
            targetUrl,
            finalUrl: res.finalUrl,
            statusCode: res.statusCode,
            headers: res.headers,
            bodySnippet,
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
            if (payload.error) continue;

            const html = payload.bodySnippet || '';
            const targetUrl = payload.targetUrl;

            // Tech detection
            for (const sig of TECH_SIGNATURES) {
                const match = html.match(sig.regex);
                if (match) {
                    const version = match[1];
                    
                    if (sig.name === 'WordPress' && version) {
                        const majorVersion = parseFloat(version);
                        if (majorVersion < 6.0) {
                            findings.push(this._mkFinding('eol_cms_version', {
                                detail: { targetUrl, cms: sig.name, version, message: `${sig.name} version ${version} is End-of-Life.` },
                                evidenceDto, executionId: ctx.executionId, collectionTime,
                                confidence: 0.9, confidenceSource: 'Regex Match', confidenceMethod: 'deterministic'
                            }));
                        }
                    }

                    if (sig.name === 'jQuery' && version) {
                        const majorVersion = parseFloat(version);
                        if (majorVersion < 3.0) {
                            findings.push(this._mkFinding('outdated_framework', {
                                detail: { targetUrl, framework: sig.name, version, message: `${sig.name} version ${version} is outdated and potentially vulnerable.` },
                                evidenceDto, executionId: ctx.executionId, collectionTime,
                                confidence: 0.9, confidenceSource: 'Regex Match', confidenceMethod: 'deterministic'
                            }));
                        }
                    }
                }
            }

            // Mixed content check (HTTPS page loading HTTP resources)
            if (targetUrl.startsWith('https://')) {
                // Simple regex to find src="http://" or href="http://"
                const mixedContentMatches = html.match(/(src|href)=["']http:\/\/[^"']+["']/gi);
                if (mixedContentMatches && mixedContentMatches.length > 0) {
                    findings.push(this._mkFinding('mixed_content_served', {
                        detail: { targetUrl, count: mixedContentMatches.length, sample: mixedContentMatches[0], message: 'Page loaded via HTTPS but requests HTTP resources.' },
                        evidenceDto, executionId: ctx.executionId, collectionTime,
                        confidence: 0.95, confidenceSource: 'HTML Inspection', confidenceMethod: 'deterministic'
                    }));
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
            confidenceSource : confidenceSource || 'Regex Signature',
            confidenceMethod : confidenceMethod || 'deterministic',
            detail,
            evidenceIds   : [evidenceDto.evidenceId],
            evidenceHash  : evidenceDto.sha256Hash,
            executionId,
            collectionTime,
        });
    }
}

module.exports = { TechnologyDetectionEngine, ENGINE_ID, FINDING_SPECS };
