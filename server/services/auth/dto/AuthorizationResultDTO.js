/**
 * @module AuthorizationResultDTO
 * @description Immutable DTO defining the result of an authorization check.
 */
class AuthorizationResultDTO {
    constructor({ success, isGranted, reason, metadata = {} }) {
        this.success = Boolean(success);
        this.isGranted = Boolean(isGranted);
        this.reason = reason || '';
        this.metadata = Object.freeze({ ...metadata });
        Object.freeze(this);
    }
}
module.exports = AuthorizationResultDTO;
