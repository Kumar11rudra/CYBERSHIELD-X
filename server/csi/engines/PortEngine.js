'use strict';

const { IIntelligenceEngine } = require('../interfaces/IIntelligenceEngine');
const { FindingDTO }          = require('../dtos/FindingDTO');

const ENGINE_ID      = 'port';
const ENGINE_NAME    = 'PortEngine';
const ENGINE_VERSION = '1.0.0';

const FINDING_SPECS = Object.freeze({
    open_rdp_port          : { severity: 'high',   weight: 75 },
    open_telnet_port       : { severity: 'high',   weight: 80 },
    open_database_port     : { severity: 'medium', weight: 50 },
    open_smb_port          : { severity: 'high',   weight: 70 },
});

const DEFAULT_PORTS = [21, 22, 23, 25, 53, 80, 110, 143, 443, 445, 3306, 3389, 5432, 6379, 8080, 8443, 27017];

class PortEngine extends IIntelligenceEngine {
    /**
     * @param {import('../network/TcpClient').TcpClient} tcpClient
     * @param {import('../interfaces/IEvidenceStorage').IEvidenceStorage} evidenceStorage
     */
    constructor(tcpClient, evidenceStorage) {
        super();
        if (!tcpClient) throw new TypeError('[PortEngine] tcpClient is required.');
        if (!evidenceStorage) throw new TypeError('[PortEngine] evidenceStorage is required.');
        this._tcpClient       = tcpClient;
        this._evidenceStorage = evidenceStorage;
    }

    async initialize() {}

    supports(targetDTO) {
        return targetDTO && (targetDTO.type === 'ip' || targetDTO.type === 'domain');
    }

    /**
     * @param {import('../dtos/TargetDTO').TargetDTO} targetDTO
     * @param {import('../network/NetworkExecutionContext').NetworkExecutionContext} ctx
     */
    async collect(targetDTO, ctx) {
        const target = targetDTO.metadata.apexDomain || targetDTO.normalized;
        const ports = DEFAULT_PORTS;
        
        const { NetworkExecutionContext } = require('../network/NetworkExecutionContext');

        const { WorkerPool } = require('../concurrency/WorkerPool');
        const pool = new WorkerPool(10);

        const tasks = ports.map(port => async () => {
            const childCtx = new NetworkExecutionContext({
                executionId: ctx.executionId,
                targetId: target,
                timeout: 2000,
                retryPolicy: { maxRetries: 0, backoffMs: 0 }
            });
            try {
                return await this._tcpClient.query(childCtx, { mode: 'probe', port });
            } catch (err) {
                return { port, status: 'error', error: err.message };
            }
        });

        const poolResults = await pool.executeAll(tasks);
        // WorkerPool returns [{ status: 'fulfilled', value }, { status: 'rejected', reason }]
        // Because scanPort catches internally, they will all be fulfilled with the inner result
        const results = poolResults.map(r => r.value);

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
            const openPorts = payload.results.filter(r => r.status === 'open').map(r => r.port);

            if (openPorts.includes(3389)) {
                findings.push(this._mkFinding('open_rdp_port', {
                    detail: { target, port: 3389, message: 'RDP port is open to the internet.' },
                    evidenceDto, executionId: ctx.executionId, collectionTime,
                    confidence: 1.0, confidenceSource: 'TCP Connect', confidenceMethod: 'protocol'
                }));
            }

            if (openPorts.includes(23)) {
                findings.push(this._mkFinding('open_telnet_port', {
                    detail: { target, port: 23, message: 'Telnet port is open, which transmits data in cleartext.' },
                    evidenceDto, executionId: ctx.executionId, collectionTime,
                    confidence: 1.0, confidenceSource: 'TCP Connect', confidenceMethod: 'protocol'
                }));
            }

            const dbPorts = [3306, 5432, 6379, 27017];
            const openDbPorts = openPorts.filter(p => dbPorts.includes(p));
            if (openDbPorts.length > 0) {
                findings.push(this._mkFinding('open_database_port', {
                    detail: { target, ports: openDbPorts, message: `Database ports are exposed: ${openDbPorts.join(', ')}.` },
                    evidenceDto, executionId: ctx.executionId, collectionTime,
                    confidence: 1.0, confidenceSource: 'TCP Connect', confidenceMethod: 'protocol'
                }));
            }

            if (openPorts.includes(445)) {
                findings.push(this._mkFinding('open_smb_port', {
                    detail: { target, port: 445, message: 'SMB port is open, high risk of ransomware or lateral movement.' },
                    evidenceDto, executionId: ctx.executionId, collectionTime,
                    confidence: 1.0, confidenceSource: 'TCP Connect', confidenceMethod: 'protocol'
                }));
            }
        }
        return findings;
    }

    async validate(findings) {
        return Array.isArray(findings) && findings.every(f => f instanceof FindingDTO);
    }

    async healthCheck() {
        return {
            status: 'healthy',
            latencyMs: 1,
            message: 'PortEngine uses native net module. Always healthy.'
        };
    }

    metadata() {
        return {
            id: ENGINE_ID,
            version: ENGINE_VERSION,
            owner: 'CyberShield Intelligence Team',
            supportedProtocols: ['tcp'],
            supportedTargets: ['ip', 'domain'],
            riskContribution: 25,
            requiredClients: ['TcpClient'],
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
            confidenceSource : confidenceSource || 'Port Scan',
            confidenceMethod : confidenceMethod || 'protocol',
            detail,
            evidenceIds   : [evidenceDto.evidenceId],
            evidenceHash  : evidenceDto.sha256Hash,
            executionId,
            collectionTime,
        });
    }
}

module.exports = { PortEngine, ENGINE_ID, FINDING_SPECS };
