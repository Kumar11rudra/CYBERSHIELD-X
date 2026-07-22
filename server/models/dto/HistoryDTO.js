class HistoryDTO {
    constructor(data) {
        this.id = data._id;
        this.organizationId = data.organizationId;
        this.userId = data.userId;
        this.action = data.action;
        this.status = data.status;
        this.metadata = data.metadata;
        this.timestamp = data.timestamp;
    }
}
module.exports = HistoryDTO;
