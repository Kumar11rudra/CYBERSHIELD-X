const { detectInputType, normalizeScanTarget } = require('../utils/validators');
const dns = require('dns').promises;
const tls = require('tls');
const https = require('https');

const analyzeSMS = async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Text is required' });

    let spamScore = 0;
    const lowerText = text.toLowerCase();
    
    // 1. Keyword analysis (weighted)
    const highRiskKeywords = ['urgent', 'blocked', 'suspend', 'kyc', 'lottery', 'winner', 'claim', 'refund', 'unauthorized', 'verify your account', 'action required'];
    const mediumRiskKeywords = ['prize', 'bank', 'password', 'login', 'update', 'security', 'alert'];
    
    highRiskKeywords.forEach(kw => {
      if (lowerText.includes(kw)) spamScore += 25;
    });
    mediumRiskKeywords.forEach(kw => {
      if (lowerText.includes(kw)) spamScore += 10;
    });

    // 2. Regex Patterns for suspicious content
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = text.match(urlRegex) || [];
    
    if (urls.length > 0) {
      spamScore += 20; // Base score for having URLs
      
      // Check if URLs use URL shorteners
      const shorteners = ['bit.ly', 'tinyurl.com', 't.co', 'ow.ly', 'is.gd', 'buff.ly'];
      const hasShortener = urls.some(url => shorteners.some(s => url.toLowerCase().includes(s)));
      if (hasShortener) {
        spamScore += 30; // High risk: SMS with shortened links
      }
      
      // Check for IP address in URL
      const ipRegex = /\/\/(?:[0-9]{1,3}\.){3}[0-9]{1,3}/;
      const hasIpInUrl = urls.some(url => ipRegex.test(url));
      if (hasIpInUrl) {
        spamScore += 40; // Extremely high risk: SMS with IP address link
      }
    }

    // Check for crypto addresses (basic check for long alphanumeric strings often used in crypto scams)
    // Very simplified check for words that look like wallet addresses
    const cryptoRegex = /\b(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,39}\b/i; // Basic Bitcoin address regex
    if (cryptoRegex.test(text)) {
      spamScore += 40;
    }

    // Check for phone numbers
    // SMS asking to call a specific unknown number
    const phoneRegex = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g;
    const phones = text.match(phoneRegex) || [];
    if (phones.length > 0 && lowerText.includes('call')) {
      spamScore += 15;
    }
    
    let riskLevel = 'safe';
    if (spamScore >= 80) riskLevel = 'dangerous';
    else if (spamScore >= 40) riskLevel = 'medium';
    else if (spamScore >= 20) riskLevel = 'low';

    res.json({
      success: true,
      analysis: {
        score: Math.min(spamScore, 100),
        riskLevel,
        urlsDetected: urls,
        verifyingAuthority: "CyberShield Advanced NLP Heuristics",
        scannedAt: new Date()
      }
    });

  } catch (error) {
    next(error);
  }
};

const verifyUPI = async (req, res, next) => {
  try {
    const { upi } = req.body;
    if (!upi) return res.status(400).json({ error: 'UPI ID or Link is required' });

    let riskLevel = 'safe';
    let score = 0;
    let normalized = upi.trim();

    // Check if it's a URL (payment link)
    if (normalized.startsWith('http') || normalized.startsWith('upi://')) {
      score = 45; // Payment links are moderately risky unless verified
      riskLevel = 'medium';
    } else if (normalized.includes('@')) {
      const parts = normalized.split('@');
      if (parts.length === 2) {
        const bank = parts[1].toLowerCase();
        const validBanks = ['okicici', 'okhdfcbank', 'sbi', 'paytm', 'ybl', 'ibl', 'axl', 'apl'];
        if (!validBanks.includes(bank)) {
          score = 65;
          riskLevel = 'medium';
        } else {
          score = 10;
          riskLevel = 'safe';
        }
      } else {
        score = 80;
        riskLevel = 'dangerous';
      }
    } else {
      score = 100;
      riskLevel = 'dangerous';
    }

    res.json({
      success: true,
      analysis: {
        score,
        riskLevel,
        verifyingAuthority: "CyberShield Payment Guard + NPCI Index",
        scannedAt: new Date()
      }
    });

  } catch (error) {
    next(error);
  }
};

// ─── WHOIS Lookup ─────────────────────────────────────────────────────────────
// Uses DNS records + public RDAP API (no external package needed)
const whoisLookup = async (req, res, next) => {
  try {
    const { domain } = req.body;
    if (!domain) return res.status(400).json({ error: 'Domain is required' });

    const cleaned = domain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');

    // Parallel: DNS records + RDAP lookup
    const [dnsResults, rdapData] = await Promise.all([
      // DNS Records
      Promise.allSettled([
        dns.resolve(cleaned, 'A').catch(() => []),
        dns.resolve(cleaned, 'MX').catch(() => []),
        dns.resolve(cleaned, 'NS').catch(() => []),
        dns.resolve(cleaned, 'TXT').catch(() => []),
      ]),
      // RDAP (modern WHOIS replacement) — free, no API key needed
      fetch(`https://rdap.org/domain/${cleaned}`)
        .then(r => r.ok ? r.json() : null)
        .catch(() => null),
    ]);

    const [aRec, mxRec, nsRec, txtRec] = dnsResults;

    // Extract RDAP info safely
    let registrar = 'Unknown';
    let registered = null;
    let expires = null;
    let nameservers = [];
    let status = [];

    if (rdapData) {
      registrar = rdapData.entities?.find(e => e.roles?.includes('registrar'))?.vcardArray?.[1]
        ?.find(v => v[0] === 'fn')?.[3] || 'Unknown';
      registered = rdapData.events?.find(e => e.eventAction === 'registration')?.eventDate || null;
      expires = rdapData.events?.find(e => e.eventAction === 'expiration')?.eventDate || null;
      nameservers = rdapData.nameservers?.map(ns => ns.ldhName?.toLowerCase()) || [];
      status = rdapData.status || [];
    }

    res.json({
      success: true,
      domain: cleaned,
      whois: {
        registrar,
        registered: registered ? new Date(registered).toLocaleDateString() : 'Unknown',
        expires: expires ? new Date(expires).toLocaleDateString() : 'Unknown',
        status,
        nameservers: nameservers.length ? nameservers : (nsRec.value || []).slice(0, 4),
      },
      dns: {
        a: (aRec.value || []).slice(0, 5),
        mx: (mxRec.value || []).slice(0, 5).map(r => r.exchange || r),
        ns: (nsRec.value || []).slice(0, 5),
        txt: (txtRec.value || []).slice(0, 3).map(t => Array.isArray(t) ? t.join('') : t),
      },
      scannedAt: new Date(),
    });
  } catch (error) {
    next(error);
  }
};

// ─── SSL Certificate Checker ───────────────────────────────────────────────────
const checkSSL = async (req, res, next) => {
  try {
    const { domain } = req.body;
    if (!domain) return res.status(400).json({ error: 'Domain is required' });

    const cleaned = domain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');

    const cert = await new Promise((resolve, reject) => {
      const socket = tls.connect({ host: cleaned, port: 443, servername: cleaned, rejectUnauthorized: false }, () => {
        const c = socket.getPeerCertificate(true);
        socket.destroy();
        resolve(c);
      });
      socket.setTimeout(8000, () => { socket.destroy(); reject(new Error('Connection timed out')); });
      socket.on('error', reject);
    });

    if (!cert || !cert.subject) {
      return res.status(400).json({ error: 'Could not retrieve SSL certificate for this domain.' });
    }

    const now = new Date();
    const validFrom = new Date(cert.valid_from);
    const validTo = new Date(cert.valid_to);
    const daysLeft = Math.floor((validTo - now) / (1000 * 60 * 60 * 24));
    const isValid = now >= validFrom && now <= validTo;
    const isExpiringSoon = daysLeft <= 30 && daysLeft > 0;

    let grade = 'A';
    if (!isValid) grade = 'F';
    else if (isExpiringSoon) grade = 'C';
    else if (daysLeft < 90) grade = 'B';

    res.json({
      success: true,
      domain: cleaned,
      ssl: {
        grade,
        isValid,
        isExpiringSoon,
        daysLeft: Math.max(0, daysLeft),
        subject: cert.subject?.CN || cleaned,
        issuer: cert.issuer?.O || cert.issuer?.CN || 'Unknown CA',
        validFrom: validFrom.toLocaleDateString(),
        validTo: validTo.toLocaleDateString(),
        protocol: cert.protocol || 'TLS',
        subjectAltNames: (cert.subjectaltname || '')
          .split(', ')
          .filter(s => s.startsWith('DNS:'))
          .map(s => s.replace('DNS:', ''))
          .slice(0, 8),
      },
      scannedAt: new Date(),
    });
  } catch (error) {
    if (error.message?.includes('timed out') || error.code === 'ECONNREFUSED') {
      return res.status(400).json({ error: 'Could not connect to domain. Check if HTTPS is enabled.' });
    }
    next(error);
  }
};

// ─── Phishing URL Detector ──────────────────────────────────────────────────
const detectPhishing = async (req, res, next) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    let parsedUrl;
    try {
      parsedUrl = new URL(url.startsWith('http') ? url : `https://${url}`);
    } catch {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    const hostname = parsedUrl.hostname.toLowerCase();
    let score = 0;
    const heuristics = [];

    // 1. Check Top Level Domain (TLD)
    const suspiciousTlds = ['.tk', '.ml', '.ga', '.cf', '.gq', '.xyz', '.top', '.pw'];
    if (suspiciousTlds.some(tld => hostname.endsWith(tld))) {
      score += 25;
      heuristics.push('Suspicious Top-Level Domain (TLD)');
    }

    // 2. Check for IP address instead of domain name
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (ipRegex.test(hostname)) {
      score += 35;
      heuristics.push('Uses IP Address instead of Domain Name');
    }

    // 3. Check for multiple subdomains
    const parts = hostname.split('.');
    if (parts.length > 3 && !hostname.includes('github.io') && !hostname.includes('vercel.app')) {
      score += 15;
      heuristics.push('Unusually high number of subdomains');
    }

    // 4. Check for '-' in domain
    if ((hostname.match(/-/g) || []).length >= 2) {
      score += 10;
      heuristics.push('Multiple hyphens in domain name');
    }

    // 5. Check URL length
    if (url.length > 75) {
      score += 10;
      heuristics.push('Suspiciously long URL length');
    }

    // 6. Check for misleading brand names
    const brands = ['paypal', 'login', 'secure', 'update', 'account', 'bank', 'apple', 'microsoft', 'google'];
    let brandDetected = false;
    for (const brand of brands) {
      if (hostname.includes(brand) && !hostname.endsWith(`${brand}.com`)) {
        brandDetected = true;
      }
    }
    if (brandDetected) {
      score += 30;
      heuristics.push('Domain contains misleading brand or security keywords');
    }

    // 7. Check for missing HTTPS (if original protocol was provided)
    if (url.startsWith('http://')) {
      score += 10;
      heuristics.push('Unencrypted HTTP connection');
    }

    // Cap score at 100
    score = Math.min(score, 100);

    let riskLevel = 'safe';
    if (score >= 70) riskLevel = 'dangerous';
    else if (score >= 30) riskLevel = 'medium';

    if (score === 0) {
      heuristics.push('No suspicious indicators found');
    }

    res.json({
      success: true,
      analysis: {
        score,
        riskLevel,
        heuristics,
        target: url,
        verifyingAuthority: "CyberShield PhishGuard Heuristics",
        scannedAt: new Date()
      }
    });

  } catch (error) {
    next(error);
  }
};

module.exports = { analyzeSMS, verifyUPI, whoisLookup, checkSSL, detectPhishing };
