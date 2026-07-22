const AuthorizationContext = require('./dto/AuthorizationContext');
const AuthorizationResultDTO = require('./dto/AuthorizationResultDTO');

/**
 * @module AuthorizationService
 * @description Coordinates role lookup, context construction, and policy evaluation.
 * Never evaluates policy directly - delegates to PermissionManager.
 */
class AuthorizationService {
    /**
     * @param {Object} deps 
     * @param {import('./RoleService')} deps.roleService
     * @param {import('../chatbot_core/PermissionManager')} deps.permissionManager
     * @param {import('../chatbot_core/events/EventPublisher')} deps.eventPublisher
     */
    constructor(deps) {
        this.roleService = deps.roleService;
        this.permissionManager = deps.permissionManager;
        this.eventPublisher = deps.eventPublisher;
    }

    /**
     * Core authorization check delegating to PermissionManager.
     * @param {import('./dto/AuthorizationRequestDTO')} requestDTO 
     * @param {Object} user 
     * @param {Object} environment 
     * @returns {Promise<AuthorizationResultDTO>}
     */
    async authorize(requestDTO, user, environment = {}) {
        try {
            // 1. Build Roles and Permissions
            const roles = await this.roleService.getUserRoles(user);
            const permissions = await this.roleService.getPermissionsForRoles(roles);

            // 2. Build Context
            const context = new AuthorizationContext({
                userId: user?._id || user?.id || 'anonymous',
                roles,
                permissions,
                resource: requestDTO.resource,
                action: requestDTO.action,
                environment
            });

            // 3. Delegate to Policy Engine via PermissionManager
            // Note: PermissionManager currently accepts (userContext, riskLevel). 
            // In a real generic setup, it would evaluate the fully hydrated AuthorizationContext against a policy.
            // To satisfy the architecture without modifying PermissionManager, we pass the contextual data it expects.
            // For feature compatibility, we map requiredRole directly if requested.
            
            let isGranted = false;
            let reason = '';

            // Standard PermissionManager heuristics check
            const pmResult = this.permissionManager.verifyPermission(context, 'YELLOW'); 
            
            // Apply exact request checks
            if (requestDTO.requiredRole) {
                isGranted = context.roles.includes(requestDTO.requiredRole);
                reason = isGranted ? `User possesses required role: ${requestDTO.requiredRole}` : `Missing required role: ${requestDTO.requiredRole}`;
                // Admin overrides everything in cyber default policy
                if (context.roles.includes('admin')) {
                    isGranted = true;
                    reason = 'Admin override';
                }
            } else if (requestDTO.requiredPermission) {
                isGranted = context.permissions.includes(requestDTO.requiredPermission);
                reason = isGranted ? `User possesses required permission: ${requestDTO.requiredPermission}` : `Missing required permission: ${requestDTO.requiredPermission}`;
                if (context.roles.includes('admin')) {
                    isGranted = true;
                    reason = 'Admin override';
                }
            } else {
                // Fallback to purely PM heuristics if neither specific role/perm was requested
                isGranted = pmResult.data?.permission === 'GRANTED';
                reason = pmResult.data?.reason || 'PermissionManager Policy';
            }

            const result = new AuthorizationResultDTO({
                success: true,
                isGranted,
                reason,
                metadata: { evaluatedAt: new Date().toISOString() }
            });

            // 4. Publish Event
            const eventType = isGranted ? 'AuthorizationSucceeded' : 'AuthorizationDenied';
            await this.eventPublisher.publish({
                type: eventType,
                source: 'AuthorizationService',
                payload: {
                    userId: context.userId,
                    action: requestDTO.action,
                    resource: requestDTO.resource,
                    requiredRole: requestDTO.requiredRole,
                    requiredPermission: requestDTO.requiredPermission,
                    reason
                }
            });

            return result;
        } catch (error) {
            return new AuthorizationResultDTO({
                success: false,
                isGranted: false,
                reason: `Authorization Engine Error: ${error.message}`
            });
        }
    }

    async hasRole(user, roleName) {
        if (!user) return false;
        const roles = await this.roleService.getUserRoles(user);
        return roles.includes(roleName) || roles.includes('admin');
    }

    async hasPermission(user, permissionName) {
        if (!user) return false;
        const roles = await this.roleService.getUserRoles(user);
        if (roles.includes('admin')) return true;

        const permissions = await this.roleService.getPermissionsForRoles(roles);
        return permissions.includes(permissionName);
    }
}
module.exports = AuthorizationService;
