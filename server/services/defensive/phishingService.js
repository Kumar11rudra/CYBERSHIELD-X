'use strict';

const net = require('net');
const { isValidURL } = require('../../utils/validators');
const { isPrivateOrLoopback } = require('../../utils/ssrfValidator');
const cache = require('../../utils/cache');
const logger = require('../../utils/logger');

// 5-minute TTL for phishing analysis (seconds)
const PHISHING_TTL_SECONDS = 5 * 60;

const SUSPICIOUS_TLDS = new Set(['.xyz', '.tk', '.cf', '.ml', '.ga', '.gq', '.pw', '.top', '.click', '.loan', '.work', '.download']);
const BRAND_KEYWORDS = ['paypal', 'paytm', 'googl', 'amazon', 'microsoft', 'apple', 'facebook', 'twitter', 'instagram',
  'netflx', 'netflix', 'sbi', 'hdfc', 'icici', 'axis', 'irctc', 'uidai', 'aadhar', 'epfo'];

class PhishingService {
  static async detectPhishing(url) {
    if (!url || typeof url !== 'string') {
      throw new Error('url field is required.');
    }
    if (url.length > 2048) {
      throw new Error('URL exceeds maximum allowed length.');
    }
    if (!isValidURL(url)) {
      throw new Error('Enter a valid URL starting with http:// or https://.');
    }

    let parsedUrl;
    try { parsedUrl = new URL(url); } catch {
      throw new Error('Malformed URL.');
    }

    const hostname = parsedUrl.hostname;

    // SSRF block
    if (await isPrivateOrLoopback(hostname)) {
      throw new Error('Private or loopback targets are not permitted.');
    }

    // ── Cache check (normalized lowercase URL as key) ──────────────────────
    const normalizedKey = url.toLowerCase().replace(/\/$/, '');
    const cacheKey = `PHISHING:${normalizedKey}`;
    try {
      const cached = await cache.get(cacheKey);
      if (cached) {
        logger.info(`[PHISHING-CACHE] HIT for ${hostname}`);
        return cached;
      }
      logger.info(`[PHISHING-CACHE] MISS for ${hostname}`);
    } catch (cacheErr) {
      logger.warn(`[PHISHING-CACHE] Cache read error, proceeding without cache: ${cacheErr.message}`);
    }

    const indicators = [];
    let score = 0;

    // Check 1: Suspicious TLD
    const tldMatch = SUSPICIOUS_TLDS.has(`.${hostname.split('.').pop()}`);
    if (tldMatch) { indicators.push('Suspicious top-level domain'); score += 20; }

    // Check 2: Brand keyword in subdomain (not in apex)
    const parts = hostname.split('.');
    const apexDomain = parts.slice(-2).join('.');
    const subdomainPart = parts.slice(0, -2).join('.').toLowerCase();
    const brandInSubdomain = BRAND_KEYWORDS.some(b => subdomainPart.includes(b));
    if (brandInSubdomain) { indicators.push('Brand keyword detected in subdomain — possible impersonation'); score += 30; }

    // Check 3: Brand keyword in domain but suspicious TLD
    const brandInApex = BRAND_KEYWORDS.some(b => apexDomain.includes(b));
    if (brandInApex && tldMatch) { indicators.push('Known brand in domain with suspicious TLD'); score += 20; }

    // Check 4: Excessive subdomain depth
    if (parts.length > 4) { indicators.push('Excessive subdomain depth (4+ levels)'); score += 15; }

    // Check 5: IP address as host
    if (net.isIP(hostname)) { indicators.push('IP address used as host instead of domain name'); score += 20; }

    // Check 6: Excessively long URL
    if (url.length > 100) { indicators.push(`Unusually long URL (${url.length} chars)`); score += 10; }

    // Check 7: Open redirect parameters in query string
    const suspiciousParams = ['url', 'redirect', 'next', 'return', 'goto', 'target', 'dest', 'uri', 'window', 'continue'];
    const urlParams = Array.from(parsedUrl.searchParams.keys()).map(k => k.toLowerCase());
    const redirectParamFound = urlParams.some(k => suspiciousParams.includes(k));
    if (redirectParamFound) { indicators.push('URL contains open-redirect parameter names'); score += 15; }

    // Check 8: No HTTPS
    if (parsedUrl.protocol !== 'https:') { indicators.push('URL does not use HTTPS'); score += 15; }

    score = Math.min(100, score);
    const riskLevel =
      score >= 70 ? 'dangerous' :
      score >= 40 ? 'medium' :
      score >= 15 ? 'warning' : 'safe';

    const result = {
      score,
      riskLevel,
      target: url,
      heuristics: indicators.length > 0 ? indicators : ['No suspicious heuristic indicators triggered.']
    };

    // ── Cache the result (heuristics are target-specific, not user-specific) ──
    try {
      await cache.set(cacheKey, result, PHISHING_TTL_SECONDS);
      logger.info(`[PHISHING-CACHE] Cached result for ${hostname} (TTL: ${PHISHING_TTL_SECONDS}s)`);
    } catch (cacheErr) {
      logger.warn(`[PHISHING-CACHE] Cache write error (non-fatal): ${cacheErr.message}`);
    }

    return result;
  }
}

module.exports = PhishingService;
