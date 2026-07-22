'use strict';

/**
 * Deep freezes an object and its nested properties.
 * @param {Object} obj
 * @returns {Object}
 */
function deepFreeze(obj) {
    if (!obj || typeof obj !== 'object' || Object.isFrozen(obj)) {
        return obj;
    }

    Object.keys(obj).forEach(prop => {
        deepFreeze(obj[prop]);
    });

    return Object.freeze(obj);
}

class ExecutiveSectionDTO {
    /**
     * @param {Object} params
     * @param {number} params.order
     * @param {string} params.title
     * @param {Object|Array|string} params.content
     */
    constructor(params) {
        if (!params || typeof params !== 'object') {
            throw new TypeError('[ExecutiveSectionDTO] Invalid constructor parameters');
        }

        if (typeof params.order !== 'number') throw new TypeError('order must be a number');
        if (!params.title) throw new TypeError('title is required');
        if (params.content === undefined) throw new TypeError('content is required');

        this.order = params.order;
        this.title = params.title;
        
        // Clone if object/array
        if (typeof params.content === 'object' && params.content !== null) {
            this.content = Array.isArray(params.content) ? [...params.content] : { ...params.content };
        } else {
            this.content = params.content;
        }

        deepFreeze(this);
    }
}

module.exports = { ExecutiveSectionDTO, deepFreeze };
