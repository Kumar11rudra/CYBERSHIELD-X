class RBACService {
    /**
     * Define the role hierarchy. Lower index = higher privileges.
     */
    static ROLE_HIERARCHY = ['owner', 'admin', 'manager', 'analyst', 'viewer'];

    static hasSufficientRole(userRole, requiredRole) {
        if (!userRole) return false;
        if (!this.ROLE_HIERARCHY.includes(userRole)) return false;
        if (!this.ROLE_HIERARCHY.includes(requiredRole)) return false;

        const userIndex = this.ROLE_HIERARCHY.indexOf(userRole);
        const requiredIndex = this.ROLE_HIERARCHY.indexOf(requiredRole);

        return userIndex <= requiredIndex;
    }

    static canView(role) {
        return this.hasSufficientRole(role, 'viewer');
    }

    static canEdit(role) {
        return this.hasSufficientRole(role, 'analyst');
    }

    static canManageTeams(role) {
        return this.hasSufficientRole(role, 'manager');
    }

    static canInvite(role) {
        return this.hasSufficientRole(role, 'admin');
    }

    static canManageWebhooks(role) {
        return this.hasSufficientRole(role, 'admin');
    }

    static canManageBilling(role) {
        return this.hasSufficientRole(role, 'owner');
    }

    static canManageRole(actorRole, targetRole) {
        // You cannot manage someone with a higher or equal privilege level than yourself,
        // EXCEPT if you are an owner, you can manage other owners (or demote them, subject to "last owner" rules).
        if (actorRole === 'owner') return true;
        
        const actorIndex = this.ROLE_HIERARCHY.indexOf(actorRole);
        const targetIndex = this.ROLE_HIERARCHY.indexOf(targetRole);
        
        // Actor must have strictly higher privileges than the target role they are assigning or modifying
        return actorIndex < targetIndex;
    }

    static async requirePermission(orgId, userId, permissionMethod) {
        // Late require to avoid circular dependencies
        const { membershipRepository } = require('../../repositories/OrgRepositories');
        const membership = await membershipRepository.findOne({ organizationId: orgId, userId });
        
        if (!membership) {
            throw new Error('Tenant isolation violation: User is not a member of this organization');
        }

        const hasPermission = typeof this[permissionMethod] === 'function' ? 
            this[permissionMethod](membership.role) : false;

        if (!hasPermission) {
            throw new Error('Insufficient privileges to perform this action');
        }
        
        return membership.role;
    }
}

module.exports = RBACService;
