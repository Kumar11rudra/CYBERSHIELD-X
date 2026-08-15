const Scan = require('../../models/Scan');
const Asset = require('../../models/Asset');
const Vulnerability = require('../../models/Vulnerability');
const ActivityLog = require('../../models/ActivityLog');
const AnalyticsDTO = require('../../models/dto/AnalyticsDTO');
const RBACService = require('../org/RBACService');
const mongoose = require('mongoose');

class AnalyticsAggregationService {
    static async getDailyScans(orgId, userId, query = {}) {
        await RBACService.requirePermission(orgId, userId, 'canView');
        const match = orgId
            ? { organizationId: new mongoose.Types.ObjectId(orgId) }
            : { userId: new mongoose.Types.ObjectId(userId) };
        if (query.startDate) match.createdAt = { $gte: new Date(query.startDate) };
        if (query.endDate) match.createdAt = { ...match.createdAt, $lte: new Date(query.endDate) };

        const data = await Scan.aggregate([
            { $match: match },
            { $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                count: { $sum: 1 }
            }},
            { $sort: { _id: 1 } }
        ]);
        return new AnalyticsDTO({ data });
    }

    static async getRiskTrends(orgId, userId) {
        await RBACService.requirePermission(orgId, userId, 'canView');
        const match = orgId
            ? { organizationId: new mongoose.Types.ObjectId(orgId) }
            : { createdBy: new mongoose.Types.ObjectId(userId) };
        const data = await Vulnerability.aggregate([
            { $match: match },
            { $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$firstSeen" } },
                avgRisk: { $avg: "$riskScore" },
                criticalCount: { $sum: { $cond: [{ $eq: ["$severity", "Critical"] }, 1, 0] } }
            }},
            { $sort: { _id: 1 } }
        ]);
        return new AnalyticsDTO({ data });
    }

    static async getSeverityTrends(orgId, userId) {
        await RBACService.requirePermission(orgId, userId, 'canView');
        const match = orgId
            ? { organizationId: new mongoose.Types.ObjectId(orgId) }
            : { createdBy: new mongoose.Types.ObjectId(userId) };
        const data = await Vulnerability.aggregate([
            { $match: match },
            { $group: { _id: "$severity", count: { $sum: 1 } } }
        ]);
        return new AnalyticsDTO({ data });
    }
    
    static async getTopVulnerableAssets(orgId, userId) {
        await RBACService.requirePermission(orgId, userId, 'canView');
        const match = orgId
            ? { organizationId: new mongoose.Types.ObjectId(orgId), status: { $in: ['Open', 'In Progress'] } }
            : { createdBy: new mongoose.Types.ObjectId(userId), status: { $in: ['Open', 'In Progress'] } };
        const data = await Vulnerability.aggregate([
            { $match: match },
            { $group: { _id: "$assetId", vulnCount: { $sum: 1 }, avgRisk: { $avg: "$riskScore" } } },
            { $sort: { vulnCount: -1 } },
            { $limit: 10 },
            { $lookup: { from: 'assets', localField: '_id', foreignField: '_id', as: 'asset' } },
            { $unwind: "$asset" },
            { $project: { hostname: "$asset.hostname", vulnCount: 1, avgRisk: 1 } }
        ]);
        return new AnalyticsDTO({ data });
    }

    static async getCommonCVEs(orgId, userId) {
        await RBACService.requirePermission(orgId, userId, 'canView');
        const match = orgId
            ? { organizationId: new mongoose.Types.ObjectId(orgId), cve: { $ne: null } }
            : { createdBy: new mongoose.Types.ObjectId(userId), cve: { $ne: null } };
        const data = await Vulnerability.aggregate([
            { $match: match },
            { $group: { _id: "$cve", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);
        return new AnalyticsDTO({ data });
    }

    static async getSLABreaches(orgId, userId) {
        await RBACService.requirePermission(orgId, userId, 'canView');
        const match = orgId
            ? { organizationId: new mongoose.Types.ObjectId(orgId) }
            : { createdBy: new mongoose.Types.ObjectId(userId) };
        const data = await Vulnerability.aggregate([
            { $match: match },
            { $group: { _id: "$slaStatus", count: { $sum: 1 } } }
        ]);
        return new AnalyticsDTO({ data });
    }
}
module.exports = AnalyticsAggregationService;
