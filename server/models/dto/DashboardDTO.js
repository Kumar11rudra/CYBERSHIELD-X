class DashboardDTO {
    constructor(data) {
        Object.assign(this, data);
        Object.freeze(this);
    }
}
module.exports = DashboardDTO;
