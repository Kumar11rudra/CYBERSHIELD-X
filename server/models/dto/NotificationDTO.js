class NotificationDTO {
    constructor(data) {
        this.id = data._id;
        this._id = data._id;
        this.userId = data.userId;
        this.organizationId = data.organizationId;
        this.type = data.type;
        this.title = data.title;
        this.message = data.message;
        this.read = data.read;
        this.metadata = data.metadata;
        this.createdAt = data.createdAt;
    }
}
module.exports = NotificationDTO;
