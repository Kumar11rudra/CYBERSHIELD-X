'use strict';

/**
 * Utility for canonicalizing URLs to ensure deterministic findings.
 */
class UrlCanonicalizer {
    /**
     * Normalizes a URL string.
     * @param {string} inputUrl
     * @returns {string} Canonicalized URL
     */
    static canonicalize(inputUrl) {
        if (!inputUrl) return '';
        
        let urlObj;
        try {
            // Default to http:// if no scheme is provided to allow parsing
            const hasScheme = /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(inputUrl);
            urlObj = new URL(hasScheme ? inputUrl : `http://${inputUrl}`);
        } catch (err) {
            return inputUrl; // Return raw if unparseable
        }

        // Normalize scheme to lowercase
        urlObj.protocol = urlObj.protocol.toLowerCase();

        // Normalize hostname to lowercase
        urlObj.hostname = urlObj.hostname.toLowerCase();

        // Remove default ports
        if (urlObj.protocol === 'http:' && urlObj.port === '80') {
            urlObj.port = '';
        } else if (urlObj.protocol === 'https:' && urlObj.port === '443') {
            urlObj.port = '';
        }

        // Remove duplicate slashes in pathname
        urlObj.pathname = urlObj.pathname.replace(/\/+/g, '/');

        // Remove trailing slash if it's the only thing after the hostname (i.e. pathname is '/')
        // or just trim trailing slash generally if pathname > 1 char
        if (urlObj.pathname !== '/') {
            urlObj.pathname = urlObj.pathname.replace(/\/$/, '');
        }

        // Remove fragments
        urlObj.hash = '';

        // Remove tracking parameters
        const trackingParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'];
        for (const param of trackingParams) {
            urlObj.searchParams.delete(param);
        }

        return urlObj.toString();
    }
}

module.exports = { UrlCanonicalizer };
