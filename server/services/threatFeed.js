const axios = require('axios');

const CISA_KEV_FEED_URL = 'https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json';
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

let cache = {
  fetchedAt: 0,
  isLive: false,
  items: [],
  ticker: [],
  source: 'CISA Known Exploited Vulnerabilities Catalog',
  sourceUrl: 'https://www.cisa.gov/known-exploited-vulnerabilities-catalog',
};

const FALLBACK_ADVISORIES = [
  {
    id: 'CVE-2024-21887',
    title: 'Ivanti Connect Secure and Policy Secure Command Injection Vulnerability',
    cveID: 'CVE-2024-21887',
    vendor: 'Ivanti',
    product: 'Connect Secure',
    advisoryType: 'Active KEV Exploit',
    publishedAt: '2024-01-12',
    dateAdded: '2024-01-12',
    link: 'https://nvd.nist.gov/vuln/detail/CVE-2024-21887',
    source: 'CISA Known Exploited Vulnerabilities Catalog (Cached)',
    tone: 'dangerous',
    severity: 'Critical',
    ransomware: true,
    tickerText: '⚠ CISA KEV: Critical RCE in Ivanti Connect Secure (CVE-2024-21887)',
  },
  {
    id: 'CVE-2024-1709',
    title: 'ConnectWise ScreenConnect Authentication Bypass Vulnerability',
    cveID: 'CVE-2024-1709',
    vendor: 'ConnectWise',
    product: 'ScreenConnect',
    advisoryType: 'Active KEV Exploit',
    publishedAt: '2024-02-21',
    dateAdded: '2024-02-21',
    link: 'https://nvd.nist.gov/vuln/detail/CVE-2024-1709',
    source: 'CISA Known Exploited Vulnerabilities Catalog (Cached)',
    tone: 'dangerous',
    severity: 'Critical',
    ransomware: false,
    tickerText: '🔴 ALERT: ConnectWise ScreenConnect Auth Bypass (CVE-2024-1709)',
  },
  {
    id: 'CVE-2024-3400',
    title: 'Palo Alto Networks PAN-OS Command Injection Vulnerability',
    cveID: 'CVE-2024-3400',
    vendor: 'Palo Alto Networks',
    product: 'PAN-OS',
    advisoryType: 'Ransomware Exploited',
    publishedAt: '2024-04-12',
    dateAdded: '2024-04-12',
    link: 'https://nvd.nist.gov/vuln/detail/CVE-2024-3400',
    source: 'CISA Known Exploited Vulnerabilities Catalog (Cached)',
    tone: 'dangerous',
    severity: 'Critical',
    ransomware: true,
    tickerText: '⚡ CISA KEV: Palo Alto PAN-OS Command Injection (CVE-2024-3400)',
  },
  {
    id: 'CVE-2023-34362',
    title: 'Progress MOVEit Transfer SQL Injection Vulnerability',
    cveID: 'CVE-2023-34362',
    vendor: 'Progress',
    product: 'MOVEit Transfer',
    advisoryType: 'Ransomware Exploited',
    publishedAt: '2023-06-02',
    dateAdded: '2023-06-02',
    link: 'https://nvd.nist.gov/vuln/detail/CVE-2023-34362',
    source: 'CISA Known Exploited Vulnerabilities Catalog (Cached)',
    tone: 'dangerous',
    severity: 'Critical',
    ransomware: true,
    tickerText: '🛡 CISA KEV (Ransomware): Progress MOVEit SQLi (CVE-2023-34362)',
  },
  {
    id: 'CVE-2024-27198',
    title: 'JetBrains TeamCity Authentication Bypass Vulnerability',
    cveID: 'CVE-2024-27198',
    vendor: 'JetBrains',
    product: 'TeamCity',
    advisoryType: 'Active KEV Exploit',
    publishedAt: '2024-03-04',
    dateAdded: '2024-03-04',
    link: 'https://nvd.nist.gov/vuln/detail/CVE-2024-27198',
    source: 'CISA Known Exploited Vulnerabilities Catalog (Cached)',
    tone: 'review',
    severity: 'High',
    ransomware: false,
    tickerText: '⚠ CISA KEV: JetBrains TeamCity Auth Bypass (CVE-2024-27198)',
  },
  {
    id: 'CVE-2024-4577',
    title: 'PHP CGI Argument Injection Vulnerability',
    cveID: 'CVE-2024-4577',
    vendor: 'PHP Group',
    product: 'PHP',
    advisoryType: 'Active KEV Exploit',
    publishedAt: '2024-06-10',
    dateAdded: '2024-06-10',
    link: 'https://nvd.nist.gov/vuln/detail/CVE-2024-4577',
    source: 'CISA Known Exploited Vulnerabilities Catalog (Cached)',
    tone: 'review',
    severity: 'High',
    ransomware: false,
    tickerText: '🔴 CISA KEV: PHP CGI Remote Code Execution (CVE-2024-4577)',
  },
];

const FALLBACK_TICKER = FALLBACK_ADVISORIES.map((item) => item.tickerText);

/**
 * Normalizes a single vulnerability object from CISA KEV JSON.
 */
const normalizeKevItem = (v) => {
  if (!v || typeof v !== 'object') return null;

  const cveID = String(v.cveID || '').trim().replace(/<[^>]+>/g, '');
  const vendor = String(v.vendorProject || '').trim().replace(/<[^>]+>/g, '');
  const product = String(v.product || '').trim().replace(/<[^>]+>/g, '');
  const rawName = String(v.vulnerabilityName || `${vendor} ${product}`).trim().replace(/<[^>]+>/g, '');
  const cleanName = rawName.replace(/\s*Vulnerability\s*$/i, '').trim();
  const nameExcerpt = cleanName.length > 55 ? `${cleanName.slice(0, 52)}...` : cleanName;

  const isRansomware = v.knownRansomwareCampaignUse === 'Known';
  const icon = isRansomware ? '🔴' : '⚠';
  const prefix = isRansomware ? 'CISA KEV (Ransomware):' : 'CISA KEV:';
  const tickerText = `${icon} ${prefix} ${nameExcerpt} (${cveID})`;

  return {
    id: cveID || `kev-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: `${vendor} ${product}: ${cleanName}`,
    cveID,
    vendor,
    product,
    shortDescription: String(v.shortDescription || '').replace(/<[^>]+>/g, '').slice(0, 300),
    dateAdded: v.dateAdded || new Date().toISOString().split('T')[0],
    publishedAt: v.dateAdded || new Date().toISOString().split('T')[0],
    ransomware: isRansomware,
    tone: isRansomware ? 'dangerous' : 'review',
    severity: isRansomware ? 'Critical' : 'High',
    advisoryType: isRansomware ? 'Ransomware Campaign' : 'Active KEV Exploit',
    link: cveID ? `https://nvd.nist.gov/vuln/detail/${encodeURIComponent(cveID)}` : 'https://www.cisa.gov/known-exploited-vulnerabilities-catalog',
    source: 'CISA Known Exploited Vulnerabilities Catalog',
    tickerText,
  };
};

/**
 * Parses and validates the raw JSON payload from CISA KEV catalog.
 */
const parseKevCatalog = (data, limit = 10) => {
  if (!data || !Array.isArray(data.vulnerabilities) || data.vulnerabilities.length === 0) {
    throw new Error('Malformed or empty CISA KEV vulnerabilities array.');
  }

  const normalized = [];
  for (const v of data.vulnerabilities) {
    if (normalized.length >= limit) break;
    const item = normalizeKevItem(v);
    if (item && item.cveID) {
      normalized.push(item);
    }
  }

  if (normalized.length === 0) {
    throw new Error('Zero valid vulnerabilities could be extracted from CISA KEV catalog.');
  }

  return normalized;
};

/**
 * Retrieves the threat feed with in-memory caching and fail-safe fallback.
 */
const getThreatFeed = async (options = {}) => {
  const now = Date.now();
  const forceRefresh = options.forceRefresh === true;

  // Return fresh cache if available
  if (!forceRefresh && cache.items.length > 0 && (now - cache.fetchedAt < CACHE_TTL_MS)) {
    return { ...cache, cached: true };
  }

  try {
    const response = await axios.get(CISA_KEV_FEED_URL, {
      timeout: options.timeout || 8000,
      headers: {
        'User-Agent': 'CyberShieldX-ThreatFeed/1.0 (+https://cybershieldx.local)',
        Accept: 'application/json',
      },
      maxContentLength: 10 * 1024 * 1024, // 10MB safety ceiling
    });

    const items = parseKevCatalog(response.data, 10);
    const ticker = items.map((item) => item.tickerText);

    cache = {
      fetchedAt: now,
      isLive: true,
      source: 'CISA Known Exploited Vulnerabilities Catalog',
      sourceUrl: 'https://www.cisa.gov/known-exploited-vulnerabilities-catalog',
      items,
      ticker,
    };

    return { ...cache, cached: false };
  } catch (err) {
    // If we have stale cache, continue serving stale cache rather than complete fallback
    if (cache.items.length > 0) {
      return {
        ...cache,
        cached: true,
        stale: true,
        warning: 'Remote threat feed refresh failed; serving stale cache.',
      };
    }

    // Fail safe to deterministic static dataset
    return {
      fetchedAt: now,
      isLive: false,
      source: 'CISA Known Exploited Vulnerabilities Catalog (Offline Fallback)',
      sourceUrl: 'https://www.cisa.gov/known-exploited-vulnerabilities-catalog',
      items: FALLBACK_ADVISORIES,
      ticker: FALLBACK_TICKER,
      cached: false,
      warning: err.message,
    };
  }
};

const _getCache = () => cache;
const _clearCache = () => {
  cache = {
    fetchedAt: 0,
    isLive: false,
    items: [],
    ticker: [],
    source: 'CISA Known Exploited Vulnerabilities Catalog',
    sourceUrl: 'https://www.cisa.gov/known-exploited-vulnerabilities-catalog',
  };
};

module.exports = {
  getThreatFeed,
  normalizeKevItem,
  parseKevCatalog,
  FALLBACK_ADVISORIES,
  FALLBACK_TICKER,
  _getCache,
  _clearCache,
};
