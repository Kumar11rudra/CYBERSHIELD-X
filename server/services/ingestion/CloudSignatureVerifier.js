/**
 * 🛡️ CyberShield X — CloudSignatureVerifier (Phase 80 Step 3)
 *
 * Enterprise Multi-Cloud Cryptographic & Transport Verification Layer:
 * - AWS SNS: Connected RSA-SHA256 signature verification over canonical SNS string with
 *   strict SSRF-guarded X.509 certificate retrieval, LRU caching, and bounded fetch controls;
 *   Air-Gapped pre-shared secret verification (header: X-CyberShield-Key).
 * - AWS SNS SubscriptionConfirmation: Cryptographically validated, strictly destination-guarded
 *   auto-confirmation (or staged manual confirmation for zero-egress networks).
 * - GCP Pub/Sub: Connected Google OIDC JWT Bearer token verification against Google JWKS;
 *   Air-Gapped pre-shared secret verification (header: X-CyberShield-Token).
 * - Azure Event Grid: Header-based SAS/secret token verification (aeg-sas-token / X-CyberShield-Token);
 *   Synchronous SubscriptionValidation challenge-response handshake.
 * - Transport Freshness & Replay Guard: Enforces transport delivery age <= 15 minutes and
 *   future clock skew <= 5 minutes.
 * - Tenant Security Boundary: Binds authentication strictly to enrolled connector metadata;
 *   rejects cross-tenant injections and cloud account ID mismatches.
 * - Secret & Logging Rules: Strict query-secret prohibition (?token= -> HTTP 400); zero raw secrets
 *   in logs, error outputs, or diagnostic fields.
 * - Zero Dependencies: Built exclusively with native Node.js crypto, https, and existing repository utilities.
 */

'use strict';

const crypto = require('crypto');
const https = require('https');
const { URL } = require('url');
const { isPrivateOrLoopback, isPrivateIp, normalizeHostname, secureHttpsAgent } = require('../../utils/ssrfValidator');
const logger = require('../../utils/logger');

/**
 * Bounded LRU Cache for certificates and JWKS keys to prevent unbounded memory growth.
 */
class BoundedLruCache {
  constructor(maxSize = 50, defaultTtlMs = 24 * 60 * 60 * 1000) {
    this.maxSize = maxSize;
    this.defaultTtlMs = defaultTtlMs;
    this.cache = new Map();
  }

  get(key) {
    if (!this.cache.has(key)) return null;
    const item = this.cache.get(key);
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    // Re-insert to maintain LRU order (most recently used at the end)
    this.cache.delete(key);
    this.cache.set(key, item);
    return item.value;
  }

  set(key, value, customTtlMs = null) {
    const ttl = customTtlMs !== null ? customTtlMs : this.defaultTtlMs;
    const expiresAt = Date.now() + ttl;

    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Evict oldest (first key in Map)
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, { value, expiresAt });
  }

  has(key) {
    return this.get(key) !== null;
  }

  clear() {
    this.cache.clear();
  }

  size() {
    // Purge expired and return active count
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.cache.delete(key);
      }
    }
    return this.cache.size;
  }
}

class CloudSignatureVerifier {
  constructor(options = {}) {
    this.certCache = options.certCache || new BoundedLruCache(50, 24 * 60 * 60 * 1000);
    this.jwksCache = options.jwksCache || new BoundedLruCache(20, 24 * 60 * 60 * 1000);
    this.maxCertSizeBytes = options.maxCertSizeBytes || 100 * 1024; // 100 KB
    this.fetchTimeoutMs = options.fetchTimeoutMs || 3000; // 3 seconds
    this.transportMaxAgeMs = options.transportMaxAgeMs || 15 * 60 * 1000; // 15 minutes
    this.transportMaxFutureSkewMs = options.transportMaxFutureSkewMs || 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Safe constant-time string comparison preventing timing side-channel attacks.
   */
  _constantTimeCompare(a, b) {
    if (typeof a !== 'string' || typeof b !== 'string') return false;
    const bufA = Buffer.from(a, 'utf8');
    const bufB = Buffer.from(b, 'utf8');
    if (bufA.length !== bufB.length) {
      // Constant-time dummy comparison to mitigate length-leakage timing
      crypto.timingSafeEqual(bufA, bufA);
      return false;
    }
    return crypto.timingSafeEqual(bufA, bufB);
  }

  /**
   * Prohibits credential leakage via URL query parameters (?token=, ?secret=, ?key=, etc.)
   */
  _checkQueryStringSecrets(query) {
    if (!query || typeof query !== 'object') return false;
    const forbiddenParamKeys = ['token', 'secret', 'key', 'sig', 'signature', 'sas', 'aeg-sas-token'];
    const queryKeys = Object.keys(query).map((k) => k.toLowerCase());
    return queryKeys.some((qk) => forbiddenParamKeys.includes(qk));
  }

  /**
   * Verifies transport-layer delivery freshness against server time.
   */
  verifyTransportFreshness(transportTimestamp, serverNow = new Date()) {
    if (!transportTimestamp) {
      return { isValid: false, reason: 'MISSING_AUTHENTICATION', details: { message: 'Missing transport timestamp' } };
    }

    const tDate = transportTimestamp instanceof Date ? transportTimestamp : new Date(transportTimestamp);
    if (isNaN(tDate.getTime())) {
      return { isValid: false, reason: 'INVALID_TRANSPORT_TIMESTAMP', details: { message: 'Invalid transport timestamp format' } };
    }

    const nowMs = serverNow.getTime();
    const tMs = tDate.getTime();
    const ageMs = nowMs - tMs;

    // Stale check (older than 15 minutes)
    if (ageMs > this.transportMaxAgeMs) {
      return {
        isValid: false,
        reason: 'STALE_TRANSPORT',
        details: { ageMs, maxAgeMs: this.transportMaxAgeMs },
      };
    }

    // Future clock-skew check (more than 5 minutes in future)
    if (tMs - nowMs > this.transportMaxFutureSkewMs) {
      return {
        isValid: false,
        reason: 'FUTURE_TRANSPORT',
        details: { skewMs: tMs - nowMs, maxFutureSkewMs: this.transportMaxFutureSkewMs },
      };
    }

    return { isValid: true, transportTime: tDate, skewMs: tMs - nowMs };
  }

  /**
   * Verifies that the request cannot bypass or inject unauthorized tenant/account metadata.
   */
  verifyTenantConnectorBinding(connectorConfig, requestMeta = {}) {
    if (!connectorConfig || !connectorConfig.organizationId) {
      return { isValid: false, reason: 'INVALID_CONNECTOR_CONFIGURATION' };
    }

    // 1. If payload or request header attempts to specify a differing organizationId, strictly reject
    if (requestMeta.organizationId && String(requestMeta.organizationId) !== String(connectorConfig.organizationId)) {
      return {
        isValid: false,
        reason: 'TENANT_MISMATCH',
        details: { expected: connectorConfig.organizationId },
      };
    }

    // 2. Cloud Account ID whitelist verification
    if (requestMeta.cloudAccountId) {
      const enrolled = connectorConfig.enrolledAccountIds;
      if (Array.isArray(enrolled) && enrolled.length > 0) {
        const matched = enrolled.map(String).includes(String(requestMeta.cloudAccountId));
        if (!matched) {
          return {
            isValid: false,
            reason: 'CLOUD_ACCOUNT_MISMATCH',
            details: { provided: String(requestMeta.cloudAccountId) },
          };
        }
      }
    }

    return { isValid: true, organizationId: connectorConfig.organizationId };
  }

  // ==========================================================================
  // AWS SNS VERIFICATION (CONNECTED & AIR-GAPPED)
  // ==========================================================================

  /**
   * Constructs the official AWS SNS canonical string for signature verification.
   */
  _buildAwsSnsCanonicalString(msg) {
    if (!msg || typeof msg !== 'object') return '';
    let str = '';

    if (msg.Type === 'Notification') {
      str += `Message\n${msg.Message}\n`;
      str += `MessageId\n${msg.MessageId}\n`;
      if (msg.Subject !== undefined && msg.Subject !== null) {
        str += `Subject\n${msg.Subject}\n`;
      }
      str += `Timestamp\n${msg.Timestamp}\n`;
      str += `TopicArn\n${msg.TopicArn}\n`;
      str += `Type\n${msg.Type}\n`;
    } else if (msg.Type === 'SubscriptionConfirmation' || msg.Type === 'UnsubscribeConfirmation') {
      str += `Message\n${msg.Message}\n`;
      str += `MessageId\n${msg.MessageId}\n`;
      str += `SubscribeURL\n${msg.SubscribeURL}\n`;
      str += `Timestamp\n${msg.Timestamp}\n`;
      str += `Token\n${msg.Token}\n`;
      str += `TopicArn\n${msg.TopicArn}\n`;
      str += `Type\n${msg.Type}\n`;
    }

    return str;
  }

  /**
   * Validates SigningCertURL strictly against AWS SNS hostname, scheme, and SSRF rules.
   */
  _validateSigningCertUrl(certUrl) {
    if (!certUrl || typeof certUrl !== 'string') {
      return { isValid: false, reason: 'CERTIFICATE_URL_REJECTED' };
    }

    let parsed;
    try {
      parsed = new URL(certUrl);
    } catch {
      return { isValid: false, reason: 'CERTIFICATE_URL_REJECTED' };
    }

    // HTTPS only
    if (parsed.protocol !== 'https:') {
      return { isValid: false, reason: 'CERTIFICATE_URL_REJECTED', details: { protocol: parsed.protocol } };
    }

    // Strict Amazon SNS hostname whitelist
    const snsHostRegex = /^sns\.[a-z0-9-]+\.amazonaws\.com$/i;
    if (!snsHostRegex.test(parsed.hostname)) {
      return { isValid: false, reason: 'CERTIFICATE_URL_REJECTED', details: { hostname: parsed.hostname } };
    }

    // PEM extension required; search params/hash prohibited
    if (!parsed.pathname.endsWith('.pem') || parsed.search !== '' || parsed.hash !== '') {
      return { isValid: false, reason: 'CERTIFICATE_URL_REJECTED' };
    }

    // Static SSRF check on hostname string (blocks e.g. embedded IP trickery)
    const normHost = normalizeHostname(parsed.hostname);
    if (normHost === 'localhost' || normHost === '169.254.169.254' || isPrivateIp(normHost)) {
      return { isValid: false, reason: 'SSRF_BLOCKED' };
    }

    return { isValid: true, parsedUrl: parsed };
  }

  /**
   * Retrieves and parses an X.509 certificate over HTTPS with strict SSRF, timeout, and size limits.
   */
  async _fetchAndValidateSnsCert(certUrl) {
    // 1. Check LRU Cache first
    const cached = this.certCache.get(certUrl);
    if (cached) {
      return { isValid: true, cert: cached, fromCache: true };
    }

    // 2. Validate URL bounds
    const urlValidation = this._validateSigningCertUrl(certUrl);
    if (!urlValidation.isValid) {
      return urlValidation;
    }

    // 3. SSRF asynchronous resolution check
    const isSsrf = await isPrivateOrLoopback(urlValidation.parsedUrl.hostname);
    if (isSsrf) {
      return { isValid: false, reason: 'SSRF_BLOCKED' };
    }

    // 4. Fetch certificate with bounded response size and timeout
    const certPem = await new Promise((resolve, reject) => {
      const options = {
        hostname: urlValidation.parsedUrl.hostname,
        port: 443,
        path: urlValidation.parsedUrl.pathname,
        method: 'GET',
        agent: secureHttpsAgent,
        timeout: this.fetchTimeoutMs,
        headers: {
          'User-Agent': 'CyberShield-X-Verification/1.0',
          Accept: 'application/x-pem-file, text/plain',
        },
      };

      const req = https.request(options, (res) => {
        // Strictly prohibit redirects (maxRedirects: 0)
        if (res.statusCode >= 300 && res.statusCode < 400) {
          res.resume();
          return resolve({ error: 'REDIRECT_PROHIBITED', reason: 'CERTIFICATE_URL_REJECTED' });
        }

        if (res.statusCode !== 200) {
          res.resume();
          return resolve({ error: 'FETCH_FAILED', status: res.statusCode, reason: 'CERTIFICATE_URL_REJECTED' });
        }

        let body = '';
        let totalBytes = 0;

        res.setEncoding('utf8');
        res.on('data', (chunk) => {
          totalBytes += Buffer.byteLength(chunk, 'utf8');
          if (totalBytes > this.maxCertSizeBytes) {
            req.destroy();
            return resolve({ error: 'TOO_LARGE', reason: 'CERTIFICATE_TOO_LARGE' });
          }
          body += chunk;
        });

        res.on('end', () => {
          resolve({ body });
        });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({ error: 'TIMEOUT', reason: 'CERTIFICATE_FETCH_TIMEOUT' });
      });

      req.on('error', (err) => {
        if (/SSRF Blocked/i.test(err.message)) {
          return resolve({ error: 'SSRF', reason: 'SSRF_BLOCKED' });
        }
        resolve({ error: err.message, reason: 'CERTIFICATE_URL_REJECTED' });
      });

      req.end();
    });

    if (certPem.error) {
      return { isValid: false, reason: certPem.reason || 'CERTIFICATE_URL_REJECTED' };
    }

    // 5. Parse and cryptographically validate X.509 Certificate
    let x509;
    try {
      x509 = new crypto.X509Certificate(certPem.body);
    } catch {
      return { isValid: false, reason: 'INVALID_CERTIFICATE' };
    }

    // Validity period check
    const now = Date.now();
    const validFrom = new Date(x509.validFrom).getTime();
    const validTo = new Date(x509.validTo).getTime();

    if (now < validFrom || now > validTo) {
      return { isValid: false, reason: 'INVALID_CERTIFICATE', details: { expired: true } };
    }

    // Subject Common Name check
    const subject = x509.subject;
    if (!/CN=sns\.amazonaws\.com/i.test(subject) && !/CN=sns\.[a-z0-9-]+\.amazonaws\.com/i.test(subject)) {
      return { isValid: false, reason: 'INVALID_CERTIFICATE', details: { subjectMismatch: true } };
    }

    // Cache valid certificate
    const ttl = Math.min(validTo - now, this.certCache.defaultTtlMs);
    if (ttl > 0) {
      this.certCache.set(certUrl, x509, ttl);
    }

    return { isValid: true, cert: x509, fromCache: false };
  }

  /**
   * Fetches SubscribeURL for automated SNS confirmation under strict SSRF bounds.
   */
  async _fetchSubscribeUrl(subscribeUrl) {
    let parsed;
    try {
      parsed = new URL(subscribeUrl);
    } catch {
      return { isValid: false, reason: 'SSRF_BLOCKED' };
    }

    if (parsed.protocol !== 'https:') {
      return { isValid: false, reason: 'SSRF_BLOCKED' };
    }

    const snsHostRegex = /^sns\.[a-z0-9-]+\.amazonaws\.com$/i;
    if (!snsHostRegex.test(parsed.hostname)) {
      return { isValid: false, reason: 'SSRF_BLOCKED' };
    }

    const isSsrf = await isPrivateOrLoopback(parsed.hostname);
    if (isSsrf) {
      return { isValid: false, reason: 'SSRF_BLOCKED' };
    }

    return new Promise((resolve) => {
      const options = {
        hostname: parsed.hostname,
        port: 443,
        path: parsed.pathname + parsed.search,
        method: 'GET',
        agent: secureHttpsAgent,
        timeout: this.fetchTimeoutMs,
        headers: { 'User-Agent': 'CyberShield-X-Verification/1.0' },
      };

      const req = https.request(options, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400) {
          res.resume();
          return resolve({ isValid: false, reason: 'SSRF_BLOCKED', details: { redirectBlocked: true } });
        }
        res.resume();
        resolve({ isValid: res.statusCode === 200, statusCode: res.statusCode });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({ isValid: false, reason: 'CERTIFICATE_FETCH_TIMEOUT' });
      });

      req.on('error', (err) => {
        resolve({ isValid: false, reason: /SSRF/i.test(err.message) ? 'SSRF_BLOCKED' : 'FETCH_FAILED' });
      });

      req.end();
    });
  }

  /**
   * Verifies incoming AWS SNS message envelope.
   */
  async verifyAwsSns(requestData, connectorConfig) {
    const { body, headers = {}, query = {} } = requestData;

    // 1. Prohibit query-string secrets
    if (this._checkQueryStringSecrets(query)) {
      return { status: 'FAILED', isValid: false, reason: 'QUERY_SECRET_PROHIBITED' };
    }

    // 2. Air-Gapped / Egress-Restricted Shared Secret Mode
    if (connectorConfig.authMode === 'SHARED_SECRET') {
      const keyHeader = headers['x-cybershield-key'] || headers['X-CyberShield-Key'];
      if (!keyHeader) {
        return { status: 'FAILED', isValid: false, reason: 'MISSING_AUTHENTICATION' };
      }

      const isValidSecret = this._constantTimeCompare(keyHeader, connectorConfig.sharedSecret);
      if (!isValidSecret) {
        return { status: 'FAILED', isValid: false, reason: 'INVALID_SHARED_SECRET' };
      }

      // Check transport freshness if timestamp header provided
      const tHeader = headers['x-cybershield-timestamp'] || headers['X-CyberShield-Timestamp'] || body?.Timestamp;
      if (tHeader) {
        const fresh = this.verifyTransportFreshness(tHeader);
        if (!fresh.isValid) {
          return { status: 'FAILED', isValid: false, reason: fresh.reason, details: fresh.details };
        }
      }

      return {
        status: 'SHARED_SECRET',
        isValid: true,
        authMode: 'SHARED_SECRET',
        provider: 'AWS',
        organizationId: connectorConfig.organizationId,
      };
    }

    // 3. Connected Mode (SNS Signature Protocol)
    if (!body || typeof body !== 'object') {
      return { status: 'FAILED', isValid: false, reason: 'MISSING_AUTHENTICATION' };
    }

    const { Type, MessageId, TopicArn, Timestamp, Signature, SignatureVersion, SigningCertURL } = body;

    if (!Type || !MessageId || !TopicArn || !Timestamp || !Signature || !SigningCertURL) {
      return { status: 'FAILED', isValid: false, reason: 'MISSING_AUTHENTICATION' };
    }

    // Allowed SNS message types
    const allowedTypes = ['Notification', 'SubscriptionConfirmation', 'UnsubscribeConfirmation'];
    if (!allowedTypes.includes(Type)) {
      return { status: 'FAILED', isValid: false, reason: 'UNSUPPORTED_SIGNATURE_VERSION' };
    }

    // Signature Version check (Must be '1' or '2')
    if (SignatureVersion !== '1' && SignatureVersion !== '2') {
      return { status: 'FAILED', isValid: false, reason: 'UNSUPPORTED_SIGNATURE_VERSION' };
    }

    // Transport freshness check on SNS Timestamp
    const freshness = this.verifyTransportFreshness(Timestamp);
    if (!freshness.isValid) {
      return { status: 'FAILED', isValid: false, reason: freshness.reason, details: freshness.details };
    }

    // Fetch and validate signing certificate
    const certRes = await this._fetchAndValidateSnsCert(SigningCertURL);
    if (!certRes.isValid) {
      return { status: 'FAILED', isValid: false, reason: certRes.reason, details: certRes.details };
    }

    // Construct canonical signing string
    const canonicalString = this._buildAwsSnsCanonicalString(body);
    if (!canonicalString) {
      return { status: 'FAILED', isValid: false, reason: 'INVALID_SIGNATURE' };
    }

    // Cryptographic RSA-SHA256 signature verification
    let isSigValid = false;
    try {
      const verifier = crypto.createVerify('RSA-SHA256');
      verifier.update(Buffer.from(canonicalString, 'utf8'));
      isSigValid = verifier.verify(certRes.cert.publicKey, Signature, 'base64');
    } catch {
      isSigValid = false;
    }

    if (!isSigValid) {
      return { status: 'FAILED', isValid: false, reason: 'INVALID_SIGNATURE' };
    }

    // Handle SubscriptionConfirmation specifically
    if (Type === 'SubscriptionConfirmation') {
      if (connectorConfig.autoConfirm) {
        const fetchRes = await this._fetchSubscribeUrl(body.SubscribeURL);
        if (!fetchRes.isValid) {
          return { status: 'FAILED', isValid: false, reason: fetchRes.reason || 'INVALID_SUBSCRIPTION_CONFIRMATION' };
        }
        return {
          status: 'VERIFIED',
          isValid: true,
          authMode: 'SNS_SIGNATURE',
          provider: 'AWS',
          organizationId: connectorConfig.organizationId,
          isSubscriptionConfirmation: true,
          confirmed: true,
        };
      } else {
        // Manual staging mode (zero egress)
        return {
          status: 'VERIFIED',
          isValid: true,
          authMode: 'SNS_SIGNATURE',
          provider: 'AWS',
          organizationId: connectorConfig.organizationId,
          isSubscriptionConfirmation: true,
          confirmed: false,
          staged: true,
        };
      }
    }

    return {
      status: 'VERIFIED',
      isValid: true,
      authMode: 'SNS_SIGNATURE',
      provider: 'AWS',
      organizationId: connectorConfig.organizationId,
      transportTimestamp: freshness.transportTime,
    };
  }

  // ==========================================================================
  // GCP PUB/SUB VERIFICATION (CONNECTED OIDC & AIR-GAPPED)
  // ==========================================================================

  /**
   * Fetches and caches Google's public JWKS.
   */
  async _getGoogleJwks(customJwksUri = 'https://www.googleapis.com/oauth2/v3/certs') {
    const cached = this.jwksCache.get(customJwksUri);
    if (cached) return cached;

    return new Promise((resolve) => {
      let parsed;
      try {
        parsed = new URL(customJwksUri);
      } catch {
        return resolve(null);
      }

      const options = {
        hostname: parsed.hostname,
        port: 443,
        path: parsed.pathname + parsed.search,
        method: 'GET',
        agent: secureHttpsAgent,
        timeout: this.fetchTimeoutMs,
        headers: { Accept: 'application/json' },
      };

      const req = https.request(options, (res) => {
        if (res.statusCode !== 200) {
          res.resume();
          return resolve(null);
        }

        let data = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const jwks = JSON.parse(data);
            if (jwks && Array.isArray(jwks.keys)) {
              this.jwksCache.set(customJwksUri, jwks, 24 * 60 * 60 * 1000);
              resolve(jwks);
            } else {
              resolve(null);
            }
          } catch {
            resolve(null);
          }
        });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve(null);
      });
      req.on('error', () => resolve(null));
      req.end();
    });
  }

  /**
   * Verifies Google-signed OIDC JWT Bearer token.
   */
  async _verifyGcpOidcJwt(jwtToken, connectorConfig) {
    if (!jwtToken || typeof jwtToken !== 'string') {
      return { isValid: false, reason: 'MISSING_AUTHENTICATION' };
    }

    const parts = jwtToken.split('.');
    if (parts.length !== 3) {
      return { isValid: false, reason: 'INVALID_JWT' };
    }

    const [headerB64, payloadB64, sigB64] = parts;

    let header, payload;
    try {
      header = JSON.parse(Buffer.from(headerB64, 'base64url').toString('utf8'));
      payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    } catch {
      return { isValid: false, reason: 'INVALID_JWT' };
    }

    // Algorithm check (Must be RS256; reject 'none' or symmetric)
    if (header.alg !== 'RS256' || !header.kid || sigB64 === '') {
      return { isValid: false, reason: 'INVALID_JWT' };
    }

    // Issuer verification
    const allowedIssuers = ['https://accounts.google.com', 'accounts.google.com'];
    if (!allowedIssuers.includes(payload.iss)) {
      return { isValid: false, reason: 'INVALID_ISSUER', details: { issuer: payload.iss } };
    }

    // Audience verification
    if (connectorConfig.expectedAudience && payload.aud !== connectorConfig.expectedAudience) {
      return { isValid: false, reason: 'INVALID_AUDIENCE', details: { audience: payload.aud } };
    }

    // Expiration check
    const nowSec = Math.floor(Date.now() / 1000);
    if (!payload.exp || payload.exp < nowSec - 10) {
      // 10s clock tolerance
      return { isValid: false, reason: 'INVALID_JWT', details: { expired: true } };
    }

    // Signature verification via Google JWKS
    let jwks = null;
    if (connectorConfig._injectedJwks) {
      jwks = connectorConfig._injectedJwks;
    } else {
      jwks = await this._getGoogleJwks(connectorConfig.jwksUri);
    }

    if (!jwks || !Array.isArray(jwks.keys)) {
      return { isValid: false, reason: 'INVALID_SIGNATURE', details: { jwksUnavailable: true } };
    }

    const matchingJwk = jwks.keys.find((k) => k.kid === header.kid);
    if (!matchingJwk) {
      return { isValid: false, reason: 'INVALID_SIGNATURE', details: { keyNotFound: true } };
    }

    let isSigValid = false;
    try {
      const publicKey = crypto.createPublicKey({ key: matchingJwk, format: 'jwk' });
      const verifier = crypto.createVerify('RSA-SHA256');
      verifier.update(`${headerB64}.${payloadB64}`);
      isSigValid = verifier.verify(publicKey, sigB64, 'base64url');
    } catch {
      isSigValid = false;
    }

    if (!isSigValid) {
      return { isValid: false, reason: 'INVALID_SIGNATURE' };
    }

    return { isValid: true, payload };
  }

  /**
   * Verifies incoming GCP Pub/Sub push request envelope.
   */
  async verifyGcp(requestData, connectorConfig) {
    const { body, headers = {}, query = {} } = requestData;

    // 1. Prohibit query-string secrets
    if (this._checkQueryStringSecrets(query)) {
      return { status: 'FAILED', isValid: false, reason: 'QUERY_SECRET_PROHIBITED' };
    }

    // 2. Air-Gapped / Egress-Restricted Shared Secret Mode
    if (connectorConfig.authMode === 'SHARED_SECRET') {
      const tokenHeader = headers['x-cybershield-token'] || headers['X-CyberShield-Token'];
      if (!tokenHeader) {
        return { status: 'FAILED', isValid: false, reason: 'MISSING_AUTHENTICATION' };
      }

      const isValidSecret = this._constantTimeCompare(tokenHeader, connectorConfig.sharedSecret);
      if (!isValidSecret) {
        return { status: 'FAILED', isValid: false, reason: 'INVALID_SHARED_SECRET' };
      }

      // Check transport freshness if timestamp provided
      const tHeader = headers['x-cybershield-timestamp'] || headers['X-CyberShield-Timestamp'] || body?.message?.publishTime;
      if (tHeader) {
        const fresh = this.verifyTransportFreshness(tHeader);
        if (!fresh.isValid) {
          return { status: 'FAILED', isValid: false, reason: fresh.reason, details: fresh.details };
        }
      }

      return {
        status: 'SHARED_SECRET',
        isValid: true,
        authMode: 'SHARED_SECRET',
        provider: 'GCP',
        organizationId: connectorConfig.organizationId,
      };
    }

    // 3. Connected Mode (Google OIDC Bearer JWT)
    const authHeader = headers['authorization'] || headers['Authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { status: 'FAILED', isValid: false, reason: 'MISSING_AUTHENTICATION' };
    }

    const jwtToken = authHeader.slice(7).trim();
    const oidcResult = await this._verifyGcpOidcJwt(jwtToken, connectorConfig);
    if (!oidcResult.isValid) {
      return { status: 'FAILED', isValid: false, reason: oidcResult.reason, details: oidcResult.details };
    }

    // Check message publishTime freshness if present
    const publishTime = body?.message?.publishTime;
    if (publishTime) {
      const fresh = this.verifyTransportFreshness(publishTime);
      if (!fresh.isValid) {
        return { status: 'FAILED', isValid: false, reason: fresh.reason, details: fresh.details };
      }
    }

    return {
      status: 'VERIFIED',
      isValid: true,
      authMode: 'GCP_OIDC',
      provider: 'GCP',
      organizationId: connectorConfig.organizationId,
      serviceAccount: oidcResult.payload?.email || null,
    };
  }

  // ==========================================================================
  // AZURE EVENT GRID VERIFICATION (HEADER AUTH & HANDSHAKE)
  // ==========================================================================

  /**
   * Verifies incoming Azure Event Grid webhook delivery.
   */
  async verifyAzure(requestData, connectorConfig) {
    const { body, headers = {}, query = {} } = requestData;

    // 1. Prohibit query-string secrets
    if (this._checkQueryStringSecrets(query)) {
      return { status: 'FAILED', isValid: false, reason: 'QUERY_SECRET_PROHIBITED' };
    }

    // 2. Synchronous SubscriptionValidation Handshake
    const aegEventType = headers['aeg-event-type'] || headers['Aeg-Event-Type'];
    const isValidationHeader = aegEventType === 'SubscriptionValidation';
    const isValidationBody =
      Array.isArray(body) && body[0] && body[0].eventType === 'Microsoft.EventGrid.SubscriptionValidationEvent';

    if (isValidationHeader || isValidationBody) {
      const validationCode = body?.[0]?.data?.validationCode;
      if (!validationCode || typeof validationCode !== 'string' || validationCode.length > 256) {
        return { status: 'FAILED', isValid: false, reason: 'INVALID_SUBSCRIPTION_CONFIRMATION' };
      }

      return {
        status: 'VERIFIED',
        isValid: true,
        authMode: 'AZURE_VALIDATION',
        provider: 'AZURE',
        organizationId: connectorConfig.organizationId,
        isSubscriptionValidation: true,
        validationResponse: validationCode,
      };
    }

    // 3. Normal Event Delivery Header Authentication
    const sasToken = headers['aeg-sas-token'] || headers['x-cybershield-token'] || headers['X-CyberShield-Token'];
    if (!sasToken) {
      return { status: 'FAILED', isValid: false, reason: 'MISSING_AUTHENTICATION' };
    }

    const isValidSecret = this._constantTimeCompare(sasToken, connectorConfig.sharedSecret);
    if (!isValidSecret) {
      return { status: 'FAILED', isValid: false, reason: 'INVALID_SHARED_SECRET' };
    }

    // Transport freshness check
    const tHeader = headers['aeg-event-time'] || headers['x-cybershield-timestamp'] || (Array.isArray(body) && body[0]?.eventTime);
    if (tHeader) {
      const fresh = this.verifyTransportFreshness(tHeader);
      if (!fresh.isValid) {
        return { status: 'FAILED', isValid: false, reason: fresh.reason, details: fresh.details };
      }
    }

    return {
      status: 'VERIFIED',
      isValid: true,
      authMode: 'AZURE_HEADER',
      provider: 'AZURE',
      organizationId: connectorConfig.organizationId,
    };
  }

  // ==========================================================================
  // UNIFIED VERIFICATION DISPATCHER
  // ==========================================================================

  /**
   * Universal provider verification dispatcher.
   */
  async verify(requestData, connectorConfig) {
    if (!connectorConfig || !connectorConfig.provider) {
      return { status: 'FAILED', isValid: false, reason: 'INVALID_CONNECTOR_CONFIGURATION' };
    }

    // Tenant binding guard
    const binding = this.verifyTenantConnectorBinding(connectorConfig, requestData.meta || {});
    if (!binding.isValid) {
      return { status: 'FAILED', isValid: false, reason: binding.reason, details: binding.details };
    }

    const provider = connectorConfig.provider.toUpperCase();
    switch (provider) {
      case 'AWS':
        return await this.verifyAwsSns(requestData, connectorConfig);
      case 'GCP':
        return await this.verifyGcp(requestData, connectorConfig);
      case 'AZURE':
        return await this.verifyAzure(requestData, connectorConfig);
      default:
        return { status: 'FAILED', isValid: false, reason: 'INVALID_CONNECTOR_CONFIGURATION' };
    }
  }
}

module.exports = {
  CloudSignatureVerifier,
  BoundedLruCache,
};
