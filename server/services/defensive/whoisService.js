'use strict';

const { isValidDomain } = require('../../utils/validators');
const { isPrivateOrLoopback } = require('../../utils/ssrfValidator');
const csiComposition = require('../../composition/csiComposition');
const { NetworkExecutionContext } = require('../../csi/network/NetworkExecutionContext');
const cache = require('../../utils/cache');
const logger = require('../../utils/logger');

// 5-minute TTL for WHOIS/DNS results (value is in seconds for CacheService API)
const WHOIS_TTL_SECONDS = 5 * 60;

const parseWhoisFromResponse = (resData) => {
  if (!resData) return {};
  const isRdap = resData.protocol === 'rdap';
  
  let registrar = 'Unknown';
  let registered = 'Unknown';
  let expires = 'Unknown';
  let status = [];
  let nameservers = [];

  if (isRdap && resData.rdapJson) {
    const rdap = resData.rdapJson;
    registrar = rdap.handle || 'Unknown';
    status = rdap.status || [];
    const events = rdap.events || [];
    const regEvent = events.find(e => e.eventAction === 'registration');
    const expEvent = events.find(e => e.eventAction === 'expiration');
    if (regEvent) registered = new Date(regEvent.eventDate).toLocaleDateString();
    if (expEvent) expires = new Date(expEvent.eventDate).toLocaleDateString();
    nameservers = (rdap.nameservers || []).map(ns => ns.ldhName || ns.unicodeName).filter(Boolean);
  } else if (resData.rawText) {
    const text = resData.rawText;
    const regMatch = text.match(/creation date:\s*(.+)/i) || text.match(/created:\s*(.+)/i) || text.match(/registered:\s*(.+)/i);
    const expMatch = text.match(/registry expiry date:\s*(.+)/i) || text.match(/expiration date:\s*(.+)/i) || text.match(/expires:\s*(.+)/i);
    const registrarMatch = text.match(/registrar:\s*(.+)/i) || text.match(/sponsoring registrar:\s*(.+)/i);
    
    if (regMatch) registered = regMatch[1].trim();
    if (expMatch) expires = expMatch[1].trim();
    if (registrarMatch) registrar = registrarMatch[1].trim();

    const statusMatches = [...text.matchAll(/domain status:\s*(.+)/gi)];
    status = statusMatches.map(m => m[1].trim().split(' ')[0]);

    const nsMatches = [...text.matchAll(/name server:\s*(.+)/gi)] || [...text.matchAll(/nserver:\s*(.+)/gi)];
    nameservers = nsMatches.map(m => m[1].trim().toLowerCase());
  }

  return { registrar, registered, expires, status, nameservers };
};

const parseDnsFromResponse = (resData) => {
  if (!resData) return {};
  
  const a = (resData.A || []).map(r => typeof r === 'string' ? r : r.address || JSON.stringify(r));
  const mx = (resData.MX || []).map(r => typeof r === 'string' ? r : r.exchange ? `${r.priority} ${r.exchange}` : JSON.stringify(r));
  const ns = (resData.NS || []).map(r => typeof r === 'string' ? r : r.value || r.ns || JSON.stringify(r));
  const txt = (resData.TXT || []).map(r => typeof r === 'string' ? r : Array.isArray(r) ? r.join(' ') : r.value || JSON.stringify(r));

  return { a, mx, ns, txt };
};

class WhoisService {
  static async lookup(domain, execId) {
    if (!domain || typeof domain !== 'string') {
      throw new Error('domain field is required.');
    }

    const clean = domain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');

    // ── Cache check ─────────────────────────────────────────────────────────
    const cacheKey = `WHOIS:${clean}`;
    try {
      const cached = await cache.get(cacheKey);
      if (cached) {
        logger.info(`[WHOIS-CACHE] HIT for ${clean}`);
        return cached;
      }
      logger.info(`[WHOIS-CACHE] MISS for ${clean}`);
    } catch (cacheErr) {
      logger.warn(`[WHOIS-CACHE] Cache read error, proceeding without cache: ${cacheErr.message}`);
    }

    if (!isValidDomain(clean)) {
      throw new Error('Enter a valid domain name (e.g., example.com).');
    }
    if (await isPrivateOrLoopback(clean)) {
      throw new Error('Private or loopback targets are not permitted.');
    }

    const ctx = new NetworkExecutionContext({
      executionId: execId,
      targetId: clean,
      timeout: 10000,
      retryPolicy: { maxRetries: 0, backoffMs: 0 },
    });

    const timeoutPromise = new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          isTimeout: true,
          whoisParsed: { registrar: 'Timeout / Degraded', registered: 'Unknown', expires: 'Unknown', status: ['DEGRADED_TIMEOUT'], nameservers: [] },
          dnsParsed: { a: [], mx: [], ns: [], txt: [] }
        });
      }, 10000);
    });

    const executionPromise = (async () => {
      const [whoisResult, dnsResult] = await Promise.allSettled([
        (async () => {
          const { whoisEngine } = csiComposition;
          return await whoisEngine.collect({ normalized: clean, type: 'domain', metadata: { apexDomain: clean }, rawInput: clean }, ctx);
        })(),
        (async () => {
          const { dnsEngine } = csiComposition;
          return await dnsEngine.collect({ normalized: clean, type: 'domain', metadata: { apexDomain: clean }, rawInput: clean }, ctx);
        })(),
      ]);

      let whoisParsed = { registrar: 'Unknown', registered: 'Unknown', expires: 'Unknown', status: [], nameservers: [] };
      if (whoisResult.status === 'fulfilled' && whoisResult.value?.[0]?.data) {
        try {
          const rawText = whoisResult.value[0].data;
          const rawObj = typeof rawText === 'string' 
            ? JSON.parse(rawText) 
            : Buffer.isBuffer(rawText) 
              ? JSON.parse(rawText.toString('utf8')) 
              : rawText;
          whoisParsed = parseWhoisFromResponse(rawObj);
        } catch (err) {
          console.error('Failed to parse WHOIS raw data:', err);
        }
      }

      let dnsParsed = { a: [], mx: [], ns: [], txt: [] };
      if (dnsResult.status === 'fulfilled' && dnsResult.value?.[0]?.data) {
        try {
          const rawText = dnsResult.value[0].data;
          const rawObj = typeof rawText === 'string' 
            ? JSON.parse(rawText) 
            : Buffer.isBuffer(rawText) 
              ? JSON.parse(rawText.toString('utf8')) 
              : rawText;
          dnsParsed = parseDnsFromResponse(rawObj);
        } catch (err) {
          console.error('Failed to parse DNS raw data:', err);
        }
      }

      return { isTimeout: false, whoisParsed, dnsParsed };
    })();

    const result = await Promise.race([executionPromise, timeoutPromise]);

    const response = {
      domain: clean,
      status: result.isTimeout ? 'DEGRADED_TIMEOUT' : 'LIVE',
      isTimeout: result.isTimeout || false,
      whois: result.whoisParsed,
      dns: result.dnsParsed,
    };

    // ── Cache successful (non-degraded) results only ──────────────────────
    if (!result.isTimeout) {
      try {
        await cache.set(cacheKey, response, WHOIS_TTL_SECONDS);
        logger.info(`[WHOIS-CACHE] Cached result for ${clean} (TTL: ${WHOIS_TTL_SECONDS}s)`);
      } catch (cacheErr) {
        logger.warn(`[WHOIS-CACHE] Cache write error (non-fatal): ${cacheErr.message}`);
      }
    }

    return response;
  }
}

module.exports = WhoisService;
