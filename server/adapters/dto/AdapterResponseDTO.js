/**
 * @module AdapterResponseDTO
 * @description Immutable DTO representing a response from a capability execution adapter.
 */
class AdapterResponseDTO {
    constructor({ success, exitCode = 0, stdout = '', stderr = '', duration = 0, warnings = [], metadata = {} }) {
        this.success = Boolean(success);
        this.exitCode = exitCode;
        this.stdout = stdout;
        this.stderr = stderr;
        this.duration = duration;
        this.warnings = Object.freeze([...warnings]);
        this.metadata = Object.freeze({ ...metadata });
        
        Object.freeze(this);
    }

    static success(params) {
        return new AdapterResponseDTO({ ...params, success: true });
    }

    static failure(params) {
        return new AdapterResponseDTO({ ...params, success: false });
    }
}
module.exports = AdapterResponseDTO;
