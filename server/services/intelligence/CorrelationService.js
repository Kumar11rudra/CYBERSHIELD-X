const { computeCorrelation } = require('../../IOCCorrelationEngine');
const { checkSSLCertificate } = require('../../cronService');
const logger = require('../../../utils/logger');

class CorrelationService {
    constructor(deps) {
        this.correlationRepo = deps.correlationRepo;
        this.iocRepo = deps.iocRepo;
        this.threatFeedRepo = deps.threatFeedRepo;
        // The following repositories are injected from the Governance domain
        this.assetRepo = deps.assetRepo;
        this.scanRepo = deps.scanRepo;
        this.eventPublisher = deps.eventPublisher;
    }

    async correlateTarget(target, targetType, userId) {
        try {
            if (this.eventPublisher) {
                this.eventPublisher.publish('CORRELATION_STARTED', { target, targetType, userId });
            }

            const cleanTarget = target.trim().toLowerCase().replace(/^https?:\/\//, '').split('/')[0];

            // 1. Load Required Intelligence
            const iocMatch = await this.iocRepo.findOne({ value: target.toLowerCase() });
            const feedMatch = await this.threatFeedRepo.findOne({ indicator: target.toLowerCase() });
            const asset = this.assetRepo ? await this.assetRepo.findOne({ userId, hostname: cleanTarget }) : null;
            
            let latestScan = null;
            if (this.scanRepo) {
                const scans = await this.scanRepo.findMany({ 
                    userId, 
                    target: { $regex: new RegExp(cleanTarget, 'i') }, 
                    status: 'completed' 
                });
                if (scans && scans.length > 0) {
                    scans.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                    latestScan = scans[0];
                }
            }

            let sslRes = null;
            if (targetType === 'domain' || targetType === 'url') {
                sslRes = await checkSSLCertificate(cleanTarget);
            }

            const intelData = {
                iocMatch,
                feedMatch,
                asset,
                latestScan,
                sslRes
            };

            // 2. Invoke IOCCorrelationEngine
            const result = computeCorrelation(target, targetType, intelData);

            // 3. Persist CorrelationRecord
            const correlationData = {
                userId,
                target,
                riskScore: result.score,
                riskLevel: result.riskLevel,
                findings: result.findings
            };

            const correlationRecord = await this.correlationRepo.create(correlationData);

            logger.info(`[CORRELATION] Correlated target ${target}: Score ${result.score} [${result.riskLevel}]`);

            // 4. Publish CORRELATION_COMPLETED
            if (this.eventPublisher) {
                this.eventPublisher.publish('CORRELATION_COMPLETED', {
                    correlationId: correlationRecord.id,
                    target,
                    riskScore: result.score,
                    riskLevel: result.riskLevel
                });
            }

            // 5. Return DTO
            return {
                success: true,
                correlation: correlationRecord
            };
        } catch (error) {
            logger.error(`[CORRELATION] Engine processing failed for ${target}: ${error.message}`);
            
            if (this.eventPublisher) {
                this.eventPublisher.publish('CORRELATION_FAILED', { target, error: error.message });
            }

            throw error;
        }
    }

    async getRecentCorrelations(userId, limit = 10) {
        const records = await this.correlationRepo.findMany({ userId });
        records.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        return records.slice(0, limit);
    }
}

module.exports = CorrelationService;
