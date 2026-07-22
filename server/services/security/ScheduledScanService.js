const ScheduledScanDTO = require('./dto/ScheduledScanDTO');

/**
 * @module ScheduledScanService
 * @description Domain service for managing scheduled scans.
 */
class ScheduledScanService {
    constructor(deps) {
        this.scheduleRepo = deps.scheduleRepo;
    }

    calculateNextRun(frequency) {
        const now = new Date();
        if (frequency === 'daily') {
            return new Date(now.getTime() + 24 * 60 * 60 * 1000);
        } else if (frequency === 'weekly') {
            return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        } else if (frequency === 'monthly') {
            return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        }
        return now;
    }

    async getSchedules(query) {
        return await this.scheduleRepo.findMany(query);
    }

    async createSchedule(data) {
        if (!data.target || !data.targetType || !data.frequency) {
            throw new Error('Target, Target Type, and Frequency are required.');
        }

        const freq = data.frequency.toLowerCase();
        if (!['daily', 'weekly', 'monthly'].includes(freq)) {
            throw new Error('Frequency must be daily, weekly, or monthly.');
        }

        const nextRun = this.calculateNextRun(freq);

        const scheduleData = {
            ...data,
            target: data.target.trim(),
            targetType: data.targetType.toLowerCase(),
            frequency: freq,
            tools: data.tools || ['nmap', 'ssl'],
            scanMode: data.scanMode || 'quick',
            nextRun,
        };

        const schedule = await this.scheduleRepo.create(scheduleData);
        return schedule;
    }

    async updateSchedule(id, userId, organizationId, updates) {
        const query = organizationId
            ? { _id: id, organizationId }
            : { _id: id, userId, organizationId: { $exists: false } };

        const schedule = await this.scheduleRepo.findOne(query);
        if (!schedule) {
            throw new Error('Scheduled scan not found or access denied.');
        }

        const updatedData = { ...schedule, ...updates, id: schedule.id };

        if (updates.frequency !== undefined) {
            const freq = updates.frequency.toLowerCase();
            if (!['daily', 'weekly', 'monthly'].includes(freq)) {
                throw new Error('Frequency must be daily, weekly, or monthly.');
            }
            updatedData.frequency = freq;
            updatedData.nextRun = this.calculateNextRun(freq);
        }

        await this.scheduleRepo.update(updatedData);
        return await this.scheduleRepo.findById(id);
    }

    async deleteSchedule(id, userId, organizationId) {
        const query = organizationId
            ? { _id: id, organizationId }
            : { _id: id, userId, organizationId: { $exists: false } };

        const schedule = await this.scheduleRepo.findOne(query);
        if (!schedule) {
            throw new Error('Scheduled scan not found or access denied.');
        }

        await this.scheduleRepo.delete(schedule.id);
        return schedule;
    }
}

module.exports = ScheduledScanService;
