const CapabilityAuthorizationResult = require('./dto/CapabilityAuthorizationResult');
const CapabilityExecutionContext = require('./dto/CapabilityExecutionContext');

/**
 * @module CapabilityAuthorizationService
 * @description Secures the Capability Execution Gateway by authorizing capabilities against RBAC.
 */
class CapabilityAuthorizationService {
    /**
     * @param {Object} deps 
     * @param {import('../auth/AuthorizationService')} deps.authorizationService
     * @param {import('../chatbot_core/runtime/CapabilityResolver')} deps.capabilityResolver
     * @param {import('../chatbot_core/events/EventPublisher')} deps.eventPublisher
     */
    constructor(deps) {
        this.authorizationService = deps.authorizationService;
        this.capabilityResolver = deps.capabilityResolver;
        this.eventPublisher = deps.eventPublisher;
    }

    /**
     * Authorizes execution of a specific capability.
     * @param {CapabilityExecutionContext} executionContext 
     * @param {Object} user 
     */
    async authorizeExecution(executionContext, user) {
        try {
            await this.eventPublisher.publish({
                type: 'CapabilityRequested',
                source: 'CapabilityAuthorizationService',
                payload: { capabilityId: executionContext.capabilityId, userId: executionContext.userId }
            });

            // 1. Resolve Capability
            const binding = this.capabilityResolver.resolve(executionContext.capabilityId, null);
            if (!binding) {
                return this._handleDenial(executionContext, 'Capability not found or unsupported');
            }

            // In a full implementation, capability metadata (permission, requiredRole) would be natively exposed 
            // by CapabilityDescriptor. As per constraints, we extract it directly from the Plugin Registry if available, 
            // or pass default authorization parameters.
            const plugins = this.capabilityResolver.pluginManager.pluginRegistry.getAll();
            let capabilityMetadata = {};
            
            for (const plugin of plugins) {
                const cap = plugin.manifest.capabilities.find(c => c.capabilityId === executionContext.capabilityId);
                if (cap) {
                    capabilityMetadata = {
                        requiredPermission: cap.permission || cap.requiredPermission,
                        requiredRole: cap.requiredRole || cap.role,
                        executionPolicy: cap.executionPolicy || 'YELLOW'
                    };
                    break;
                }
            }

            // 2. Build Authorization Request
            const requestDTO = {
                userId: executionContext.userId,
                resource: executionContext.capabilityId,
                action: 'execute_capability',
                requiredPermission: capabilityMetadata.requiredPermission,
                requiredRole: capabilityMetadata.requiredRole
            };

            // 3. Delegate to AuthorizationService
            // AuthorizationService encapsulates PermissionManager and Role/Permission evaluation.
            const authResult = await this.authorizationService.authorize(requestDTO, user, executionContext.environment);

            if (authResult.isGranted) {
                const result = new CapabilityAuthorizationResult({
                    success: true,
                    isGranted: true,
                    reason: 'Capability authorized successfully',
                    capabilityMetadata
                });

                await this.eventPublisher.publish({
                    type: 'CapabilityAuthorized',
                    source: 'CapabilityAuthorizationService',
                    payload: { capabilityId: executionContext.capabilityId, userId: executionContext.userId }
                });

                return result;
            } else {
                return this._handleDenial(executionContext, authResult.reason || 'Insufficient permissions for capability', capabilityMetadata);
            }

        } catch (error) {
            await this.eventPublisher.publish({
                type: 'CapabilityValidationFailed',
                source: 'CapabilityAuthorizationService',
                payload: { capabilityId: executionContext.capabilityId, error: error.message }
            });

            return new CapabilityAuthorizationResult({
                success: false,
                isGranted: false,
                reason: `Capability authorization encountered error: ${error.message}`
            });
        }
    }

    async _handleDenial(executionContext, reason, metadata = null) {
        const result = new CapabilityAuthorizationResult({
            success: true,
            isGranted: false,
            reason: reason,
            capabilityMetadata: metadata
        });

        await this.eventPublisher.publish({
            type: 'CapabilityDenied',
            source: 'CapabilityAuthorizationService',
            payload: { capabilityId: executionContext.capabilityId, userId: executionContext.userId, reason }
        });

        return result;
    }
}
module.exports = CapabilityAuthorizationService;
