const ScheduledScan = require('../../models/ScheduledScan');
const ScheduleDTO = require('../../models/dto/ScheduleDTO');
const QueryBuilder = require('../../utils/QueryBuilder');
const RBACService = require('../org/RBACService');

class ScheduleService {
    static async getSchedules(orgId, userId, query) {
        await RBACService.requirePermission(orgId, userId, 'canView');
        const qb = new QueryBuilder(ScheduledScan, query)
            .tenant(orgId)
            .filter(['status', 'frequency'])
            .paginate()
            .sortBy(['createdAt']);

        if (query.search) {
            qb.mongoQuery.$text = { $search: query.search };
        }

        const { data, pagination } = await qb.execute();
        return {
            data: data.map(s => new ScheduleDTO(s)),
            pagination
        };
    }

    static async createSchedule(orgId, userId, data) {
        await RBACService.requirePermission(orgId, userId, 'canScan');
        const schedule = new ScheduledScan({ ...data, organizationId: orgId, createdBy: userId });
        await schedule.save();
        return new ScheduleDTO(schedule);
    }

    static async updateSchedule(orgId, userId, scheduleId, data) {
        await RBACService.requirePermission(orgId, userId, 'canScan');
        const schedule = await ScheduledScan.findOneAndUpdate(
            { _id: scheduleId, organizationId: orgId },
            data,
            { new: true }
        );
        if (!schedule) throw new Error('Schedule not found');
        return new ScheduleDTO(schedule);
    }

    static async deleteSchedule(orgId, userId, scheduleId) {
        await RBACService.requirePermission(orgId, userId, 'canScan');
        const result = await ScheduledScan.findOneAndDelete({ _id: scheduleId, organizationId: orgId });
        if (!result) throw new Error('Schedule not found');
        return { success: true };
    }
}
module.exports = ScheduleService;
