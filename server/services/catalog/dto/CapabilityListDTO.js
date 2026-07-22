const CapabilityDTO = require('./CapabilityDTO');

/**
 * @module CapabilityListDTO
 * @description Immutable Data Transfer Object for a list of capabilities.
 */
class CapabilityListDTO {
    constructor(capabilities = []) {
        this.items = Object.freeze(capabilities.map(cap => new CapabilityDTO(cap)));
        this.count = this.items.length;
        Object.freeze(this);
    }
}
module.exports = CapabilityListDTO;
