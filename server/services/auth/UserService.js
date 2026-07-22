/**
 * @module UserService
 * @description Handles user-specific administrative and core logic.
 */
class UserService {
    /**
     * @param {Object} deps
     * @param {import('./UserRepository')} deps.userRepo
     * @param {import('../chatbot_core/events/EventPublisher')} deps.eventPublisher
     */
    constructor(deps) {
        this.userRepo = deps.userRepo;
        this.eventPublisher = deps.eventPublisher;
    }

    async getAllUsers(page = 1, limit = 20) {
        return await this.userRepo.paginate({}, page, limit);
    }

    async getUserCount() {
        return await this.userRepo.count({});
    }

    async getUserById(id) {
        return await this.userRepo.findById(id);
    }

    async updateUserRole(id, role, adminEmail, adminId) {
        if (!['user', 'admin'].includes(role)) {
            throw new Error('Invalid role');
        }

        const targetUser = await this.userRepo.findById(id);
        if (!targetUser) throw new Error('User not found');

        if (targetUser.email === 'official.cybershieldx@gmail.com' && adminEmail !== 'official.cybershieldx@gmail.com') {
            throw new Error('Cannot modify root admin role');
        }

        const updatedUser = await this.userRepo.update({ id, role });

        await this.eventPublisher.publish({
            type: 'AdminUpdatedUserRole',
            source: 'UserService',
            payload: { adminId, targetUserId: id, newRole: role }
        });

        return updatedUser;
    }

    async deleteUser(id, adminId, adminEmail) {
        if (id === adminId) {
            throw new Error('Cannot delete your own account');
        }

        const targetUser = await this.userRepo.findById(id);
        if (!targetUser) {
            throw new Error('User not found');
        }
        if (targetUser.email === 'official.cybershieldx@gmail.com') {
            throw new Error('Cannot delete root admin');
        }

        await this.userRepo.delete(id);

        await this.eventPublisher.publish({
            type: 'AdminDeletedUser',
            source: 'UserService',
            payload: { adminId, targetUserId: id }
        });

        return true;
    }

    async toggleBanUser(id, adminId, adminEmail, ip) {
        const targetUser = await this.userRepo.findById(id);
        if (!targetUser) throw new Error('User not found');
        
        if (targetUser.email === 'official.cybershieldx@gmail.com') {
            throw new Error('Cannot ban root admin');
        }

        if (id === adminId) {
            throw new Error('Cannot ban yourself');
        }

        const newBanStatus = !targetUser.isBanned;
        const updatedUser = await this.userRepo.update({ id, isBanned: newBanStatus });

        await this.eventPublisher.publish({
            type: 'AdminToggledUserBan',
            source: 'UserService',
            payload: { adminId, targetUserId: id, isBanned: newBanStatus, ip }
        });

        return updatedUser;
    }
}

module.exports = UserService;
