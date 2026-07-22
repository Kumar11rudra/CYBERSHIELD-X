/**
 * @module TeamDTO
 * @description Immutable Data Transfer Object for Team Entity
 */
class TeamDTO {
    /**
     * @param {Object} data 
     */
    constructor(data = {}) {
        this.id = data._id ? data._id.toString() : data.id;
        this.organizationId = data.organizationId ? data.organizationId.toString() : data.organizationId;
        this.name = data.name;
        this.createdAt = data.createdAt;
        this.updatedAt = data.updatedAt;

        Object.freeze(this);
    }
}

module.exports = TeamDTO;
