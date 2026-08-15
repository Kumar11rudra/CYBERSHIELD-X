const ActivityLog = require('../../models/ActivityLog');
const HistoryDTO = require('../../models/dto/HistoryDTO');
const QueryBuilder = require('../../utils/QueryBuilder');
const RBACService = require('../org/RBACService');

class HistoryService {
    static async getHistory(orgId, userId, query) {
        await RBACService.requirePermission(orgId, userId, 'canView');
        
        const qb = new QueryBuilder(ActivityLog, query);
        if (orgId) {
            qb.mongoQuery.organizationId = orgId;
        } else {
            qb.mongoQuery.userId = userId;
        }
        qb.filter(['action', 'status', 'userId', 'target', 'assetId'])
            .dateRange('timestamp')
            .paginate()
            .sortBy(['timestamp']);
            
        // If searching text
        if (query.search) {
            qb.mongoQuery.$text = { $search: query.search };
        }

        const { data, pagination } = await qb.execute();
        return {
            data: data.map(log => new HistoryDTO(log)),
            pagination
        };
    }

    static async getEntityHistory(orgId, userId, entityType, entityId, query) {
        await RBACService.requirePermission(orgId, userId, 'canView');
        
        // Setup filter based on entity type
        const filter = orgId ? { organizationId: orgId } : { userId };
        
        switch (entityType) {
            case 'scan':
                filter['metadata.target'] = entityId; // assuming target is scan identifier or scanId
                break;
            case 'asset':
                filter.assetId = entityId;
                break;
            case 'user':
                filter.userId = entityId;
                break;
            case 'vulnerability':
                filter['metadata.details'] = entityId;
                break;
            case 'organization':
                break;
            default:
                throw new Error('Invalid entity type');
        }

        const qb = new QueryBuilder(ActivityLog, query)
            .paginate()
            .sortBy(['timestamp']);
            
        qb.mongoQuery = { ...qb.mongoQuery, ...filter };

        const { data, pagination } = await qb.execute();
        return {
            data: data.map(log => new HistoryDTO(log)),
            pagination
        };
    }
}
module.exports = HistoryService;
