/**
 * @module PermissionDTO
 * @description Immutable Data Transfer Object for Permissions.
 */
class PermissionDTO {
    constructor({ id, name, description, resource, action }) {
        this.id = id;
        this.name = name; // e.g., "scan.execute"
        this.description = description;
        this.resource = resource; // e.g., "scan"
        this.action = action; // e.g., "execute"
        Object.freeze(this);
    }
}
module.exports = PermissionDTO;
