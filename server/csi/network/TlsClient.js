'use strict';

const tls    = require('tls');
const crypto = require('crypto');

const { INetworkClient }               = require('../interfaces/INetworkClient');
const { CsiTlsError, CsiTimeoutError } = require('../errors/CsiErrors');

/**
 * TlsClient
 *
 * INetworkClient implementation for TLS handshakes and certificate extraction.
 * Uses Node.js built-in `tls` and `crypto.X509Certificate`.
 *
 * Connects with `rejectUnauthorized: false` so that expired or self-signed
 * certificates are still collected as evidence (we flag them as findings,
 * we do not refuse to collect them).
 */
class TlsClient extends INetworkClient {
    /**
     * @param {object} [options]
     * @param {number} [options.defaultTimeout] - ms (default: 10000)
     * @param {number} [options.defaultPort]    - (default: 443)
     */
    constructor(options = {}) {
        super();
        this._defaultTimeout = options.defaultTimeout || 10000;
        this._defaultPort    = options.defaultPort    || 443;
    }

    protocol() { return 'tls'; }

    /**
     * Perform a TLS handshake and extract certificate data.
     *
     * @param {import('./NetworkExecutionContext')} ctx
     * @param {object} params
     * @param {number} [params.port]    - Port (default: 443)
     * @returns {Promise<TlsResponse>}
     */
    async query(ctx, params = {}) {
        const target  = ctx.targetId;
        const port    = params.port    || this._defaultPort;
        const timeout = ctx.timeout || this._defaultTimeout;

        if (!target) throw new CsiTlsError('TlsClient.query: target is required in ctx.');

        return new Promise((resolve, reject) => {
            let settled = false;
            const settle = (fn, val) => { if (!settled) { settled = true; fn(val); } };

            const timer = setTimeout(() => {
                socket.destroy();
                settle(reject, new CsiTimeoutError(
                    `TLS timeout after ${timeout}ms for ${target}:${port}`,
                    { timeoutMs: timeout, target, port }
                ));
            }, timeout);

            const socket = tls.connect(
                {
                    host              : target,
                    port,
                    servername        : target,     // SNI
                    rejectUnauthorized: false,       // collect even expired/self-signed
                    timeout,
                },
                () => {
                    try {
                        const peerCert   = socket.getPeerCertificate(true); // chain=true
                        const cipher     = socket.getCipher();
                        const protocol   = socket.getProtocol();
                        const authorized = socket.authorized;
                        const authError  = socket.authorizationError;

                        // Build PEM from raw DER if available
                        const pem = peerCert && peerCert.raw
                            ? this._derToPem(peerCert.raw)
                            : null;

                        // Parse with X509Certificate for richer data
                        const parsed = peerCert && peerCert.raw
                            ? this._parseX509(peerCert.raw)
                            : null;

                        // Extract full chain
                        const chain = this._extractChain(peerCert);

                        clearTimeout(timer);
                        socket.destroy();
                        settle(resolve, {
                            target,
                            port,
                            pem,
                            parsed,
                            chain,
                            cipher,
                            protocol,
                            authorized,
                            authorizationError: authError,
                            connectedAt: new Date().toISOString(),
                        });
                    } catch (err) {
                        clearTimeout(timer);
                        socket.destroy();
                        settle(reject, new CsiTlsError(
                            `Certificate parse error for ${target}: ${err.message}`,
                            { target, port, cause: err }
                        ));
                    }
                }
            );

            socket.on('error', err => {
                clearTimeout(timer);
                settle(reject, new CsiTlsError(
                    `TLS connection error for ${target}:${port}: ${err.message}`,
                    { target, port, code: err.code, cause: err }
                ));
            });
        });
    }

    /** Convert DER Buffer to PEM string */
    _derToPem(derBuffer) {
        const b64 = derBuffer.toString('base64').match(/.{1,64}/g).join('\n');
        return `-----BEGIN CERTIFICATE-----\n${b64}\n-----END CERTIFICATE-----`;
    }

    /** Parse DER Buffer using Node.js crypto.X509Certificate (Node 15.6+) */
    _parseX509(derBuffer) {
        try {
            const cert = new crypto.X509Certificate(derBuffer);
            return {
                subject         : cert.subject,
                issuer          : cert.issuer,
                subjectAltName  : cert.subjectAltName,
                validFrom       : cert.validFrom,
                validTo         : cert.validTo,
                serialNumber    : cert.serialNumber,
                fingerprint     : cert.fingerprint,
                fingerprint256  : cert.fingerprint256,
                keyUsage        : cert.keyUsage,
                ca              : cert.ca,
            };
        } catch {
            return null;
        }
    }

    /** Walk the certificate chain and collect all certs */
    _extractChain(peerCert) {
        const chain = [];
        let current = peerCert;
        const seen  = new Set();
        while (current && current.raw && !seen.has(current.fingerprint)) {
            seen.add(current.fingerprint);
            chain.push({
                subject  : current.subject,
                issuer   : current.issuer,
                validFrom: current.valid_from,
                validTo  : current.valid_to,
                pem      : this._derToPem(current.raw),
            });
            current = current.issuerCertificate;
        }
        return chain;
    }

    /**
     * HealthCheck: attempt a TLS connection to a known-stable host.
     */
    async healthCheck() {
        const start = Date.now();
        try {
            const { NetworkExecutionContext } = require('./NetworkExecutionContext');
            const mockCtx = new NetworkExecutionContext({
                executionId: 'healthcheck',
                targetId: 'one.one.one.one',
                timeout: 5000,
                retryPolicy: { maxRetries: 0, backoffMs: 0 }
            });
            await this.query(mockCtx, { port: 443 });
            return { healthy: true, latencyMs: Date.now() - start };
        } catch {
            return { healthy: false, latencyMs: Date.now() - start };
        }
    }
}

module.exports = { TlsClient };
