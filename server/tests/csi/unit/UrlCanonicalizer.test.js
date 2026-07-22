const { UrlCanonicalizer } = require('../../../csi/utils/UrlCanonicalizer');

describe('UrlCanonicalizer', () => {
    it('should clean up duplicate slashes in pathname', () => {
        const url = 'http://example.com//path///to////resource';
        expect(UrlCanonicalizer.canonicalize(url)).toBe('http://example.com/path/to/resource');
    });

    it('should resolve unicode/punycode domains', () => {
        const url = 'http://exämple.com/';
        // Node's URL will parse the hostname to xn--exmple-cua.com
        expect(UrlCanonicalizer.canonicalize(url)).toBe('http://xn--exmple-cua.com/');
    });

    it('should strip default ports', () => {
        expect(UrlCanonicalizer.canonicalize('http://example.com:80/path')).toBe('http://example.com/path');
        expect(UrlCanonicalizer.canonicalize('https://example.com:443/path')).toBe('https://example.com/path');
        
        // Non-default ports should remain
        expect(UrlCanonicalizer.canonicalize('http://example.com:8080/path')).toBe('http://example.com:8080/path');
    });

    it('should remove fragments', () => {
        const url = 'http://example.com/path#section-1';
        expect(UrlCanonicalizer.canonicalize(url)).toBe('http://example.com/path');
    });

    it('should remove tracking parameters', () => {
        const url = 'http://example.com/path?utm_source=google&utm_medium=cpc&utm_campaign=sale&utm_term=shoes&utm_content=logolink&valid=1';
        expect(UrlCanonicalizer.canonicalize(url)).toBe('http://example.com/path?valid=1');
    });

    it('should handle invalid URLs gracefully', () => {
        // Since URL constructor fails on totally unparseable input, it should return the original input
        // unless we passed something that defaults to http:// and becomes parseable
        const invalidUrl = 'not-a-valid-url!@#$%^&*()';
        // With current logic, `http://not-a-valid-url!@#$%^&*()` is still valid according to URL parser, 
        // wait, let's test a really invalid URL that throws URL parser error
        const unparseable = 'http://:80';
        // If it throws, it returns the input
        expect(UrlCanonicalizer.canonicalize(unparseable)).toBe(unparseable);
    });
});
