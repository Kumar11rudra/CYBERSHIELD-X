class ScheduleDTO {
    constructor(data) {
        this.id = data._id;
        this.organizationId = data.organizationId;
        this.name = data.name;
        this.target = data.target;
        this.frequency = data.frequency;
        this.nextRun = data.nextRun;
        this.status = data.status;
        this.createdAt = data.createdAt;
    }
}
module.exports = ScheduleDTO;
