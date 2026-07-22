class AuditDTO {
    constructor(data) {
        this.id = data._id;
        this.userId = data.userId;
        this.organizationId = data.organizationId;
        this.action = data.action;
        this.status = data.status;
        this.metadata = data.metadata;
        this.timestamp = data.timestamp;
    }
}
module.exports = AuditDTO;
