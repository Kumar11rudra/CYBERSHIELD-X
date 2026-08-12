'use strict';

const { IIntelligenceEngine } = require('../interfaces/IIntelligenceEngine');
const { FindingDTO }          = require('../dtos/FindingDTO');

const ENGINE_ID      = 'whois';
const ENGINE_NAME    = 'WhoisEngine';
const ENGINE_VERSION = '1.0.0';

const FINDING_SPECS = Object.freeze({
    newly_registered_domain      : { severity: 'high',   weight: 55 },
    expiring_domain              : { severity: 'medium', weight: 30 },
    privacy_protected_registration: { severity: 'low',   weight: 15 },
    whois_data_unavailable       : { severity: 'info',   weight: 5  },
});

// Date-related thresholds
const NEWLY_REGISTERED_DAYS = 90;   // Flag domains created within last 90 days
const EXPIRING_SOON_DAYS    = 30;   // Flag domains expiring within 30 days

class WhoisEngine extends IIntelligenceEngine {
    /**
     * @param {import('../network/TcpClient').TcpClient} tcpClient
     * @param {import('../interfaces/IEvidenceStorage').IEvidenceStorage} evidenceStorage
     */
    constructor(tcpClient, evidenceStorage) {
        super();
        if (!tcpClient)       throw new TypeError('[WhoisEngine] tcpClient is required.');
        if (!evidenceStorage) throw new TypeError('[WhoisEngine] evidenceStorage is required.');
        this._tcpClient       = tcpClient;
        this._evidenceStorage = evidenceStorage;
    }

    async initialize() {}

    supports(targetDTO) {
        return targetDTO && targetDTO.type === 'domain';
    }

    /**
     * @param {import('../dtos/TargetDTO').TargetDTO} targetDTO
     * @param {import('../network/NetworkExecutionContext').NetworkExecutionContext} ctx
     * @returns {Promise<{data: Buffer, contentType: string}[]>}
     */
    async collect(targetDTO, ctx) {
        const domain = targetDTO.metadata.apexDomain || targetDTO.normalized;

        let whoisResponse;
        try {
            whoisResponse = await this._tcpClient.query(ctx, { mode: 'whois' });
        } catch (err) {
            return [{
                data: Buffer.from(JSON.stringify({ domain, error: err.message, protocol: 'error', at: new Date().toISOString() }), 'utf8'),
                contentType: 'json'
            }];
        }

        return [{
            data: Buffer.from(JSON.stringify(whoisResponse), 'utf8'),
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
            const whoisResponse = JSON.parse(rawBytes.toString('utf8'));
            const domain = whoisResponse.target || whoisResponse.domain;

            const referenceTimeStr = whoisResponse.collectedAt || whoisResponse.queriedAt || whoisResponse.at || (ctx && ctx.startedAt);
            const now = referenceTimeStr ? new Date(referenceTimeStr).getTime() : Date.now();

            if (whoisResponse.protocol === 'error') {
                findings.push(this._mkFinding('whois_data_unavailable', {
                    detail       : { domain, error: whoisResponse.error, fallbackAttempted: true },
                    evidenceDto,
                    executionId  : ctx.executionId,
                    collectionTime,
                    confidence   : 1.0,
                    confidenceSource: 'WHOIS Protocol Error',
                    confidenceMethod: 'protocol'
                }));
                continue;
            }

            const parsed = whoisResponse.protocol === 'rdap'
                ? this._parseRdap(whoisResponse.rdapJson)
                : this._parseWhoisText(whoisResponse.rawText);

            if (parsed.creationDate) {
                const ageDays = (now - parsed.creationDate.getTime()) / 86400000;
                if (ageDays < NEWLY_REGISTERED_DAYS) {
                    findings.push(this._mkFinding('newly_registered_domain', {
                        detail: {
                            domain,
                            creationDate : parsed.creationDate.toISOString(),
                            ageDays      : Math.round(ageDays),
                            message      : `Domain registered only ${Math.round(ageDays)} days ago.`,
                        },
                        evidenceDto, executionId: ctx.executionId, collectionTime,
                        confidence: 0.9, confidenceSource: 'Registration Date Parse', confidenceMethod: 'deterministic'
                    }));
                }
            }

            if (parsed.expiryDate) {
                const daysToExpiry = (parsed.expiryDate.getTime() - now) / 86400000;
                if (daysToExpiry > 0 && daysToExpiry < EXPIRING_SOON_DAYS) {
                    findings.push(this._mkFinding('expiring_domain', {
                        detail: {
                            domain,
                            expiryDate    : parsed.expiryDate.toISOString(),
                            daysToExpiry  : Math.round(daysToExpiry),
                            message       : `Domain expires in ${Math.round(daysToExpiry)} days.`,
                        },
                        evidenceDto, executionId: ctx.executionId, collectionTime,
                        confidence: 0.9, confidenceSource: 'Expiry Date Parse', confidenceMethod: 'deterministic'
                    }));
                }
            }

            const privacyKeywords = ['privacy', 'redacted', 'whoisguard', 'contactprivacy', 'withheld'];
            const registrantLower = (parsed.registrantName || '').toLowerCase();
            if (privacyKeywords.some(k => registrantLower.includes(k))) {
                findings.push(this._mkFinding('privacy_protected_registration', {
                    detail: {
                        domain,
                        registrantName: parsed.registrantName,
                        message       : 'Registrant identity is privacy-protected.',
                    },
                    evidenceDto, executionId: ctx.executionId, collectionTime,
                    confidence: 0.8, confidenceSource: 'Privacy Keyword Match', confidenceMethod: 'heuristic'
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
            const result = await this._tcpClient.healthCheck();
            return {
                status   : result.healthy ? 'healthy' : 'degraded',
                latencyMs: result.latencyMs,
                message  : result.healthy ? 'WHOIS client operational.' : 'WHOIS server unreachable.',
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
            supportedProtocols: ['whois', 'rdap'],
            supportedTargets: ['domain'],
            riskContribution: 10,
            requiredClients: ['TcpClient'],
            minimumNodeVersion: '18.0.0',
            defaultTimeout: 10000,
            retryPolicy: { maxRetries: 1, backoffMs: 1000 }
        };
    }

    // ── WHOIS text parser ───────────────────────────────────────────────────

    _parseWhoisText(rawText) {
        const text = rawText || '';
        return {
            creationDate   : this._extractDate(text, [
                /creation date:\s*(.+)/i,
                /created:\s*(.+)/i,
                /registered:\s*(.+)/i,
                /registration time:\s*(.+)/i,
            ]),
            expiryDate     : this._extractDate(text, [
                /registry expiry date:\s*(.+)/i,
                /expiration date:\s*(.+)/i,
                /expires:\s*(.+)/i,
                /expiry date:\s*(.+)/i,
                /paid-till:\s*(.+)/i,
            ]),
            registrar      : this._extractField(text, [/registrar:\s*(.+)/i, /sponsoring registrar:\s*(.+)/i]),
            registrantName : this._extractField(text, [/registrant name:\s*(.+)/i, /registrant organization:\s*(.+)/i, /registrant:\s*(.+)/i]),
        };
    }

    _parseRdap(json) {
        if (!json) return {};
        const events = (json.events || []);
        const findEvent = (action) => {
            const e = events.find(ev => ev.eventAction === action);
            return e ? new Date(e.eventDate) : null;
        };

        const entities  = (json.entities || []);
        const registrant = entities.find(e => (e.roles || []).includes('registrant'));
        const regName    = registrant
            ? (registrant.vcardArray || []).flat().find(a => Array.isArray(a) && a[0] === 'fn')?.[3]
            : null;

        return {
            creationDate   : findEvent('registration'),
            expiryDate     : findEvent('expiration'),
            registrar      : json.handle || null,
            registrantName : regName || null,
        };
    }

    _extractDate(text, patterns) {
        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match) {
                const d = new Date(match[1].trim().replace(/\s+/g, ' '));
                if (!isNaN(d.getTime())) return d;
            }
        }
        return null;
    }

    _extractField(text, patterns) {
        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match) return match[1].trim();
        }
        return null;
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
            confidenceSource : confidenceSource || 'WHOIS Record',
            confidenceMethod : confidenceMethod || 'protocol',
            detail,
            evidenceIds   : [evidenceDto.evidenceId],
            evidenceHash  : evidenceDto.sha256Hash,
            executionId,
            collectionTime,
        });
    }
}

module.exports = { WhoisEngine, ENGINE_ID, FINDING_SPECS };
