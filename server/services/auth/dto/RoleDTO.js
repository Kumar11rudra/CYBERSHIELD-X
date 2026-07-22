/**
 * @module RoleDTO
 * @description Immutable Data Transfer Object for Roles.
 */
class RoleDTO {
    constructor({ id, name, description, permissions = [] }) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.permissions = Object.freeze([...permissions]);
        Object.freeze(this);
    }
}
module.exports = RoleDTO;
