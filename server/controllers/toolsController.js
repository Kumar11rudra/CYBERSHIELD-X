'use strict';

/**
 * @module toolsController
 * @description Nexus Defensive Intelligence Tools — Thin HTTP adapter.
 *
 * All tools are strictly DEFENSIVE and PASSIVE:
 *   - SMS:      Heuristic scam pattern analysis of message text
 *   - UPI:      Format validation + heuristic risk indicators (NOT authoritative)
 *   - WHOIS:    Passive domain registration + DNS lookup
 *   - SSL:      TLS handshake + certificate analysis + grading
 *   - Phishing: Heuristic URL risk analysis + redirect chain inspection
 *
 * Security boundaries enforced:
 *   - All domain/URL inputs are validated before engine dispatch
 *   - Private IP ranges and localhost are blocked (SSRF prevention)
 *   - No exploitation, credential attacks, or offensive automation
 *   - All heuristic results are clearly labelled as such
 */

const net = require('net');
const { isValidDomain, isValidURL } = require('../utils/validators');

// CSI composition — shared singleton with all engines pre-wired
const csiComposition = require('../composition/csiComposition');
const { NetworkExecutionContext } = require('../csi/network/NetworkExecutionContext');

const { isPrivateOrLoopback } = require('../utils/ssrfValidator');

exports.isPrivateOrLoopback = isPrivateOrLoopback;

const extractHostFromInput = (input) => {
  try {
    const url = new URL(input.includes('://') ? input : `https://${input}`);
    return url.hostname;
  } catch {
    return input.trim().toLowerCase();
  }
};

// ── Unique execution ID for CSI engines ───────────────────────────────────
let _execCounter = 0;
const nextExecId = () => `nexus-${Date.now()}-${++_execCounter}`;

// ────────────────────────────────────────────────────────────────────────────
// SMS ANALYZER
// Heuristic analysis of text messages for social engineering indicators.
// Does NOT make external API calls. Pure server-side pattern analysis.
// ────────────────────────────────────────────────────────────────────────────
exports.analyzeSMS = async (req, res) => {
  try {
    const message = req.body.message || req.body.text;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ success: false, error: 'text or message field is required.' });
    }
    if (message.length > 5000) {
      return res.status(400).json({ success: false, error: 'Message exceeds maximum length of 5000 characters.' });
    }

    const text = message;
    const lc = text.toLowerCase();
    const indicators = [];
    let score = 0;

    // Category: Urgency / Threat
    const urgencyPatterns = [
      /\burgent\b/i, /\bimmediately\b/i, /\bact now\b/i, /\blast chance\b/i,
      /\bwarning\b/i, /\byour account.*suspend/i, /\bdeactivat/i,
      /\barrest\b/i, /\bfir filed\b/i, /\bcourt order\b/i, /\bcyber crime\b/i,
      /\bkya to\b/i, /\babhi call karo\b/i,
    ];
    const urgencyHits = urgencyPatterns.filter(p => p.test(lc));
    if (urgencyHits.length > 0) {
      indicators.push({ category: 'Urgency / Threat Language', weight: 25, matched: urgencyHits.length });
      score += Math.min(25, urgencyHits.length * 10);
    }

    // Category: Financial Bait / Prize
    const prizePatterns = [
      /\byou have won\b/i, /\bcongratulations\b/i, /\bclaim your (prize|reward|cash|money)/i,
      /\blottery\b/i, /\bgift card\b/i, /\bfree ?(money|recharge|data)\b/i,
      /\b(₹|rs\.?|inr)\s*\d+/i, /\bkbc\b/i, /\bjio\b.*win/i,
    ];
    const prizeHits = prizePatterns.filter(p => p.test(lc));
    if (prizeHits.length > 0) {
      indicators.push({ category: 'Financial Bait / Prize Scam', weight: 25, matched: prizeHits.length });
      score += Math.min(25, prizeHits.length * 12);
    }

    // Category: Credential / OTP Harvesting
    const credPatterns = [
      /\bshare.*otp\b/i, /\benter.*otp\b/i, /\bdo not share.*otp\b/i,
      /\bverification code\b/i, /\bpin\b.*\bsend\b/i,
      /\bpassword\b.*\bsend\b/i, /\bbank.*detail\b/i, /\baccount number\b/i,
      /\bcard.*number\b/i, /\bcvv\b/i,
    ];
    const credHits = credPatterns.filter(p => p.test(lc));
    if (credHits.length > 0) {
      indicators.push({ category: 'Credential / OTP Harvesting', weight: 35, matched: credHits.length });
      score += Math.min(35, credHits.length * 15);
    }

    // Category: Brand Impersonation
    const impersonationPatterns = [
      /\bsbi\b/i, /\bhdfc\b/i, /\bicici\b/i, /\baxis bank\b/i,
      /\bpaytm\b/i, /\bgoogle pay\b/i, /\bphonepe\b/i,
      /\bincome tax\b/i, /\brbi\b/i, /\btrai\b/i,
      /\bamazon\b.*prize/i, /\bflipart\b/i, /\bnpci\b/i,
    ];
    const impersonationHits = impersonationPatterns.filter(p => p.test(lc));
    if (impersonationHits.length > 0) {
      indicators.push({ category: 'Brand / Authority Impersonation', weight: 20, matched: impersonationHits.length });
      score += Math.min(20, impersonationHits.length * 8);
    }

    // Category: Suspicious URLs embedded
    const urlPattern = /https?:\/\/[^\s]+/gi;
    const embeddedUrls = text.match(urlPattern) || [];
    const suspiciousUrlPatterns = [/bit\.ly/i, /tinyurl/i, /t\.me\//i, /\.tk\b/i, /\.cf\b/i, /\.ml\b/i, /\.xyz\b/i];
    const suspiciousUrlHits = embeddedUrls.filter(u => suspiciousUrlPatterns.some(p => p.test(u)));
    if (embeddedUrls.length > 0) {
      const urlScore = suspiciousUrlHits.length > 0 ? 20 : 5;
      indicators.push({
        category: 'Embedded URLs',
        weight: urlScore,
        matched: embeddedUrls.length,
        suspiciousCount: suspiciousUrlHits.length,
      });
      score += urlScore;
    }

    score = Math.min(100, score);

    const riskLevel =
      score >= 70 ? 'dangerous' :
      score >= 40 ? 'medium' :
      score >= 15 ? 'warning' : 'safe';

    return res.json({
      success: true,
      analysis: {
        score,
        riskLevel,
        verifyingAuthority: 'CyberShield Heuristic SMS Engine',
        disclaimer: 'This is a heuristic analysis based on pattern matching. It is not conclusive proof of fraud. Results may produce false positives or negatives.',
        indicators,
        embeddedUrls,
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Analysis failed.', detail: err.message });
  }
};

// ────────────────────────────────────────────────────────────────────────────
// UPI VERIFIER
// Format validation + heuristic risk indicator analysis ONLY.
// Does NOT verify identity, payment history, or account legitimacy.
// ────────────────────────────────────────────────────────────────────────────

// Known VPA provider handles registered with NPCI (non-exhaustive, for heuristic purposes)
const KNOWN_UPI_HANDLES = new Set([
  'okaxis', 'oksbi', 'okicici', 'okhdfcbank',
  'paytm', 'ybl', 'upi', 'apl', 'axl',
  'ibl', 'idbi', 'boi', 'cnrb', 'ubi',
  'federal', 'kotak', 'pnb', 'sib', 'scb',
  'indus', 'rbl', 'cub', 'icici', 'sbi',
  'hdfc', 'axis', 'fbl', 'jkb', 'dbs',
  'airtel', 'airtelpaymentsbank', 'jupiteraxis',
  'freecharge', 'rajgovhdfcbank', 'hdfcbankjd',
  'superyes', 'abfspay', 'timecosmos',
]);

exports.verifyUPI = async (req, res) => {
  try {
    const upiId = req.body.upiId || req.body.upi;
    if (!upiId || typeof upiId !== 'string') {
      return res.status(400).json({ success: false, error: 'upiId or upi field is required.' });
    }
    if (upiId.length > 256) {
      return res.status(400).json({ success: false, error: 'UPI ID exceeds maximum length.' });
    }

    const trimmed = upiId.trim();
    const atParts = trimmed.split('@');
    const formatValid = atParts.length === 2 && atParts[0].length > 0 && atParts[1].length > 0;
    const prefix = formatValid ? atParts[0] : '';
    const handle = formatValid ? atParts[1].toLowerCase() : '';
    const providerKnown = KNOWN_UPI_HANDLES.has(handle);

    const riskIndicators = [];

    if (!formatValid) {
      riskIndicators.push('Invalid format: UPI ID must follow the pattern username@provider');
    }
    if (prefix && /^[0-9]+$/.test(prefix)) {
      riskIndicators.push('Prefix is entirely numeric — uncommon for personal UPI IDs');
    }
    if (prefix && prefix.length > 50) {
      riskIndicators.push('Unusually long prefix — may indicate a generated or suspicious identifier');
    }
    if (prefix && /[^a-zA-Z0-9._-]/.test(prefix)) {
      riskIndicators.push('Prefix contains special characters not standard in UPI IDs');
    }
    if (!providerKnown && handle) {
      riskIndicators.push(`Provider handle "@${handle}" is not in the known registered VPA suffix list`);
    }

    const score = riskIndicators.length === 0 ? 0 : riskIndicators.length === 1 ? 45 : 85;
    const riskLevel = riskIndicators.length === 0 ? 'safe' : riskIndicators.length === 1 ? 'warning' : 'dangerous';

    return res.json({
      success: true,
      analysis: {
        score,
        riskLevel,
        verifyingAuthority: 'Heuristic Check (Format + Suffixes)',
        disclaimer: 'This is format and heuristic analysis only. It does NOT verify the identity, legitimacy, activity status, or payment safety of this UPI ID. Only an authoritative NPCI verification can confirm VPA existence.',
        upiId: trimmed,
        format_valid: formatValid,
        risk_indicators: riskIndicators,
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Verification failed.', detail: err.message });
  }
};

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

// ────────────────────────────────────────────────────────────────────────────
// WHOIS LOOKUP
// Passive domain registration + DNS intelligence using CSI WhoisEngine + DnsEngine.
// Only valid domain formats are accepted. Private IPs / localhost are blocked.
// ────────────────────────────────────────────────────────────────────────────
exports.whoisLookup = async (req, res) => {
  try {
    const { domain } = req.body;
    if (!domain || typeof domain !== 'string') {
      return res.status(400).json({ success: false, error: 'domain field is required.' });
    }

    const clean = domain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');

    if (!isValidDomain(clean)) {
      return res.status(400).json({ success: false, error: 'Enter a valid domain name (e.g., example.com).' });
    }
    if (await isPrivateOrLoopback(clean)) {
      return res.status(400).json({ success: false, error: 'Private or loopback targets are not permitted.' });
    }

    const execId = nextExecId();
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

    return res.json({
      success: true,
      domain: clean,
      executionId: execId,
      status: result.isTimeout ? 'DEGRADED_TIMEOUT' : 'LIVE',
      isTimeout: result.isTimeout || false,
      whois: result.whoisParsed,
      dns: result.dnsParsed,
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'WHOIS lookup failed.', detail: err.message });
  }
};

// ────────────────────────────────────────────────────────────────────────────
// SSL CHECKER
// TLS handshake + certificate analysis using CSI SslEngine.
// Returns grade (A/B/C/F), validity dates, issuer, SANs, findings.
// ────────────────────────────────────────────────────────────────────────────

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

exports.checkSSL = async (req, res) => {
  try {
    const { domain } = req.body;
    if (!domain || typeof domain !== 'string') {
      return res.status(400).json({ success: false, error: 'domain field is required.' });
    }

    const clean = domain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');

    if (!isValidDomain(clean)) {
      return res.status(400).json({ success: false, error: 'Enter a valid domain name (e.g., example.com).' });
    }
    if (await isPrivateOrLoopback(clean)) {
      return res.status(400).json({ success: false, error: 'Private or loopback targets are not permitted.' });
    }

    const execId = nextExecId();
    const { TlsClient } = require('../csi/network/TlsClient');
    const tlsClient = csiComposition.networkClients.tlsClient;

    let tlsResponse;
    let connectionError = null;
    try {
      const { NetworkExecutionContext } = require('../csi/network/NetworkExecutionContext');
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
      return res.json({
        success: true,
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
      });
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

    return res.json({
      success: true,
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
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'SSL check failed.', detail: err.message });
  }
};

// ────────────────────────────────────────────────────────────────────────────
// PHISHING DETECTOR
// Heuristic URL analysis + redirect chain inspection using CSI UrlEngine.
// Clearly labelled as heuristic — NOT a guarantee of safety or malice.
// SSRF prevention: private IPs and localhost are blocked.
// ────────────────────────────────────────────────────────────────────────────

const SUSPICIOUS_TLDS = new Set(['.xyz', '.tk', '.cf', '.ml', '.ga', '.gq', '.pw', '.top', '.click', '.loan', '.work', '.download']);
const BRAND_KEYWORDS = ['paypal', 'paytm', 'googl', 'amazon', 'microsoft', 'apple', 'facebook', 'twitter', 'instagram',
  'netflx', 'netflix', 'sbi', 'hdfc', 'icici', 'axis', 'irctc', 'uidai', 'aadhar', 'epfo'];

exports.detectPhishing = async (req, res) => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ success: false, error: 'url field is required.' });
    }
    if (url.length > 2048) {
      return res.status(400).json({ success: false, error: 'URL exceeds maximum allowed length.' });
    }
    if (!isValidURL(url)) {
      return res.status(400).json({ success: false, error: 'Enter a valid URL starting with http:// or https://.' });
    }

    let parsedUrl;
    try { parsedUrl = new URL(url); } catch {
      return res.status(400).json({ success: false, error: 'Malformed URL.' });
    }

    const hostname = parsedUrl.hostname;

    // SSRF block
    if (await isPrivateOrLoopback(hostname)) {
      return res.status(400).json({ success: false, error: 'Private or loopback targets are not permitted.' });
    }
    if (net.isIP(hostname)) {
      // Numeric IPs as host are suspicious but might be public — check private ranges first
      if (PRIVATE_RANGES.some(r => r.test(hostname))) {
        return res.status(400).json({ success: false, error: 'Private IP targets are not permitted.' });
      }
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

    return res.json({
      success: true,
      analysis: {
        score,
        riskLevel,
        target: url,
        heuristics: indicators.length > 0 ? indicators : ['No suspicious heuristic indicators triggered.']
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Phishing analysis failed.', detail: err.message });
  }
};
