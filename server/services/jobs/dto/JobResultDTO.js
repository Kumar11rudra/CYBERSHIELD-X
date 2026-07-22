class JobResultDTO {
    constructor({ success, data = null, error = null }) {
        this.success = success;
        this.data = data;
        this.error = error;
        Object.freeze(this);
    }

    static success(data) {
        return new JobResultDTO({ success: true, data });
    }

    static failure(error) {
        return new JobResultDTO({ success: false, error });
    }
}
module.exports = JobResultDTO;
