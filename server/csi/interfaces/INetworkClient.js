'use strict';

const { CsiNotImplementedError } = require('./IIntelligenceEngine');

/**
 * INetworkClient
 *
 * Abstract base for all CSI network protocol clients.
 * Concrete implementations: DnsClient, TlsClient, TcpClient, HttpClient.
 *
 * Rule: Raw protocol logic (sockets, TLS handshakes, DNS packets) must
 * ONLY exist inside INetworkClient implementations — never inside engines.
 *
 * @abstract
 */
class INetworkClient {
    constructor() {
        if (new.target === INetworkClient) {
            throw new CsiNotImplementedError(
                'constructor',
                'INetworkClient cannot be instantiated directly. Extend it.'
            );
        }
    }

    /**
     * Execute a network query using the protocol this client implements.
     *
     * @param {import('./NetworkExecutionContext')} ctx
     * @param {object} params - Protocol-specific parameters (e.g. port, dns record type)
     * @returns {Promise<object>} - Structured response (protocol-specific shape)
     */
    async query(ctx, params = {}) { // eslint-disable-line no-unused-vars
        throw new CsiNotImplementedError('query', this.constructor.name);
    }

    /**
     * Returns the protocol this client implements.
     * @returns {string} e.g. 'dns', 'tls', 'tcp', 'http'
     */
    protocol() {
        throw new CsiNotImplementedError('protocol', this.constructor.name);
    }
}

module.exports = { INetworkClient };
