/**
 * @module CapabilityContract
 * @description Abstract base class demonstrating execution signatures without implementation.
 */
class CapabilityContract {
    /**
     * @param {import('./RuntimeCapabilityContext')} context 
     * @returns {Promise<import('./RuntimeCapabilityResult')>}
     */
    async execute(context) {
        throw new Error('CapabilityContract.execute() must be implemented.');
    }
}

module.exports = CapabilityContract;
