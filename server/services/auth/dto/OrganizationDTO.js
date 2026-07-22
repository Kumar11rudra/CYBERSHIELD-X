/**
 * @module OrganizationDTO
 * @description Immutable Data Transfer Object for Organization Entity
 */
class OrganizationDTO {
    /**
     * @param {Object} data 
     */
    constructor(data = {}) {
        this.id = data._id ? data._id.toString() : data.id;
        this.name = data.name;
        this.ownerId = data.ownerId ? data.ownerId.toString() : data.ownerId;
        this.description = data.description;
        this.createdAt = data.createdAt;
        this.updatedAt = data.updatedAt;

        Object.freeze(this);
    }
}

module.exports = OrganizationDTO;
