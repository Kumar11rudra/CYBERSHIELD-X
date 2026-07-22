const Scan = require('../../models/Scan');
const Asset = require('../../models/Asset');
const Vulnerability = require('../../models/Vulnerability');
const DashboardDTO = require('../../models/dto/DashboardDTO');
const RBACService = require('../org/RBACService');
const mongoose = require('mongoose');

class DashboardAggregationService {
    static async getStats(orgId, userId) {
        await RBACService.requirePermission(orgId, userId, 'canView');
        const matchOrg = { organizationId: new mongoose.Types.ObjectId(orgId) };

        const [
            totalScans,
            failedScans,
            totalAssets,
            activeAssets,
            vulnStats,
            recentScans
        ] = await Promise.all([
            Scan.countDocuments(matchOrg),
            Scan.countDocuments({ ...matchOrg, status: 'failed' }),
            Asset.countDocuments(matchOrg),
            Asset.countDocuments({ ...matchOrg, status: 'active' }),
            Vulnerability.aggregate([
                { $match: { ...matchOrg, status: { $in: ['Open', 'In Progress'] } } },
                { $group: { 
                    _id: null, 
                    total: { $sum: 1 },
                    critical: { $sum: { $cond: [{ $eq: ["$severity", "Critical"] }, 1, 0] } },
                    high: { $sum: { $cond: [{ $eq: ["$severity", "High"] }, 1, 0] } },
                    medium: { $sum: { $cond: [{ $eq: ["$severity", "Medium"] }, 1, 0] } },
                    low: { $sum: { $cond: [{ $eq: ["$severity", "Low"] }, 1, 0] } }
                }}
            ]),
            Scan.find(matchOrg).sort({ createdAt: -1 }).limit(5).lean()
        ]);

        const vulns = vulnStats[0] || { total: 0, critical: 0, high: 0, medium: 0, low: 0 };
        
        return new DashboardDTO({
            scans: { total: totalScans, failed: failedScans, successRate: totalScans ? Math.round(((totalScans - failedScans) / totalScans) * 100) : 100 },
            assets: { total: totalAssets, active: activeAssets },
            vulnerabilities: vulns,
            recentScans
        });
    }
}
module.exports = DashboardAggregationService;
