'use strict';

const net   = require('net');
const https = require('https');

const { INetworkClient }                    = require('../interfaces/INetworkClient');
const { CsiWhoisError, CsiTimeoutError }    = require('../errors/CsiErrors');

/**
 * TLD → WHOIS server mapping (common TLDs hardcoded for speed).
 * IANA lookup is used as fallback for unlisted TLDs.
 */
const TLD_WHOIS_MAP = Object.freeze({
    com: 'whois.verisign-grs.com', net: 'whois.verisign-grs.com',
    org: 'whois.pir.org',         info: 'whois.afilias.net',
    biz: 'whois.biz',             io:   'whois.nic.io',
    co:  'whois.nic.co',          us:   'whois.nic.us',
    uk:  'whois.nic.uk',          in:   'whois.registry.in',
    au:  'whois.auda.org.au',     de:   'whois.denic.de',
    fr:  'whois.nic.fr',          jp:   'whois.jprs.jp',
    ca:  'whois.cira.ca',         ru:   'whois.tcinet.ru',
    cn:  'whois.cnnic.cn',        nl:   'whois.domain-registry.nl',
    eu:  'whois.eu',              ai:   'whois.nic.ai',
    dev: 'whois.nic.google',      app:  'whois.nic.google',
    xyz: 'whois.nic.xyz',         tech: 'whois.nic.tech',
    online: 'whois.nic.online',   gov: 'whois.dotgov.gov',
    edu: 'whois.educause.edu',    me:   'whois.nic.me',
    tv:  'whois.nic.tv',          cc:   'whois.nic.cc',
    mobi: 'whois.dotmobiregistry.net',
    name: 'whois.nic.name',
});

/**
 * TcpClient
 *
 * INetworkClient for WHOIS protocol (TCP port 43) with RDAP fallback.
 * Uses Node.js built-in `net` and `https`.
 */
class TcpClient extends INetworkClient {
    /**
     * @param {object} [options]
     * @param {number} [options.defaultTimeout] - ms (default: 10000)
     */
    constructor(options = {}) {
        super();
        this._defaultTimeout = options.defaultTimeout || 10000;
    }

    protocol() { return 'tcp'; }

    /**
     * Execute a TCP query based on mode.
     *
     * @param {import('./NetworkExecutionContext')} ctx
     * @param {object} params
     * @param {string} [params.mode]   - 'whois' | 'rdap' | 'probe' | 'banner' (default: 'whois')
     * @param {number} [params.port]   - Port for probe/banner modes
     * @param {string} [params.payload] - Payload to send for banner grabbing
     * @returns {Promise<any>}
     */
    async query(ctx, params = {}) {
        const target  = ctx.targetId;
        const mode    = params.mode || 'whois';
        const timeout = ctx.timeout || this._defaultTimeout;
        const port    = params.port;

        if (!target) throw new CsiWhoisError('TcpClient.query: target is required in ctx.');

        if (mode === 'probe') {
            return this._probePort(target, port, timeout);
        }

        if (mode === 'banner') {
            return this._bannerGrab(target, port, params.payload, timeout);
        }

        if (mode === 'rdap') {
            return this._rdapQuery(target, timeout);
        }

        // Determine WHOIS server
        const tld         = target.split('.').pop().toLowerCase();
        const whoisServer = TLD_WHOIS_MAP[tld] || await this._ianaLookup(tld, timeout);

        try {
            const raw = await this._whoisQuery(whoisServer, target, timeout);
            return {
                target,
                whoisServer,
                protocol  : 'whois',
                rawText   : raw,
                queriedAt : new Date().toISOString(),
            };
        } catch (err) {
            // WHOIS failed — attempt RDAP as automatic fallback
            try {
                return await this._rdapQuery(target, timeout, true);
            } catch (rdapErr) {
                throw new CsiWhoisError(
                    `WHOIS and RDAP both failed for ${target}: ${rdapErr.message}`,
                    { domain: target, whoisServer, fallbackUsed: true, cause: rdapErr }
                );
            }
        }
    }

    async _probePort(target, port, timeout) {
        return new Promise((resolve) => {
            const timer = setTimeout(() => {
                socket.destroy();
                resolve({ port, status: 'filtered' });
            }, timeout);

            const socket = new net.Socket();
            socket.connect(port, target, () => {
                clearTimeout(timer);
                socket.destroy();
                resolve({ port, status: 'open' });
            });

            socket.on('error', (err) => {
                clearTimeout(timer);
                socket.destroy();
                if (err.code === 'ECONNREFUSED') {
                    resolve({ port, status: 'closed' });
                } else {
                    resolve({ port, status: 'filtered' });
                }
            });
        });
    }

    async _bannerGrab(target, port, payload, timeout) {
        return new Promise((resolve, reject) => {
            let settled = false;
            const settle = (fn, v) => { if (!settled) { settled = true; fn(v); } };
            const chunks = [];

            const timer = setTimeout(() => {
                socket.destroy();
                settle(resolve, { port, status: 'timeout', data: Buffer.concat(chunks) });
            }, timeout);

            const socket = new net.Socket();
            socket.connect(port, target, () => {
                if (payload) socket.write(payload);
            });

            socket.on('data', chunk => {
                chunks.push(chunk);
                // Simple heuristic to stop reading after some data
                if (Buffer.concat(chunks).length > 4096) {
                    clearTimeout(timer);
                    socket.destroy();
                    settle(resolve, { port, status: 'open', data: Buffer.concat(chunks) });
                }
            });
            
            socket.on('end', () => { 
                clearTimeout(timer); 
                settle(resolve, { port, status: 'open', data: Buffer.concat(chunks) }); 
            });
            
            socket.on('error', err => { 
                clearTimeout(timer); 
                // Return whatever we have if it errored out mid-stream
                if (chunks.length > 0) {
                    settle(resolve, { port, status: 'open', data: Buffer.concat(chunks) });
                } else {
                    settle(resolve, { port, status: err.code === 'ECONNREFUSED' ? 'closed' : 'filtered', error: err.message, data: Buffer.alloc(0) });
                }
            });
        });
    }

    /** Low-level TCP WHOIS socket query */
    async _whoisQuery(server, domain, timeout) {
        return new Promise((resolve, reject) => {
            let settled = false;
            const settle = (fn, v) => { if (!settled) { settled = true; fn(v); } };
            const chunks = [];

            const timer = setTimeout(() => {
                socket.destroy();
                settle(reject, new CsiTimeoutError(
                    `WHOIS TCP timeout after ${timeout}ms querying ${server} for ${domain}`,
                    { timeoutMs: timeout }
                ));
            }, timeout);

            const socket = net.createConnection({ host: server, port: 43 }, () => {
                socket.write(`${domain}\r\n`);
            });

            socket.on('data',  chunk => chunks.push(chunk));
            socket.on('end',   ()    => { clearTimeout(timer); settle(resolve, Buffer.concat(chunks).toString('utf8')); });
            socket.on('error', err  => { clearTimeout(timer); settle(reject, err); });
        });
    }

    /** Query IANA WHOIS to find the authoritative server for a TLD */
    async _ianaLookup(tld, timeout) {
        try {
            const response = await this._whoisQuery('whois.iana.org', tld, timeout);
            const match    = response.match(/^refer:\s+(.+)$/im);
            if (match) return match[1].trim();
        } catch { /* swallow — use rdap */ }
        // Return RDAP if we can't find WHOIS server
        throw new CsiWhoisError(`No WHOIS server found for TLD: .${tld}`);
    }

    /** RDAP query via rdap.org gateway (HTTPS JSON) */
    async _rdapQuery(domain, timeout, isFallback = false) {
        const url = `https://rdap.org/domain/${domain}`;
        return new Promise((resolve, reject) => {
            let settled = false;
            const settle = (fn, v) => { if (!settled) { settled = true; fn(v); } };
            const timer  = setTimeout(() => settle(reject, new CsiTimeoutError(
                `RDAP timeout after ${timeout}ms for ${domain}`, { timeoutMs: timeout }
            )), timeout);

            const req = https.get(url, { timeout }, res => {
                if (res.statusCode !== 200) {
                    clearTimeout(timer);
                    settle(reject, new CsiWhoisError(`RDAP returned status ${res.statusCode} for ${domain}`));
                    return;
                }
                const chunks = [];
                res.on('data', chunk => chunks.push(chunk));
                res.on('end',  ()    => {
                    clearTimeout(timer);
                    try {
                        const json = JSON.parse(Buffer.concat(chunks).toString());
                        settle(resolve, {
                            target    : domain,
                            whoisServer: 'rdap.org',
                            protocol  : 'rdap',
                            rdapJson  : json,
                            rawText   : JSON.stringify(json, null, 2),
                            fallback  : isFallback,
                            queriedAt : new Date().toISOString(),
                        });
                    } catch (err) {
                        settle(reject, new CsiWhoisError(`RDAP JSON parse error: ${err.message}`, { cause: err }));
                    }
                });
            });

            req.on('error', err => {
                clearTimeout(timer);
                settle(reject, new CsiWhoisError(
                    `RDAP network error for ${domain}: ${err.message}`, { domain, cause: err }
                ));
            });
        });
    }

    /** HealthCheck: verify TCP port 43 reachability to a stable WHOIS server */
    async healthCheck() {
        const start = Date.now();
        try {
            const { NetworkExecutionContext } = require('./NetworkExecutionContext');
            const mockCtx = new NetworkExecutionContext({
                executionId: 'healthcheck',
                targetId: 'test.com',
                timeout: 5000,
                retryPolicy: { maxRetries: 0, backoffMs: 0 }
            });
            await this.query(mockCtx);
            return { healthy: true, latencyMs: Date.now() - start };
        } catch {
            return { healthy: false, latencyMs: Date.now() - start };
        }
    }
}

module.exports = { TcpClient, TLD_WHOIS_MAP };
