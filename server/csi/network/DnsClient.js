'use strict';

const dns = require('dns');

const { INetworkClient }  = require('../interfaces/INetworkClient');
const { CsiDnsError, CsiTimeoutError } = require('../errors/CsiErrors');

/** Record types the DnsClient supports */
const SUPPORTED_RECORD_TYPES = Object.freeze(['A','AAAA','MX','TXT','SOA','NS','CNAME','PTR']);

/**
 * DnsClient
 *
 * INetworkClient implementation for DNS lookups using Node.js `dns.promises`.
 * Uses a dedicated Resolver instance so upstream DNS servers can be configured.
 *
 * No third-party libraries. Pure Node.js built-ins only.
 */
class DnsClient extends INetworkClient {
    /**
     * @param {object} [options]
     * @param {string[]} [options.servers]        - DNS resolvers (default: system)
     * @param {number}  [options.defaultTimeout]  - ms (default: 5000)
     */
    constructor(options = {}) {
        super();
        this._resolver = new dns.promises.Resolver();
        if (options.servers && options.servers.length > 0) {
            this._resolver.setServers(options.servers);
        }
        this._defaultTimeout = options.defaultTimeout || 5000;
    }

    protocol() { return 'dns'; }

    /**
     * Perform a DNS query.
     *
     * @param {import('./NetworkExecutionContext')} ctx
     * @param {object} params
     * @param {string} [params.recordType] - DNS record type (default: 'A')
     * @returns {Promise<{recordType, target, records, rawResponse}>}
     */
    async query(ctx, params = {}) {
        const target     = ctx.targetId;
        const recordType = params.recordType || 'A';
        const timeout    = ctx.timeout || this._defaultTimeout;

        if (!target) throw new CsiDnsError('DnsClient.query: target is required in ctx.');
        if (!SUPPORTED_RECORD_TYPES.includes(recordType.toUpperCase())) {
            throw new CsiDnsError(`DnsClient.query: unsupported record type "${recordType}".`);
        }

        const resolve = this._buildResolver(target, recordType.toUpperCase());
        const timer   = this._buildTimeout(target, recordType, timeout);

        try {
            const records = await Promise.race([resolve, timer]);
            return {
                recordType : recordType.toUpperCase(),
                target,
                records,
                rawResponse: records, // same shape — engines use this
                queriedAt  : new Date().toISOString(),
            };
        } catch (err) {
            if (err instanceof CsiTimeoutError || err instanceof CsiDnsError) throw err;
            // ENODATA / ENOTFOUND → not an error for our purposes, return empty
            if (err.code === 'ENODATA' || err.code === 'ENOTFOUND' || err.code === 'ESERVFAIL') {
                return { recordType: recordType.toUpperCase(), target, records: [], queriedAt: new Date().toISOString() };
            }
            throw new CsiDnsError(
                `DNS lookup failed for ${target} (${recordType}): ${err.message}`,
                { target, recordType, code: err.code, cause: err }
            );
        }
    }

    /** Build the resolver promise for a specific record type */
    _buildResolver(target, recordType) {
        switch (recordType) {
            case 'A':     return this._resolver.resolve4(target);
            case 'AAAA':  return this._resolver.resolve6(target);
            case 'MX':    return this._resolver.resolveMx(target);
            case 'TXT':   return this._resolver.resolveTxt(target);
            case 'SOA':   return this._resolver.resolveSoa(target);
            case 'NS':    return this._resolver.resolveNs(target);
            case 'CNAME': return this._resolver.resolveCname(target);
            case 'PTR':   return this._resolver.resolvePtr(target);
            default:      return this._resolver.resolve(target, recordType);
        }
    }

    /** Build a timeout promise that rejects with CsiTimeoutError */
    _buildTimeout(target, recordType, ms) {
        return new Promise((_, reject) => {
            setTimeout(
                () => reject(new CsiTimeoutError(
                    `DNS timeout after ${ms}ms for ${target} (${recordType})`,
                    { timeoutMs: ms, target, recordType }
                )),
                ms
            );
        });
    }

    /**
     * Simple healthCheck: resolve a known-stable hostname.
     * @returns {Promise<{healthy: boolean, latencyMs: number}>}
     */
    async healthCheck() {
        const start = Date.now();
        try {
            const { NetworkExecutionContext } = require('./NetworkExecutionContext');
            const mockCtx = new NetworkExecutionContext({
                executionId: 'healthcheck',
                targetId: 'dns.google',
                timeout: 3000,
                retryPolicy: { maxRetries: 0, backoffMs: 0 }
            });
            await this.query(mockCtx, { recordType: 'A' });
            return { healthy: true, latencyMs: Date.now() - start };
        } catch {
            return { healthy: false, latencyMs: Date.now() - start };
        }
    }
}

module.exports = { DnsClient, SUPPORTED_RECORD_TYPES };
