/**
 * @module CapabilityDTO
 * @description Immutable Data Transfer Object for a single Capability's metadata.
 */
class CapabilityDTO {
    constructor({ id, name, description, category, version, requiredRole, requiredPermission, enabled, visibility }) {
        this.id = id;
        this.name = name;
        this.description = description || '';
        this.category = category || 'general';
        this.version = version || '1.0.0';
        this.requiredRole = requiredRole || null;
        this.requiredPermission = requiredPermission || null;
        this.enabled = Boolean(enabled);
        this.visibility = visibility || 'public';
        Object.freeze(this);
    }
}
module.exports = CapabilityDTO;
