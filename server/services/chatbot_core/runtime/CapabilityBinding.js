/**
 * @module CapabilityBinding
 * @description Immutable binding linking a descriptor with a contract for execution.
 */
class CapabilityBinding {
    /**
     * @param {Object} props
     * @param {import('./CapabilityDescriptor')} props.descriptor
     * @param {import('./CapabilityContract')} props.contract
     */
    constructor(props) {
        if (!props.descriptor || !props.contract) {
            throw new Error('CapabilityBinding requires descriptor and contract.');
        }

        this.descriptor = props.descriptor;
        this.contract = props.contract;

        Object.freeze(this);
    }
}

module.exports = CapabilityBinding;
