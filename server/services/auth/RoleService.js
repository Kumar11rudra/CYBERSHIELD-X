/**
 * @module RoleService
 * @description Manages assignment and querying of Roles and Permissions.
 */
class RoleService {
    /**
     * @param {Object} deps 
     * @param {import('./RoleRepository')} deps.roleRepo
     * @param {import('./PermissionRepository')} deps.permissionRepo
     * @param {import('../chatbot_core/events/EventPublisher')} deps.eventPublisher
     */
    constructor(deps) {
        this.roleRepo = deps.roleRepo;
        this.permissionRepo = deps.permissionRepo;
        this.eventPublisher = deps.eventPublisher;
    }

    async assignRole(userId, roleName) {
        const roleExists = await this.roleRepo.exists(roleName);
        if (!roleExists) {
            throw new Error(`Role '${roleName}' does not exist.`);
        }
        
        await this.roleRepo.assignRoleToUser(userId, roleName);

        await this.eventPublisher.publish({
            type: 'RoleAssigned',
            source: 'RoleService',
            payload: { userId, roleName }
        });

        return true;
    }

    async removeRole(userId, roleName) {
        await this.roleRepo.removeRoleFromUser(userId, roleName);

        await this.eventPublisher.publish({
            type: 'RoleRemoved',
            source: 'RoleService',
            payload: { userId, roleName }
        });

        return true;
    }

    async listRoles() {
        return this.roleRepo.findAll();
    }

    async listPermissions() {
        return this.permissionRepo.findAll();
    }

    /**
     * Gets all resolved roles for a given user.
     * Combines dynamic assignments + baseline defaults.
     * @param {Object} user - The user object from database.
     */
    async getUserRoles(user) {
        if (!user || (!user._id && !user.id)) return [];
        const userId = user._id || user.id;

        const assignedRoles = await this.roleRepo.findRolesByUser(userId);
        
        // Ensure baseline user.role property is included as a fallback
        if (user.role && !assignedRoles.includes(user.role)) {
            assignedRoles.push(user.role);
        }

        return assignedRoles;
    }

    /**
     * Reconstructs all permissions granted to a list of roles.
     * @param {Array<string>} roleNames 
     */
    async getPermissionsForRoles(roleNames) {
        const permissions = new Set();
        for (const roleName of roleNames) {
            const role = await this.roleRepo.findByName(roleName);
            if (role && role.permissions) {
                role.permissions.forEach(p => permissions.add(p));
            }
        }
        return Array.from(permissions);
    }
}
module.exports = RoleService;
