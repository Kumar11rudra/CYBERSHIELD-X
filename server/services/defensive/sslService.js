'use strict';

const { isValidDomain } = require('../../utils/validators');
const { isPrivateOrLoopback } = require('../../utils/ssrfValidator');
const csiComposition = require('../../composition/csiComposition');
const { NetworkExecutionContext } = require('../../csi/network/NetworkExecutionContext');
const cache = require('../../utils/cache');
const logger = require('../../utils/logger');

// 5-minute TTL for SSL results (seconds)
const SSL_TTL_SECONDS = 5 * 60;

const computeSslGrade = (tlsResponse) => {
  if (!tlsResponse || tlsResponse.error) return 'F';

  const now = Date.now();
  const parsed = tlsResponse.parsed || {};
  const protocol = tlsResponse.protocol || '';
  const cipherName = (tlsResponse.cipher && tlsResponse.cipher.name) || '';

  const DEPRECATED_TLS = ['TLSv1', 'TLSv1.1', 'SSLv2', 'SSLv3'];
  const WEAK_CIPHERS = ['RC4', 'DES', 'NULL', 'EXPORT', 'MD5', 'ADH', 'AECDH', '3DES'];

  const isDeprecated = DEPRECATED_TLS.some(d => protocol.includes(d));
  const isWeakCipher = WEAK_CIPHERS.some(w => cipherName.toUpperCase().includes(w));

  if (!tlsResponse.authorized && tlsResponse.authorizationError) {
    const err = (tlsResponse.authorizationError || '').toUpperCase();
    if (err.includes('EXPIRED') || err.includes('SELF_SIGNED') || err.includes('DEPTH_ZERO')) return 'F';
  }

  if (parsed.validTo) {
    const expiry = new Date(parsed.validTo).getTime();
    if (expiry < now) return 'F'; // Expired
  }

  if (isDeprecated) return 'C';
  if (isWeakCipher) return 'C';

  if (parsed.validTo) {
    const daysLeft = (new Date(parsed.validTo).getTime() - now) / 86400000;
    if (daysLeft < 30) return 'B';
  }

  return 'A';
};

class SslService {
  static async checkSSL(domain, execId) {
    if (!domain || typeof domain !== 'string') {
      throw new Error('domain field is required.');
    }

    const clean = domain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');

    // ── Cache check ─────────────────────────────────────────────────────────
    const cacheKey = `SSL:${clean}`;
    try {
      const cached = await cache.get(cacheKey);
      if (cached) {
        logger.info(`[SSL-CACHE] HIT for ${clean}`);
        return cached;
      }
      logger.info(`[SSL-CACHE] MISS for ${clean}`);
    } catch (cacheErr) {
      logger.warn(`[SSL-CACHE] Cache read error, proceeding without cache: ${cacheErr.message}`);
    }

    if (!isValidDomain(clean)) {
      throw new Error('Enter a valid domain name (e.g., example.com).');
    }
    if (await isPrivateOrLoopback(clean)) {
      throw new Error('Private or loopback targets are not permitted.');
    }

    const tlsClient = csiComposition.networkClients.tlsClient;

    let tlsResponse;
    let connectionError = null;
    try {
      const ctx = new NetworkExecutionContext({
        executionId: execId,
        targetId: clean,
        timeout: 12000,
        retryPolicy: { maxRetries: 0, backoffMs: 0 },
      });
      tlsResponse = await tlsClient.query(ctx, { port: 443 });
    } catch (err) {
      connectionError = err.message;
    }

    if (connectionError || !tlsResponse) {
      return {
        domain: clean,
        ssl: {
          grade: 'F',
          subject: 'Connection Failed',
          issuer: 'N/A',
          isValid: false,
          isExpiringSoon: false,
          daysLeft: 0,
          validFrom: 'N/A',
          validTo: 'N/A',
          protocol: 'N/A',
          subjectAltNames: [],
        }
      };
    }

    const grade = computeSslGrade(tlsResponse);
    const parsed = tlsResponse.parsed || {};
    const daysLeft = parsed.validTo ? Math.round((new Date(parsed.validTo).getTime() - Date.now()) / 86400000) : 0;
    
    let subjectAltNames = [];
    if (parsed.subjectAltName) {
      if (typeof parsed.subjectAltName === 'string') {
        subjectAltNames = parsed.subjectAltName.split(',').map(s => s.trim().replace(/^DNS:/, ''));
      } else if (Array.isArray(parsed.subjectAltName)) {
        subjectAltNames = parsed.subjectAltName.map(s => String(s).trim().replace(/^DNS:/, ''));
      }
    }

    const subjectStr = parsed.subject 
      ? (typeof parsed.subject === 'string' ? parsed.subject : parsed.subject.CN || JSON.stringify(parsed.subject))
      : 'Unknown Subject';

    const issuerStr = parsed.issuer
      ? (typeof parsed.issuer === 'string' ? parsed.issuer : parsed.issuer.O || parsed.issuer.CN || JSON.stringify(parsed.issuer))
      : 'Unknown Issuer';

    const response = {
      domain: clean,
      ssl: {
        grade,
        subject: subjectStr,
        issuer: issuerStr,
        isValid: tlsResponse.authorized !== false && daysLeft > 0,
        isExpiringSoon: daysLeft > 0 && daysLeft < 30,
        daysLeft,
        validFrom: parsed.validFrom ? new Date(parsed.validFrom).toLocaleDateString() : 'N/A',
        validTo: parsed.validTo ? new Date(parsed.validTo).toLocaleDateString() : 'N/A',
        protocol: tlsResponse.protocol || 'TLSv1.3',
        subjectAltNames,
      }
    };

    // ── Cache successful result (grade !== 'F' due to connection failure) ──
    try {
      await cache.set(cacheKey, response, SSL_TTL_SECONDS);
      logger.info(`[SSL-CACHE] Cached result for ${clean} (TTL: ${SSL_TTL_SECONDS}s)`);
    } catch (cacheErr) {
      logger.warn(`[SSL-CACHE] Cache write error (non-fatal): ${cacheErr.message}`);
    }

    return response;
  }
}

module.exports = SslService;
