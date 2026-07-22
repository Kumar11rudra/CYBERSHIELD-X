class OrganizationSettingsDTO {
    constructor(data) {
        Object.assign(this, data);
        if (this._id) {
            this.id = this._id.toString();
            delete this._id;
        }
        delete this.__v;
        Object.freeze(this);
    }
}

module.exports = OrganizationSettingsDTO;
