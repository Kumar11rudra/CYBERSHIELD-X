class IntegrationDTO {
    constructor(data) {
        this.id = data._id;
        this.organizationId = data.organizationId;
        this.type = data.type;
        this.config = data.config;
        this.status = data.status;
    }
}
module.exports = IntegrationDTO;
