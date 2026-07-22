/**
 * @module MembershipDTO
 * @description Immutable Data Transfer Object for Membership Entity
 */
class MembershipDTO {
    /**
     * @param {Object} data 
     */
    constructor(data = {}) {
        this.id = data._id ? data._id.toString() : data.id;
        this.organizationId = data.organizationId ? data.organizationId.toString() : data.organizationId;
        this.userId = data.userId ? data.userId.toString() : data.userId;
        this.role = data.role;
        this.teams = (data.teams || []).map(t => t.toString());
        this.createdAt = data.createdAt;
        this.updatedAt = data.updatedAt;

        Object.freeze(this);
    }
}

module.exports = MembershipDTO;
