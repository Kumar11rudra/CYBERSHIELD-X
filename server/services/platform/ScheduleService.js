const ScheduledScan = require('../../models/ScheduledScan');
const ScheduleDTO = require('../../models/dto/ScheduleDTO');
const QueryBuilder = require('../../utils/QueryBuilder');
const RBACService = require('../org/RBACService');

class ScheduleService {
    static async getSchedules(orgId, userId, query) {
        await RBACService.requirePermission(orgId, userId, 'canView');
        const qb = new QueryBuilder(ScheduledScan, query);
        if (orgId) {
            qb.tenant(orgId);
        } else {
            qb.mongoQuery.userId = userId;
        }
        qb.filter(['status', 'frequency'])
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

    static calculateNextRun(frequency) {
        const now = new Date();
        const freq = (frequency || '').toLowerCase();
        if (freq === 'daily') {
            return new Date(now.getTime() + 24 * 60 * 60 * 1000);
        } else if (freq === 'weekly') {
            return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        } else if (freq === 'monthly') {
            return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        }
        return now;
    }

    static async createSchedule(orgId, userId, data) {
        await RBACService.requirePermission(orgId, userId, 'canScan');
        if (!data.frequency) {
            throw new Error('Frequency is required.');
        }
        const freq = data.frequency.toLowerCase();
        if (!['daily', 'weekly', 'monthly'].includes(freq)) {
            throw new Error('Frequency must be daily, weekly, or monthly.');
        }
        const nextRun = this.calculateNextRun(freq);
        const schedule = new ScheduledScan({ 
            ...data, 
            frequency: freq,
            nextRun,
            organizationId: orgId, 
            createdBy: userId 
        });
        await schedule.save();
        return new ScheduleDTO(schedule);
    }

    static async updateSchedule(orgId, userId, scheduleId, data) {
        await RBACService.requirePermission(orgId, userId, 'canScan');
        const query = orgId ? { _id: scheduleId, organizationId: orgId } : { _id: scheduleId };
        
        const updateData = { ...data };
        if (data.frequency !== undefined) {
            const freq = data.frequency.toLowerCase();
            if (!['daily', 'weekly', 'monthly'].includes(freq)) {
                throw new Error('Frequency must be daily, weekly, or monthly.');
            }
            updateData.frequency = freq;
            updateData.nextRun = this.calculateNextRun(freq);
        }

        const schedule = await ScheduledScan.findOneAndUpdate(
            query,
            updateData,
            { new: true }
        );
        if (!schedule) throw new Error('Schedule not found');
        return new ScheduleDTO(schedule);
    }

    static async deleteSchedule(orgId, userId, scheduleId) {
        await RBACService.requirePermission(orgId, userId, 'canScan');
        const query = orgId ? { _id: scheduleId, organizationId: orgId } : { _id: scheduleId };
        const result = await ScheduledScan.findOneAndDelete(query);
        if (!result) throw new Error('Schedule not found');
        return { success: true };
    }
}
module.exports = ScheduleService;
