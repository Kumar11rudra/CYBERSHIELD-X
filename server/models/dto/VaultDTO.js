class VaultDTO {
    constructor(data) {
        this.id = data._id;
        this.organizationId = data.organizationId;
        this.name = data.name;
        this.type = data.type;
        this.createdAt = data.createdAt;
        // Sensitive data omitted
    }
}
module.exports = VaultDTO;
