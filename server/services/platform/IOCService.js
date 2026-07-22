const IOCRecord = require('../../models/IOCRecord');
const CorrelationRecord = require('../../models/CorrelationRecord');
const GenericDTO = require('../../models/dto/GenericDTO');
const QueryBuilder = require('../../utils/QueryBuilder');
const RBACService = require('../org/RBACService');

class IOCService {
    static async searchIOC(orgId, userId, query) {
        await RBACService.requirePermission(orgId, userId, 'canView');
        const qb = new QueryBuilder(IOCRecord, query).paginate().sortBy(['createdAt']);
        const { data, pagination } = await qb.execute();
        return { data: data.map(d => new GenericDTO(d)), pagination };
    }
    static async addIOC(orgId, userId, body) {
        await RBACService.requirePermission(orgId, userId, 'canManageOrg');
        const ioc = new IOCRecord({ ...body, organizationId: orgId });
        await ioc.save();
        return new GenericDTO(ioc);
    }
    static async getRecentIOCs(orgId, userId) {
        await RBACService.requirePermission(orgId, userId, 'canView');
        const data = await IOCRecord.find().sort({ createdAt: -1 }).limit(10);
        return { data: data.map(d => new GenericDTO(d)) };
    }
    static async runCorrelation(orgId, userId, body) {
        await RBACService.requirePermission(orgId, userId, 'canScan');
        const record = new CorrelationRecord({ ...body, organizationId: orgId });
        await record.save();
        return new GenericDTO(record);
    }
}
module.exports = IOCService;
