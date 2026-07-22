const ThreatFeedRecord = require('../../models/ThreatFeedRecord');
const GenericDTO = require('../../models/dto/GenericDTO');
const RBACService = require('../org/RBACService');

class ThreatFeedService {
    static async triggerFeedSync(orgId, userId) {
        await RBACService.requirePermission(orgId, userId, 'canManageOrg');
        return new GenericDTO({ message: 'Sync started' });
    }
    static async getFeedStatsAndHealth(orgId, userId) {
        await RBACService.requirePermission(orgId, userId, 'canView');
        return new GenericDTO({ status: 'healthy', records: await ThreatFeedRecord.countDocuments() });
    }
    static async getLiveThreatFeed(orgId, userId) {
        await RBACService.requirePermission(orgId, userId, 'canView');
        const data = await ThreatFeedRecord.find().sort({ createdAt: -1 }).limit(50);
        return { data: data.map(d => new GenericDTO(d)) };
    }
}
module.exports = ThreatFeedService;
