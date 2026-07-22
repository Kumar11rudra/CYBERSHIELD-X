'use strict';

const { IIntelligenceEngine } = require('../interfaces/IIntelligenceEngine');
const { FindingDTO }          = require('../dtos/FindingDTO');

const ENGINE_ID      = 'ssl';
const ENGINE_NAME    = 'SslEngine';
const ENGINE_VERSION = '1.0.0';

const FINDING_SPECS = Object.freeze({
    expired_ssl_certificate  : { severity: 'critical', weight: 90 },
    cert_expiring_soon       : { severity: 'high',     weight: 55 },
    self_signed_certificate  : { severity: 'high',     weight: 60 },
    tls_version_deprecated   : { severity: 'medium',   weight: 40 },
    weak_cipher              : { severity: 'high',     weight: 70 },
    san_mismatch             : { severity: 'critical', weight: 80 },
    no_ssl_certificate       : { severity: 'critical', weight: 95 },
});

/** Ciphers considered weak (substring match on the cipher name) */
const WEAK_CIPHER_PATTERNS = ['RC4', 'DES', 'NULL', 'EXPORT', 'MD5', 'ADH', 'AECDH', '3DES'];

/** Protocols that are deprecated */
const DEPRECATED_PROTOCOLS = ['TLSv1', 'TLSv1.1', 'SSLv2', 'SSLv3'];

/** Days before expiry to raise cert_expiring_soon */
const EXPIRY_WARN_DAYS = 30;

class SslEngine extends IIntelligenceEngine {
    /**
     * @param {import('../network/TlsClient').TlsClient} tlsClient
     * @param {import('../interfaces/IEvidenceStorage').IEvidenceStorage} evidenceStorage
     */
    constructor(tlsClient, evidenceStorage) {
        super();
        if (!tlsClient)       throw new TypeError('[SslEngine] tlsClient is required.');
        if (!evidenceStorage) throw new TypeError('[SslEngine] evidenceStorage is required.');
        this._tlsClient       = tlsClient;
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
        const host = targetDTO.metadata.host || targetDTO.metadata.apexDomain || targetDTO.normalized;
        // Target host for TLSClient is set in ctx.targetId, but we might have overwritten it in context creation?
        // Wait, EngineRunner uses targetDTO.normalized for ctx.targetId. If it's a URL, we might need just the host.
        // The EngineRunner creates ctx with targetDTO.normalized.
        // We need to pass the hostname to TLSClient, so we'll adjust the ctx or pass custom params.
        
        let tlsResponse;
        try {
            // TlsClient reads targetId from ctx. We can use a child context to override the targetId to just the host.
            const { NetworkExecutionContext } = require('../network/NetworkExecutionContext');
            const hostCtx = new NetworkExecutionContext({
                executionId: ctx.executionId,
                targetId: host,
                timeout: ctx.timeout,
                retryPolicy: ctx.retryPolicy
            });
            tlsResponse = await this._tlsClient.query(hostCtx, { port: 443 });
        } catch (err) {
            return [{
                data: Buffer.from(JSON.stringify({ host, error: err.message, at: new Date().toISOString() }), 'utf8'),
                contentType: 'json'
            }];
        }

        const pemBuffer = Buffer.from(tlsResponse.pem || '', 'utf8');
        const metaJson = Buffer.from(JSON.stringify({
            host,
            cipher      : tlsResponse.cipher,
            protocol    : tlsResponse.protocol,
            authorized  : tlsResponse.authorized,
            authError   : tlsResponse.authorizationError,
            chainDepth  : (tlsResponse.chain || []).length,
            connectedAt : tlsResponse.connectedAt,
            parsed      : tlsResponse.parsed,
        }, null, 2), 'utf8');

        return [
            { data: pemBuffer, contentType: 'pem' },
            { data: metaJson, contentType: 'json' }
        ];
    }

    /**
     * @param {import('../dtos/EvidenceDTO').EvidenceDTO[]} evidenceDTOs
     * @param {import('../network/NetworkExecutionContext').NetworkExecutionContext} ctx
     */
    async parse(evidenceDTOs, ctx) {
        if (!evidenceDTOs || evidenceDTOs.length === 0) return [];
        
        // Find JSON evidence which contains metadata
        const jsonEvidence = evidenceDTOs.find(e => e.contentType === 'json');
        const pemEvidence = evidenceDTOs.find(e => e.contentType === 'pem');
        
        if (!jsonEvidence) return [];

        const rawJsonBytes = await this._evidenceStorage.retrieve(jsonEvidence.evidenceId);
        const metaData = JSON.parse(rawJsonBytes.toString('utf8'));
        const host = metaData.host;

        const findings = [];
        const collectionTime = new Date().toISOString();
        const now = Date.now();

        if (metaData.error) {
            findings.push(this._mkFinding('no_ssl_certificate', {
                detail      : { host, error: metaData.error, message: 'TLS connection failed — no certificate obtainable.' },
                evidenceDto : jsonEvidence,
                executionId : ctx.executionId,
                collectionTime,
                confidence  : 1.0,
                confidenceSource: 'TLS Protocol Error',
                confidenceMethod: 'protocol'
            }));
            return findings;
        }

        const parsed = metaData.parsed;
        if (parsed) {
            const validFrom = new Date(parsed.validFrom);
            const validTo   = new Date(parsed.validTo);

            if (validTo.getTime() < now) {
                findings.push(this._mkFinding('expired_ssl_certificate', {
                    detail: {
                        host,
                        expiredAt  : validTo.toISOString(),
                        daysExpired: Math.round((now - validTo.getTime()) / 86400000),
                        subject    : parsed.subject,
                        message    : `Certificate expired ${Math.round((now - validTo.getTime()) / 86400000)} days ago.`,
                    },
                    evidenceDto: pemEvidence || jsonEvidence, executionId: ctx.executionId, collectionTime,
                    confidence: 1.0, confidenceSource: 'Certificate ValidTo', confidenceMethod: 'deterministic'
                }));
            } else {
                const daysLeft = (validTo.getTime() - now) / 86400000;
                if (daysLeft < EXPIRY_WARN_DAYS) {
                    findings.push(this._mkFinding('cert_expiring_soon', {
                        detail: {
                            host,
                            expiresAt  : validTo.toISOString(),
                            daysLeft   : Math.round(daysLeft),
                            message    : `Certificate expires in ${Math.round(daysLeft)} days.`,
                        },
                        evidenceDto: pemEvidence || jsonEvidence, executionId: ctx.executionId, collectionTime,
                        confidence: 1.0, confidenceSource: 'Certificate ValidTo', confidenceMethod: 'deterministic'
                    }));
                }
            }

            const authErr = (metaData.authError || '').toUpperCase();
            if (authErr.includes('SELF_SIGNED') || authErr.includes('DEPTH_ZERO')) {
                findings.push(this._mkFinding('self_signed_certificate', {
                    detail: {
                        host,
                        subject         : parsed.subject,
                        issuer          : parsed.issuer,
                        authorizationError: metaData.authError,
                        message         : 'Certificate is self-signed or uses a self-signed chain.',
                    },
                    evidenceDto: pemEvidence || jsonEvidence, executionId: ctx.executionId, collectionTime,
                    confidence: 1.0, confidenceSource: 'Node.js TLS Authorization', confidenceMethod: 'deterministic'
                }));
            }

            if (parsed.subjectAltName) {
                const covered = this._hostCoveredBySan(host, parsed.subjectAltName);
                if (!covered) {
                    findings.push(this._mkFinding('san_mismatch', {
                        detail: {
                            host,
                            subjectAltName: parsed.subjectAltName,
                            message       : `Host "${host}" is not listed in certificate SANs.`,
                        },
                        evidenceDto: pemEvidence || jsonEvidence, executionId: ctx.executionId, collectionTime,
                        confidence: 1.0, confidenceSource: 'SAN Check', confidenceMethod: 'deterministic'
                    }));
                }
            }
        }

        const protocol = metaData.protocol || '';
        if (DEPRECATED_PROTOCOLS.some(d => protocol.includes(d))) {
            findings.push(this._mkFinding('tls_version_deprecated', {
                detail: {
                    host,
                    protocol,
                    message: `Deprecated TLS protocol in use: ${protocol}.`,
                },
                evidenceDto: jsonEvidence, executionId: ctx.executionId, collectionTime,
                confidence: 1.0, confidenceSource: 'TLS Handshake', confidenceMethod: 'protocol'
            }));
        }

        const cipherName = (metaData.cipher && metaData.cipher.name) || '';
        if (WEAK_CIPHER_PATTERNS.some(w => cipherName.toUpperCase().includes(w))) {
            findings.push(this._mkFinding('weak_cipher', {
                detail: {
                    host,
                    cipherName,
                    message: `Weak cipher in use: ${cipherName}.`,
                },
                evidenceDto: jsonEvidence, executionId: ctx.executionId, collectionTime,
                confidence: 1.0, confidenceSource: 'TLS Handshake', confidenceMethod: 'protocol'
            }));
        }

        return findings;
    }

    async validate(findings) {
        return Array.isArray(findings) && findings.every(f => f instanceof FindingDTO);
    }

    async healthCheck() {
        const start = Date.now();
        try {
            const result = await this._tlsClient.healthCheck();
            return {
                status   : result.healthy ? 'healthy' : 'degraded',
                latencyMs: result.latencyMs,
                message  : result.healthy ? 'TLS client operational.' : 'TLS client unreachable.',
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
            supportedProtocols: ['tls'],
            supportedTargets: ['domain', 'url'],
            riskContribution: 20,
            requiredClients: ['TlsClient'],
            minimumNodeVersion: '18.0.0',
            defaultTimeout: 10000,
            retryPolicy: { maxRetries: 1, backoffMs: 1000 }
        };
    }

    _hostCoveredBySan(host, sanString) {
        const lHost = host.toLowerCase();
        const sanEntries = sanString.split(',').map(s => s.trim());
        for (const entry of sanEntries) {
            const [type, value] = entry.split(':').map(s => s.trim());
            if (type === 'DNS' && value) {
                const lValue = value.toLowerCase();
                if (lValue === lHost) return true;
                if (lValue.startsWith('*.')) {
                    const suffix = lValue.slice(1);
                    if (lHost.endsWith(suffix) && !lHost.slice(0, -suffix.length).includes('.')) {
                        return true;
                    }
                }
            }
        }
        return false;
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
            confidenceSource : confidenceSource || 'TLS Inspection',
            confidenceMethod : confidenceMethod || 'deterministic',
            detail,
            evidenceIds   : [evidenceDto.evidenceId],
            evidenceHash  : evidenceDto.sha256Hash,
            executionId,
            collectionTime,
        });
    }
}

module.exports = { SslEngine, ENGINE_ID, FINDING_SPECS, WEAK_CIPHER_PATTERNS, DEPRECATED_PROTOCOLS };
