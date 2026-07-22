const ActivityLog = require('../../models/ActivityLog');
const AuditDTO = require('../../models/dto/AuditDTO');
const QueryBuilder = require('../../utils/QueryBuilder');
const RBACService = require('../org/RBACService');

class AuditService {
    static async getLogs(orgId, userId, query) {
        // Audit logs typically require high privileges to view all, but for now we enforce canView at minimum
        // and managers might have higher access, but we'll stick to 'canView' as base for Phase 5
        await RBACService.requirePermission(orgId, userId, 'canView');
        
        const qb = new QueryBuilder(ActivityLog, query)
            .tenant(orgId)
            .filter(['action', 'status', 'userId', 'target', 'assetId'])
            .dateRange('timestamp')
            .paginate()
            .sortBy(['timestamp']);
            
        // If searching text - requires a text index on ActivityLog, which we can simulate or we rely on exact filters
        if (query.search) {
            // We can match IP, action, device, etc.
            qb.mongoQuery.$or = [
                { 'metadata.ip': { $regex: query.search, $options: 'i' } },
                { 'metadata.device': { $regex: query.search, $options: 'i' } },
                { action: { $regex: query.search, $options: 'i' } }
            ];
        }

        const { data, pagination } = await qb.execute();
        return {
            data: data.map(log => new AuditDTO(log)),
            pagination
        };
    }
}
module.exports = AuditService;
