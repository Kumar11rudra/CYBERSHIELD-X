'use strict';

const http = require('http');
const https = require('https');
const url = require('url');
const zlib = require('zlib');
const { INetworkClient } = require('../interfaces/INetworkClient');
const { CsiTimeoutError, ResponseTooLargeError, NetworkContextExpiredError } = require('../errors/CsiErrors');

class CsiHttpError extends Error {
    constructor(message, details = {}) {
        super(message);
        this.name = 'CsiHttpError';
        this.details = details;
    }
}

/**
 * HttpClient
 * 
 * INetworkClient implementation for HTTP/HTTPS requests.
 * Uses native Node.js http/https modules.
 * Follows redirects (up to a max).
 * Supports gzip/deflate decoding.
 * Captures headers, status codes, and body.
 */
class HttpClient extends INetworkClient {
    constructor(options = {}) {
        super();
        this._defaultTimeout = options.defaultTimeout || 10000;
        this._maxRedirects = options.maxRedirects || 5;
        this._maxBodySize = options.maxBodySize || 1024 * 1024 * 5; // 5MB default limit
    }

    protocol() { return 'http'; }

    /**
     * @param {import('./NetworkExecutionContext').NetworkExecutionContext} ctx
     * @param {object} params
     * @param {string} [params.method] - HTTP method (default: GET)
     * @param {object} [params.headers] - Custom headers
     * @param {boolean} [params.followRedirects] - Whether to follow redirects (default: true)
     * @returns {Promise<object>}
     */
    async query(ctx, params = {}) {
        const targetUrl = ctx.targetId;
        if (!targetUrl) throw new CsiHttpError('HttpClient.query: targetId (URL) is required in ctx.');

        const method = (params.method || 'GET').toUpperCase();
        const headers = params.headers || {
            'User-Agent': 'CyberShield Intelligence Engine / V1',
            'Accept': '*/*',
            'Accept-Encoding': 'gzip, deflate'
        };
        const followRedirects = params.followRedirects !== false;
        
        // Pass context through rather than just timeout so we can use deadline and responseLimit
        return this._executeRequest(ctx, targetUrl, method, headers, followRedirects, 0);
    }

    async _executeRequest(ctx, targetUrl, method, headers, followRedirects, redirectCount) {
        if (redirectCount > this._maxRedirects) {
            throw new CsiHttpError(`Too many redirects (max ${this._maxRedirects})`, { targetUrl });
        }

        if (ctx.isExpired()) {
            throw new NetworkContextExpiredError(`HTTP execution context expired before starting request to ${targetUrl}`, { targetUrl });
        }

        return new Promise((resolve, reject) => {
            let settled = false;
            const settle = (fn, val) => { if (!settled) { settled = true; fn(val); } };

            let parsedUrl;
            try {
                parsedUrl = new url.URL(targetUrl);
            } catch (err) {
                return settle(reject, new CsiHttpError(`Invalid URL: ${targetUrl}`, { cause: err }));
            }

            const isHttps = parsedUrl.protocol === 'https:';
            const requestModule = isHttps ? https : http;
            
            const remaining = ctx.remainingTime();
            if (remaining <= 0) {
                return settle(reject, new NetworkContextExpiredError(`No time remaining for ${targetUrl}`, { targetUrl }));
            }

            const options = {
                method,
                headers,
                timeout: remaining,
                rejectUnauthorized: false // We capture evidence even if TLS is broken
            };

            const timer = setTimeout(() => {
                if (req) req.destroy();
                settle(reject, new NetworkContextExpiredError(`Network context expired (deadline exceeded) for ${targetUrl}`, { targetUrl }));
            }, remaining);

            const req = requestModule.request(parsedUrl, options, (res) => {
                // Handle redirects
                if (followRedirects && [301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
                    clearTimeout(timer);
                    req.destroy();
                    // Resolve relative location
                    const nextUrl = new url.URL(res.headers.location, targetUrl).toString();
                    return this._executeRequest(ctx, nextUrl, method, headers, followRedirects, redirectCount + 1)
                        .then(r => settle(resolve, r))
                        .catch(e => settle(reject, e));
                }

                const chunks = [];
                let downloadedBytes = 0;
                const limit = ctx.responseLimit;

                // Handle encoding
                let stream = res;
                const encoding = res.headers['content-encoding'];
                if (encoding === 'gzip') {
                    stream = res.pipe(zlib.createGunzip());
                } else if (encoding === 'deflate') {
                    stream = res.pipe(zlib.createInflate());
                }

                stream.on('data', (chunk) => {
                    downloadedBytes += chunk.length;
                    if (downloadedBytes > limit) {
                        stream.destroy();
                        req.destroy();
                        clearTimeout(timer);
                        return settle(reject, new ResponseTooLargeError(`Response body exceeded limit of ${limit} bytes`, { targetUrl }));
                    }
                    chunks.push(chunk);
                });

                stream.on('end', () => {
                    clearTimeout(timer);
                    const bodyBuffer = Buffer.concat(chunks);
                    settle(resolve, {
                        url: targetUrl,
                        finalUrl: targetUrl, // Since we handled redirects recursively, this is the final URL
                        statusCode: res.statusCode,
                        headers: res.headers,
                        body: bodyBuffer.toString('utf8'),
                        rawBodyBase64: bodyBuffer.toString('base64'),
                        redirectCount,
                        timestamp: new Date().toISOString()
                    });
                });

                stream.on('error', (err) => {
                    clearTimeout(timer);
                    settle(reject, new CsiHttpError(`Error reading response stream: ${err.message}`, { targetUrl, cause: err }));
                });
            });

            req.on('error', (err) => {
                clearTimeout(timer);
                settle(reject, new CsiHttpError(`HTTP request error: ${err.message}`, { targetUrl, cause: err }));
            });

            req.end();
        });
    }

    async healthCheck() {
        const start = Date.now();
        try {
            const { NetworkExecutionContext } = require('./NetworkExecutionContext');
            const mockCtx = new NetworkExecutionContext({
                executionId: 'healthcheck',
                targetId: 'http://1.1.1.1',
                timeout: 5000,
                retryPolicy: { maxRetries: 0, backoffMs: 0 }
            });
            await this.query(mockCtx, { method: 'HEAD' });
            return { healthy: true, latencyMs: Date.now() - start };
        } catch {
            return { healthy: false, latencyMs: Date.now() - start };
        }
    }
}

module.exports = { HttpClient, CsiHttpError };
