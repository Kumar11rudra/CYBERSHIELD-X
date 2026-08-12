const ScanDTO = require('./dto/ScanDTO');
const { detectInputType, normalizeScanTarget } = require('../../utils/validators');
const cache = require('../../utils/cache');
const crypto = require('crypto');
const logger = require('../../utils/logger');
const { classifyIncident } = require('../incidentClassifier');
const SOAREngine = require('../soarEngine');
const { workflowManager } = require('../../controllers/chatbot/chatbotController'); // Refactor later if Chatbot also gets decoupled, but OK for now.

/**
 * @module ScanService
 * @description Domain service for managing and executing scans.
 */
class ScanService {
    constructor(deps) {
        this.scanRepo = deps.scanRepo;
        this.userRepo = deps.userRepo; // Injected from Identity Domain
        this.storageProvider = deps.storageProvider; // Fallback for un-migrated domains (ActivityLog)
    }

    async performScan(userId, ip, userAgent, target) {
        const normalizedTarget = normalizeScanTarget(target);
        if (!normalizedTarget) {
            throw new Error('Invalid target. Please enter a valid URL, domain, IP address, or MD5/SHA hash.');
        }

        const targetType = detectInputType(normalizedTarget);
        if (!targetType) {
            throw new Error('Invalid target. Please enter a valid URL, domain, IP address, or MD5/SHA hash.');
        }

        // CHECK CACHE
        const intelCacheKey = `intel:${targetType}:${normalizedTarget}`;
        const cachedIntel = await cache.get(intelCacheKey);

        let vtResult, abuseResult, DnsEngineResult, UrlEngineResult;

        if (cachedIntel) {
            ({ vtResult, abuseResult, DnsEngineResult, UrlEngineResult } = cachedIntel);
        } else {
            logger.info(`[V13-PIPELINE] Initiating Workflow Scan on Target: ${normalizedTarget} [${targetType}]`);
            
            let templateId = 'tpl-quick-scan';
            if (targetType === 'url' || targetType === 'domain') {
                templateId = 'tpl-full-web';
            }

            // Phase 17: Anonymous scans use 'guest' as workflow ownerId to satisfy model constraints.
            const workflowOwnerId = userId ? userId.toString() : 'guest';
            const workflowStartResult = await workflowManager.startWorkflow(templateId, workflowOwnerId, { target: normalizedTarget });
            
            if (!workflowStartResult.success) {
                throw new Error(workflowStartResult.error || 'Workflow execution failed to start');
            }

            let execution = workflowStartResult.execution;
            // Compatibility polling for legacy synchronous API behavior
            while(execution.status === 'PENDING' || execution.status === 'RUNNING') {
                await new Promise(r => setTimeout(r, 100));
                execution = await workflowManager.getExecution(execution.executionId);
            }

            const intel = execution.result?.intelligenceReport;
            const findings = intel?.findings || [];
            const criticalCount = intel?.metrics?.criticalCount || 0;
            const highCount = intel?.metrics?.highCount || 0;
            const totalCount = intel?.metrics?.totalCorrelations || 0;

            const isMalicious = (criticalCount + highCount) > 0;

            vtResult = {
                source: 'V13_Workflow_Engine',
                type: targetType,
                malicious: isMalicious ? 1 : 0,
                harmless: isMalicious ? 0 : 1,
                total: totalCount || 1,
                permalink: 'V13 Workflow Scan',
                note: `V13 Workflow ${templateId} executed successfully.`,
                rawLog: intel?.executiveSummary || 'No summary available.'
            };

            abuseResult = {
                source: 'V13_Workflow_Engine',
                note: 'Legacy UrlEngine checks migrated to V13 pipelines.',
                rawLog: 'Migrated to V13.'
            };

            DnsEngineResult = {
                source: 'V13_Workflow_Engine',
                domain: targetType !== 'ip' ? normalizedTarget : 'n/a',
                riskScore: totalCount > 0 ? (isMalicious ? 90 : 20) : 0,
                riskFactors: findings.map(f => f.title).slice(0, 5)
            };

            UrlEngineResult = {
                source: 'V13_Workflow_Engine',
                found: false,
                note: 'Integrated into V13 pipelines.'
            };
        }

        // FETCH LOCATION (Offline Geolocation Bypass)
        let location = null;
        try {
            const axios = require('axios');
            let lookupTarget = "";
            if (targetType === 'ip') lookupTarget = normalizedTarget;
            else if (targetType === 'domain') lookupTarget = normalizedTarget;
            else if (targetType === 'url') lookupTarget = new URL(normalizedTarget).hostname;

            if (lookupTarget && lookupTarget !== '127.0.0.1' && lookupTarget !== 'localhost') {
                const geoRes = await axios.get(`https://ipwho.is/${lookupTarget}`, { timeout: 3000 });
                if (geoRes.data.success !== false) {
                    location = {
                        lat: geoRes.data.latitude,
                        lon: geoRes.data.longitude,
                        country: geoRes.data.country,
                        city: geoRes.data.city,
                        countryCode: geoRes.data.country_code
                    };
                }
            }
        } catch (err) {
            logger.warn('[NLEM] Geo Lookup skipped or failed: ' + err.message);
        }

        let score = 0;
        if (vtResult.malicious > 0) score += 40;
        if (DnsEngineResult.riskScore > 50) score += 30;
        if (UrlEngineResult.found) score += 30;
        score = Math.min(score, 100);

        const riskLevel = score >= 75 ? 'dangerous' : score >= 50 ? 'medium' : score >= 20 ? 'low' : 'safe';

        const analysis = {
            score,
            risk: { level: riskLevel },
            sourceScores: {
                UrlEngine: vtResult.malicious ? 80 : 0,
                UrlEngine: 0,
                DnsEngine: DnsEngineResult.riskScore,
                UrlEngine: UrlEngineResult.found ? 100 : 0,
            }
        };

        const incident = classifyIncident({ 
            score: analysis.score, 
            tags: analysis.risk.level === 'dangerous' ? ['active-malware', 'high-risk-vector'] : [] 
        });
        
        await SOAREngine.orchestrateResponse(incident, { 
            target: normalizedTarget,
            type: targetType
        });

        // Save to database
        const scan = await this.scanRepo.create({
            userId,
            target: normalizedTarget,
            targetType,
            threatScore: analysis.score,
            riskLevel: analysis.risk.level,
            incidentTier: incident.label, 
            sourceScores: analysis.sourceScores,
            breakdown: {
                UrlEngine: vtResult,
                UrlEngine: abuseResult,
                DnsEngine: DnsEngineResult,
                UrlEngine: UrlEngineResult,
            },
            location,
        });

        // Update user scan count (Using UserRepo from Identity Domain)
        if (this.userRepo) {
            const user = await this.userRepo.findById(userId);
            if (user) {
                user.totalScans = (user.totalScans || 0) + 1;
                await this.userRepo.update(user);
            }
        }

        // LOG ACTIVITY
        if (this.storageProvider) {
            try {
                // Using IStorageProvider directly for ActivityLog since it's not migrated yet. No direct Mongoose model import.
                const ActivityLogModel = this.storageProvider._getModel('activity_logs');
                if (ActivityLogModel) {
                   await ActivityLogModel.create({
                        userId: userId,
                        action: 'SCAN_COMPLETED',
                        metadata: {
                            ip: ip,
                            userAgent: userAgent,
                            target: normalizedTarget,
                            details: `Local NLEM Scan Score: ${analysis.score} (${analysis.risk.level})`
                        }
                    });
                }
            } catch (logErr) {
                console.error('[AUDIT ERROR] Failed to log scan activity via StorageProvider:', logErr.message);
            }
        }

        const scanResponse = {
            id: scan.id,
            target: scan.target,
            targetType: scan.targetType,
            threatScore: analysis.score,
            risk: analysis.risk,
            sourceScores: analysis.sourceScores,
            breakdown: scan.breakdown,
            scannedAt: scan.createdAt,
            location,
        };

        if (process.env.SCAN_HMAC_KEY) {
            const payloadToSign = `${scan.id}:${scan.target}:${analysis.score}:${analysis.risk.level}`;
            scanResponse.signature = crypto
                .createHmac('sha256', process.env.SCAN_HMAC_KEY)
                .update(payloadToSign)
                .digest('hex');
        }

        if (!cachedIntel) {
            await cache.set(intelCacheKey, { vtResult, abuseResult, DnsEngineResult, UrlEngineResult }, 86400);
        }

        return scanResponse;
    }

    verifyScanSignature(scanId, target, threatScore, riskLevel, signature) {
        if (!scanId || !target || threatScore === undefined || !riskLevel || !signature) {
            throw new Error('Missing required verification fields.');
        }
        if (!process.env.SCAN_HMAC_KEY) {
            throw new Error('Scan signature verification is not configured.');
        }
        if (!/^[a-f0-9]{64}$/i.test(String(signature))) {
            throw new Error('Invalid signature format.');
        }

        const payloadToSign = `${scanId}:${target}:${threatScore}:${riskLevel}`;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.SCAN_HMAC_KEY)
            .update(payloadToSign)
            .digest('hex');
        
        const provided = Buffer.from(String(signature), 'hex');
        const expected = Buffer.from(expectedSignature, 'hex');

        if (provided.length === expected.length && crypto.timingSafeEqual(provided, expected)) {
            return true;
        } else {
            throw new Error('TAMPER DETECTED: This scan report has been altered!');
        }
    }
}

module.exports = ScanService;
