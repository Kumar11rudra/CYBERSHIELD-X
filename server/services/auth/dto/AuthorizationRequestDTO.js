/**
 * @module AuthorizationRequestDTO
 * @description Immutable DTO defining a request for authorization.
 */
class AuthorizationRequestDTO {
    constructor({ userId, requiredRole, requiredPermission, resource, action }) {
        this.userId = userId;
        this.requiredRole = requiredRole;
        this.requiredPermission = requiredPermission;
        this.resource = resource;
        this.action = action;
        Object.freeze(this);
    }
}
module.exports = AuthorizationRequestDTO;
