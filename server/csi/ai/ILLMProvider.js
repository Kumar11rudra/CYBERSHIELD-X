'use strict';

class ILLMProvider {
    /**
     * @param {string} prompt 
     * @param {string} context 
     * @returns {Promise<string>}
     */
    async generate(prompt, context) {
        throw new Error('[ILLMProvider] generate() must be implemented by concrete provider');
    }
}

module.exports = ILLMProvider;
