class PlaybookDTO {
    constructor(data) {
        this.id = data._id;
        this.organizationId = data.organizationId;
        this.name = data.name;
        this.triggers = data.triggers;
        this.actions = data.actions;
        this.status = data.status;
    }
}
module.exports = PlaybookDTO;
