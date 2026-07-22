'use strict';

const { IIntelligenceEngine } = require('../interfaces/IIntelligenceEngine');
const { FindingDTO }          = require('../dtos/FindingDTO');

const ENGINE_ID      = 'service_fingerprint';
const ENGINE_NAME    = 'ServiceFingerprintEngine';
const ENGINE_VERSION = '1.0.0';

const FINDING_SPECS = Object.freeze({
    outdated_apache               : { severity: 'medium', weight: 40 },
    outdated_openssh              : { severity: 'medium', weight: 45 },
    anonymous_ftp_enabled         : { severity: 'high',   weight: 70 },
    default_database_port_exposed : { severity: 'high',   weight: 60 },
});

const fs = require('fs');
const path = require('path');
const { SignatureLoadError } = require('../errors/CsiErrors');

let PROBE_PORTS = [];

class ServiceFingerprintEngine extends IIntelligenceEngine {
    /**
     * @param {import('../network/TcpClient').TcpClient} tcpClient
     * @param {import('../interfaces/IEvidenceStorage').IEvidenceStorage} evidenceStorage
     */
    constructor(tcpClient, evidenceStorage) {
        super();
        if (!tcpClient) throw new TypeError('[ServiceFingerprintEngine] tcpClient is required.');
        if (!evidenceStorage) throw new TypeError('[ServiceFingerprintEngine] evidenceStorage is required.');
        this._tcpClient       = tcpClient;
        this._evidenceStorage = evidenceStorage;
    }

    async initialize() {
        const sigPath = path.join(__dirname, '../signatures/service-signatures.json');
        try {
            const data = fs.readFileSync(sigPath, 'utf8');
            PROBE_PORTS = JSON.parse(data);
        } catch (err) {
            throw new SignatureLoadError(`Failed to load service signatures from ${sigPath}: ${err.message}`, { path: sigPath });
        }
    }

    supports(targetDTO) {
        return targetDTO && (targetDTO.type === 'ip' || targetDTO.type === 'domain');
    }

    /**
     * @param {import('../dtos/TargetDTO').TargetDTO} targetDTO
     * @param {import('../network/NetworkExecutionContext').NetworkExecutionContext} ctx
     */
    async collect(targetDTO, ctx) {
        const target = targetDTO.metadata.apexDomain || targetDTO.normalized;
        const { NetworkExecutionContext } = require('../network/NetworkExecutionContext');

        const results = [];
        
        for (const probe of PROBE_PORTS) {
            const childCtx = new NetworkExecutionContext({
                executionId: ctx.executionId,
                targetId: target,
                timeout: 3000,
                retryPolicy: { maxRetries: 0, backoffMs: 0 }
            });
            try {
                const res = await this._tcpClient.query(childCtx, { 
                    mode: 'banner', 
                    port: probe.port, 
                    payload: probe.payload 
                });
                if (res.status === 'open' && res.data && res.data.length > 0) {
                    results.push({
                        port: probe.port,
                        banner: res.data.toString('utf8'),
                        bannerHex: res.data.toString('hex')
                    });
                }
            } catch (err) {
                // Ignore errors, port might be closed
            }
        }

        const payload = {
            target,
            results,
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
            const target = payload.target;
            const results = payload.results || [];

            for (const res of results) {
                const banner = res.banner.toLowerCase();

                // FTP
                if (res.port === 21) {
                    if (banner.includes('220 ') && banner.includes('ftp')) {
                        // Very naive check for anonymous FTP
                        // Realistically we'd need to send USER anonymous
                        if (banner.includes('anonymous')) {
                            findings.push(this._mkFinding('anonymous_ftp_enabled', {
                                detail: { target, port: 21, banner: res.banner, message: 'FTP server appears to allow anonymous login based on banner.' },
                                evidenceDto, executionId: ctx.executionId, collectionTime,
                                confidence: 0.6, confidenceSource: 'Banner Grab', confidenceMethod: 'heuristic'
                            }));
                        }
                    }
                }

                // SSH
                if (res.port === 22) {
                    // Check for old OpenSSH versions < 8.0
                    const match = banner.match(/openssh_([0-9]+)\./);
                    if (match && parseInt(match[1]) < 8) {
                        findings.push(this._mkFinding('outdated_openssh', {
                            detail: { target, port: 22, banner: res.banner, message: `Outdated OpenSSH version detected: OpenSSH ${match[1]}.x` },
                            evidenceDto, executionId: ctx.executionId, collectionTime,
                            confidence: 0.9, confidenceSource: 'Banner Match', confidenceMethod: 'deterministic'
                        }));
                    }
                }

                // HTTP (Apache)
                if (res.port === 80) {
                    const match = banner.match(/server: apache\/([0-9]+\.[0-9]+)/);
                    if (match) {
                        const version = parseFloat(match[1]);
                        if (version < 2.4) {
                            findings.push(this._mkFinding('outdated_apache', {
                                detail: { target, port: 80, banner: res.banner, message: `Outdated Apache version detected: ${match[1]}` },
                                evidenceDto, executionId: ctx.executionId, collectionTime,
                                confidence: 0.9, confidenceSource: 'Banner Match', confidenceMethod: 'deterministic'
                            }));
                        }
                    }
                }

                // DB Ports
                if (res.port === 3306 || res.port === 5432) {
                    findings.push(this._mkFinding('default_database_port_exposed', {
                        detail: { target, port: res.port, banner: res.banner, message: `Database service is responding to probes on port ${res.port}.` },
                        evidenceDto, executionId: ctx.executionId, collectionTime,
                        confidence: 1.0, confidenceSource: 'Banner Read', confidenceMethod: 'protocol'
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
            const result = await this._tcpClient.healthCheck();
            return {
                status   : result.healthy ? 'healthy' : 'degraded',
                latencyMs: result.latencyMs,
                message  : result.healthy ? 'TCP client operational.' : 'TCP client unreachable.',
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
            supportedProtocols: ['tcp'],
            supportedTargets: ['ip', 'domain'],
            riskContribution: 30,
            requiredClients: ['TcpClient'],
            minimumNodeVersion: '18.0.0',
            defaultTimeout: 10000,
            retryPolicy: { maxRetries: 0, backoffMs: 0 }
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
            confidenceSource : confidenceSource || 'Banner Analysis',
            confidenceMethod : confidenceMethod || 'protocol',
            detail,
            evidenceIds   : [evidenceDto.evidenceId],
            evidenceHash  : evidenceDto.sha256Hash,
            executionId,
            collectionTime,
        });
    }
}

module.exports = { ServiceFingerprintEngine, ENGINE_ID, FINDING_SPECS };
