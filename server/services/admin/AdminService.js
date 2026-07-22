const os = require('os');
const User = require('../../models/User');
const Organization = require('../../models/Organization');
const Team = require('../../models/Team');
const Scan = require('../../models/Scan');
const Asset = require('../../models/Asset');
const Vulnerability = require('../../models/Vulnerability');
const SystemSettings = require('../../models/SystemSettings');
const ActivityLog = require('../../models/ActivityLog');
const { EventPublisher } = require('../../controllers/chatbot/chatbotController');

class AdminService {
    constructor() {
        this.eventPublisher = EventPublisher ? new EventPublisher() : null;
    }

    async logActivity(actorId, action, target, metadata = {}) {
        try {
            await ActivityLog.create({
                userId: actorId,
                action,
                target,
                metadata,
                timestamp: new Date()
            });
        } catch (error) {
            console.error('[AdminService] Failed to create audit log', error);
        }
    }

    async getAllUsers({ page = 1, limit = 20, search = '', role, status, sort = '-createdAt' }) {
        const query = {};
        if (search) {
            query.$or = [
                { email: { $regex: search, $options: 'i' } },
                { username: { $regex: search, $options: 'i' } }
            ];
        }
        if (role) query.role = role;
        if (status) query.status = status;

        const skip = (page - 1) * limit;
        const [users, total] = await Promise.all([
            User.find(query)
                .select('-password -refreshToken -resetToken -verificationToken')
                .sort(sort)
                .skip(skip)
                .limit(Number(limit))
                .lean(),
            User.countDocuments(query)
        ]);

        return {
            users,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                pages: Math.ceil(total / limit)
            }
        };
    }

    async getPlatformStats() {
        const [users, organizations, teams, scans, assets, vulnerabilities] = await Promise.all([
            User.countDocuments(),
            Organization.countDocuments(),
            Team.countDocuments(),
            Scan.countDocuments(),
            Asset.countDocuments(),
            Vulnerability.countDocuments()
        ]);

        return {
            users,
            organizations,
            teams,
            scans,
            assets,
            vulnerabilities,
            executions: 0,
            timestamp: new Date()
        };
    }

    async updateUserRole(userId, newRole, actorId) {
        if (!['user', 'analyst', 'admin'].includes(newRole)) {
            throw new Error('Invalid role assignment');
        }
        if (userId === actorId.toString()) {
            throw new Error('Cannot change your own role');
        }

        const userToUpdate = await User.findById(userId);
        if (!userToUpdate) throw new Error('User not found');

        if (userToUpdate.role === 'admin' && newRole !== 'admin') {
            const adminCount = await User.countDocuments({ role: 'admin', isDeleted: { $ne: true } });
            if (adminCount <= 1) {
                throw new Error('Cannot downgrade the last admin');
            }
        }

        const oldRole = userToUpdate.role;
        userToUpdate.role = newRole;
        await userToUpdate.save();

        await this.logActivity(actorId, 'UPDATE_USER_ROLE', userId, { oldRole, newRole });
        return userToUpdate;
    }

    async deleteUser(userId, actorId) {
        if (userId === actorId.toString()) {
            throw new Error('Cannot delete yourself');
        }

        const user = await User.findById(userId);
        if (!user) throw new Error('User not found');

        if (user.role === 'admin') {
            const adminCount = await User.countDocuments({ role: 'admin', isDeleted: { $ne: true } });
            if (adminCount <= 1) {
                throw new Error('Cannot delete the last admin');
            }
        }

        user.isDeleted = true;
        await user.save();

        await this.logActivity(actorId, 'DELETE_USER', userId, {});
        return { success: true, message: 'User soft deleted successfully' };
    }

    async toggleBanUser(userId, banReason, actorId) {
        if (userId === actorId.toString()) {
            throw new Error('Cannot ban yourself');
        }

        const user = await User.findById(userId);
        if (!user) throw new Error('User not found');

        if (user.role === 'admin') {
            throw new Error('Cannot ban an admin');
        }

        user.isBanned = !user.isBanned;
        user.banReason = user.isBanned ? banReason : null;
        user.bannedBy = user.isBanned ? actorId : null;
        user.bannedAt = user.isBanned ? new Date() : null;
        
        await user.save();
        await this.logActivity(actorId, user.isBanned ? 'BAN_USER' : 'UNBAN_USER', userId, { banReason });
        
        return user;
    }

    async getUserReport(userId) {
        const user = await User.findById(userId).select('-password -refreshToken').lean();
        if (!user) throw new Error('User not found');

        const [scans, activity] = await Promise.all([
            Scan.find({ owner: userId }).sort('-createdAt').limit(10).lean(),
            ActivityLog.find({ userId }).sort('-timestamp').limit(20).lean()
        ]);

        return {
            profile: user,
            recentScans: scans,
            recentActivity: activity,
            lastLogin: user.lastLogin || null
        };
    }

    async getGlobalSettings() {
        let settings = await SystemSettings.findById('global');
        if (!settings) {
            settings = await SystemSettings.create({ _id: 'global' });
        }
        return settings;
    }

    async getFirewallRules() {
        const settings = await this.getGlobalSettings();
        return settings.blockedIPs || [];
    }

    async addFirewallRule(ip, actorId) {
        if (!ip) throw new Error('IP/CIDR is required');
        const settings = await this.getGlobalSettings();
        
        if (!settings.blockedIPs.includes(ip)) {
            settings.blockedIPs.push(ip);
            settings.lastUpdatedBy = actorId;
            await settings.save();
            await this.logActivity(actorId, 'ADD_FIREWALL_RULE', 'global', { ip });
        }
        return settings.blockedIPs;
    }

    async removeFirewallRule(ip, actorId) {
        const settings = await this.getGlobalSettings();
        settings.blockedIPs = settings.blockedIPs.filter(rule => rule !== ip);
        settings.lastUpdatedBy = actorId;
        await settings.save();
        await this.logActivity(actorId, 'REMOVE_FIREWALL_RULE', 'global', { ip });
        return settings.blockedIPs;
    }

    async getMaintenanceStatus() {
        const settings = await this.getGlobalSettings();
        return {
            enabled: settings.maintenanceMode,
            message: settings.maintenanceMessage,
            updatedBy: settings.lastUpdatedBy
        };
    }

    async toggleMaintenanceMode(enabled, message, actorId) {
        const settings = await this.getGlobalSettings();
        settings.maintenanceMode = enabled;
        if (message) settings.maintenanceMessage = message;
        settings.lastUpdatedBy = actorId;
        await settings.save();
        await this.logActivity(actorId, 'TOGGLE_MAINTENANCE', 'global', { enabled, message });
        return { enabled: settings.maintenanceMode, message: settings.maintenanceMessage };
    }

    async getAuditLogs({ page = 1, limit = 50, search, action, actorId }) {
        const query = {};
        if (search) query.target = { $regex: search, $options: 'i' };
        if (action) query.action = action;
        if (actorId) query.userId = actorId;

        const skip = (page - 1) * limit;
        const [logs, total] = await Promise.all([
            ActivityLog.find(query)
                .sort('-timestamp')
                .skip(skip)
                .limit(Number(limit))
                .lean(),
            ActivityLog.countDocuments(query)
        ]);

        return {
            logs,
            pagination: { total, page: Number(page), limit: Number(limit) }
        };
    }

    async injectTestThreat(actorId) {
        if (this.eventPublisher) {
            this.eventPublisher.publish('THREAT_DETECTED', {
                source: 'admin-injector',
                severity: 'critical',
                timestamp: new Date(),
                metadata: { test: true }
            });
            await this.logActivity(actorId, 'INJECT_TEST_THREAT', 'system', {});
            return { success: true, message: 'Test threat injected into CSI pipeline' };
        }
        return { success: false, message: 'Event Publisher unavailable' };
    }

    async getSecurityMetrics() {
        const agg = await Vulnerability.aggregate([
            { $group: { _id: "$severity", count: { $sum: 1 } } }
        ]);
        const distribution = agg.reduce((acc, curr) => {
            acc[curr._id] = curr.count;
            return acc;
        }, { critical: 0, high: 0, medium: 0, low: 0 });

        return { distribution, timestamp: new Date() };
    }

    async getProductionTelemetry() {
        const mem = process.memoryUsage();
        return {
            uptime: process.uptime(),
            memory: {
                rss: mem.rss,
                heapTotal: mem.heapTotal,
                heapUsed: mem.heapUsed,
                external: mem.external
            },
            cpuLoad: os.loadavg(),
            freemem: os.freemem(),
            totalmem: os.totalmem(),
            cpus: os.cpus().length,
            timestamp: new Date()
        };
    }
}

module.exports = new AdminService();
