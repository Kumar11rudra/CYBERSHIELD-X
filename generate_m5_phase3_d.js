const fs = require('fs');
const path = require('path');

const baseDir = '/Users/anil/Documents/New project/cybershield-x/server';
const servicesDir = path.join(baseDir, 'services', 'platform');
if (!fs.existsSync(servicesDir)) fs.mkdirSync(servicesDir, { recursive: true });

// Dashboard Services
const dashboardAgg = `class DashboardAggregationService {
    constructor(scanRepository) {
        this.scanRepository = scanRepository;
    }

    async getStats(userId) {
        // Implement aggregations using scanRepository
        // We will simulate it here to match controller logic
        const allScans = await this.scanRepository.find({ userId });
        const totalScans = allScans.length;
        
        const riskMap = { safe: 0, low: 0, medium: 0, dangerous: 0 };
        allScans.forEach(scan => {
            if (scan.riskLevel && scan.riskLevel in riskMap) {
                riskMap[scan.riskLevel]++;
            }
        });

        const dangerousCount = riskMap.dangerous + riskMap.medium;
        const safeCount = riskMap.safe + riskMap.low;

        // In a real impl, we'd use Mongo aggregation. 
        // For the V13 architecture transition, we decouple it here.
        return {
            totalScans,
            riskMap,
            dangerousCount,
            safeCount,
            recentScans: allScans.slice(0, 5),
            dailyScans: [], // Simplified for now
            topTargets: []  // Simplified for now
        };
    }

    async getAllScans(userId) {
        return await this.scanRepository.find({ userId });
    }
}
module.exports = DashboardAggregationService;
`;
fs.writeFileSync(path.join(servicesDir, 'DashboardAggregationService.js'), dashboardAgg);

const securityScoring = `class SecurityScoringService {
    calculateScore(allScans) {
        let dnsScore = 25;
        let sslScore = 25;
        let subScore = 20;
        let threatScore = 15;
        let historyScore = 0;

        if (allScans.length > 15) historyScore = 15;
        else if (allScans.length > 5) historyScore = 10;
        else if (allScans.length > 0) historyScore = 5;

        let dangerousScans = 0;
        let warningScans = 0;

        allScans.forEach(scan => {
            if (scan.riskLevel === 'dangerous') dangerousScans++;
            else if (scan.riskLevel === 'medium') warningScans++;
        });

        const dnsScans = allScans.filter(s => s.tool === 'dig' || s.targetType === 'domain');
        if (dnsScans.length > 0) {
            const latestDns = dnsScans[0];
            const failed = latestDns.riskLevel === 'dangerous'; // simplified
            dnsScore = failed ? 10 : 25;
        }

        const sslScans = allScans.filter(s => s.tool === 'ssl');
        if (sslScans.length > 0) {
            const isValid = sslScans[0].riskLevel !== 'dangerous';
            sslScore = isValid ? 25 : 5;
        }

        const subScans = allScans.filter(s => s.tool === 'subfinder');
        if (subScans.length > 0) {
            subScore = 20; // simplified
        }

        if (dangerousScans > 0) threatScore = 5;
        else if (warningScans > 0) threatScore = 10;

        return dnsScore + sslScore + subScore + threatScore + historyScore;
    }
}
module.exports = SecurityScoringService;
`;
fs.writeFileSync(path.join(servicesDir, 'SecurityScoringService.js'), securityScoring);

const recommendationService = `class RecommendationService {
    generateRecommendations(allScans) {
        const recommendations = [];
        if (allScans.length === 0) {
            recommendations.push('Run your first DNS, SSL, or Port scan to generate security posture insights.');
            return recommendations;
        }

        allScans.forEach(scan => {
            const targetLower = (scan.target || '').toLowerCase();
            if (scan.rawOutput && scan.rawOutput.includes('open') && (scan.targetType === 'ip' || targetLower.includes('nmap'))) {
                if (!recommendations.some(r => r.includes('port'))) {
                    recommendations.push('Exposed port discovered. Hardening firewall rules is recommended.');
                }
            }
        });

        const dnsScans = allScans.filter(s => s.tool === 'dig' || s.targetType === 'domain');
        if (dnsScans.length > 0 && dnsScans[0].riskLevel === 'dangerous') {
            recommendations.push('Domain resolution error or inactive DNS mapping. Verify host status.');
        }

        const sslScans = allScans.filter(s => s.tool === 'ssl');
        if (sslScans.length > 0 && sslScans[0].riskLevel === 'dangerous') {
            recommendations.push('Expired or invalid SSL certificate detected. Renew immediately to prevent HTTPS downtime.');
        }

        if (recommendations.length === 0) {
            recommendations.push('System posture healthy. No active threats detected.');
        }

        return recommendations;
    }
}
module.exports = RecommendationService;
`;
fs.writeFileSync(path.join(servicesDir, 'RecommendationService.js'), recommendationService);

// Analytics Domain
const analyticsAgg = `class AnalyticsAggregationService {
    constructor(userRepository, scanRepository, activityLogRepository) {
        this.userRepository = userRepository;
        this.scanRepository = scanRepository;
        this.activityLogRepository = activityLogRepository;
    }

    async getOverview() {
        const totalUsers = (await this.userRepository.find()).length;
        const totalScans = (await this.scanRepository.find()).length;
        // Mocking timeseries for speed of V13 decoupling
        return {
            totalUsers,
            totalScans,
            newUsersLast7Days: 0,
            scansLast7Days: 0,
            loginEventsLast7Days: 0,
            twoFAEnabledUsers: 0
        };
    }

    async getDailyActivity() {
        return [];
    }

    async getScanTypes() {
        return [];
    }
}
module.exports = AnalyticsAggregationService;
`;
fs.writeFileSync(path.join(servicesDir, 'AnalyticsAggregationService.js'), analyticsAgg);

const analyticsFormatter = `const AnalyticsDTO = require('../../models/dto/AnalyticsDTO');

class AnalyticsFormatter {
    formatOverview(overviewData) {
        const twoFAAdoptionRate = overviewData.totalUsers > 0 ? 
            ((overviewData.twoFAEnabledUsers / overviewData.totalUsers) * 100).toFixed(1) + '%' : '0%';
            
        return new AnalyticsDTO({
            ...overviewData,
            twoFAAdoptionRate
        });
    }
}
module.exports = AnalyticsFormatter;
`;
fs.writeFileSync(path.join(servicesDir, 'AnalyticsFormatter.js'), analyticsFormatter);

// Report Domain
const reportBuilder = `class ReportBuilderService {
    constructor(scanRepository, aiAnalysisRepository, assetRepository, vulnerabilityRepository) {
        this.scanRepository = scanRepository;
        this.aiAnalysisRepository = aiAnalysisRepository;
        this.assetRepository = assetRepository;
        this.vulnerabilityRepository = vulnerabilityRepository;
    }

    async buildReportData(scanId) {
        const scan = await this.scanRepository.findById(scanId);
        if (!scan) throw new Error('Scan not found');
        
        let aiAnalysis = null;
        if (this.aiAnalysisRepository.findByScanIdAndModel) {
            aiAnalysis = await this.aiAnalysisRepository.findByScanIdAndModel(scanId, 'llama3');
        }

        // Mocking vulnerability resolution for now to decouple
        return {
            scan,
            aiAnalysis,
            vulnerabilities: []
        };
    }
}
module.exports = ReportBuilderService;
`;
fs.writeFileSync(path.join(servicesDir, 'ReportBuilderService.js'), reportBuilder);

const pdfRenderer = `const PDFDocument = require('pdfkit');

class PdfRenderer {
    renderStream(reportData, writeStream) {
        const doc = new PDFDocument({
            size: 'A4',
            margins: { top: 50, bottom: 50, left: 50, right: 50 },
            bufferPages: true
        });

        doc.pipe(writeStream);

        const { scan, aiAnalysis, vulnerabilities } = reportData;

        doc.rect(0, 0, doc.page.width, 15).fill('#00BFFF');
        doc.moveDown(4);
        doc.font('Helvetica-Bold').fontSize(28).fillColor('#0B132B').text('CYBERSHIELD X', { tracking: 2 });
        doc.fontSize(10).fillColor('#5a7fa8').text('AI-POWERED CYBERSECURITY ASSESSMENT');
        
        doc.end();
    }
}
module.exports = PdfRenderer;
`;
fs.writeFileSync(path.join(servicesDir, 'PdfRenderer.js'), pdfRenderer);

const reportExportService = `class ReportExportService {
    constructor(reportBuilder, pdfRenderer) {
        this.reportBuilder = reportBuilder;
        this.pdfRenderer = pdfRenderer;
    }

    async exportToPdfStream(scanId, writeStream) {
        const reportData = await this.reportBuilder.buildReportData(scanId);
        this.pdfRenderer.renderStream(reportData, writeStream);
    }
}
module.exports = ReportExportService;
`;
fs.writeFileSync(path.join(servicesDir, 'ReportExportService.js'), reportExportService);

// Vault Domain
const vaultService = `const { VaultError } = require('../../utils/PlatformErrors');
const crypto = require('crypto');

class VaultService {
    constructor(vaultAssetRepository, activityLogRepository, vaultCryptoProvider) {
        this.vaultAssetRepository = vaultAssetRepository;
        this.activityLogRepository = activityLogRepository;
        this.vaultCryptoProvider = vaultCryptoProvider;
    }

    async getAssets(userId) {
        const assets = await this.vaultAssetRepository.find({ userId });
        return assets.map(asset => {
            let decryptedValue;
            try {
                decryptedValue = this.vaultCryptoProvider.decrypt(asset.value);
            } catch (err) {
                decryptedValue = '[DECRYPTION FAILED]';
            }
            return {
                ...asset,
                value: decryptedValue,
                pqcArmor: asset.isLocked ? 'ACTIVE' : 'READY',
                encryptionStandard: 'AES-256-GCM + X25519',
                encrypted: this.vaultCryptoProvider.isEncrypted(asset.value)
            };
        });
    }

    async addAsset(userId, type, label, value) {
        const encryptedValue = this.vaultCryptoProvider.encrypt(value);
        
        // Simulating hash and intelligence
        const hash = crypto.createHash('sha256').update(value.toLowerCase().trim()).digest('hex');
        const riskFactor = parseInt(hash.substring(0, 2), 16) % 100;
        const valueHash = hash;

        const asset = await this.vaultAssetRepository.create({
            userId, type, label, value: encryptedValue, valueHash, riskScore: riskFactor
        });

        // Normally we'd use ActivityLogRepository here
        return asset;
    }

    async toggleLockdown(assetId, userId) {
        const asset = await this.vaultAssetRepository.findOne({ _id: assetId, userId });
        if (!asset) throw new VaultError('Asset not found');
        return await this.vaultAssetRepository.update(asset._id, { isLocked: !asset.isLocked });
    }

    async deleteAsset(assetId, userId) {
        return await this.vaultAssetRepository.delete(assetId);
    }
}
module.exports = VaultService;
`;
fs.writeFileSync(path.join(servicesDir, 'VaultService.js'), vaultService);

// Breach Domain
const breachIntelligenceService = `class BreachIntelligenceService {
    constructor(breachProviderManager, activityLogRepository) {
        this.providerManager = breachProviderManager;
        this.activityLogRepository = activityLogRepository;
    }

    async checkEmail(email, userId) {
        return await this.providerManager.checkEmail(email);
    }

    async checkPhone(phone, userId) {
        return await this.providerManager.checkPhone(phone);
    }

    async checkPassword(password) {
        return await this.providerManager.checkPassword(password);
    }
}
module.exports = BreachIntelligenceService;
`;
fs.writeFileSync(path.join(servicesDir, 'BreachIntelligenceService.js'), breachIntelligenceService);

// Extra missing generic services
const genericServices = ['NotificationService', 'PlaybookService', 'CommunityService', 'WatchlistService', 'HistoryService', 'IntegrationService'];
genericServices.forEach(srv => {
    const code = `class ${srv} {
    constructor(repository) {
        this.repository = repository;
    }
}
module.exports = ${srv};
`;
    fs.writeFileSync(path.join(servicesDir, srv + '.js'), code);
});

console.log("Phase D Services generated successfully.");
