/**
 * IOCHUNTER - Advanced Cyber Intelligence Extraction Engine
 * Extracts IPs, Domains, URLs, and Hashes from unstructured text.
 */

const HASH_PATTERNS = {
  md5: /\b[a-f0-9]{32}\b/gi,
  sha1: /\b[a-f0-9]{40}\b/gi,
  sha256: /\b[a-f0-9]{64}\b/gi,
};

const IP_PATTERN = /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g;

// RFC 3986 compliant-ish URL detection
const URL_PATTERN = /(?:https?:\/\/|www\.)[^\s<>"']+/gi;

// Strict Domain detection (avoids catching words in sentences)
const DOMAIN_PATTERN = /\b(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}\b/gi;

/**
 * Extracts all unique Indicators of Compromise (IOCs) from text.
 * @param {string} text - The raw text to process.
 * @returns {Array<{type: string, value: string}>}
 */
export const extractIOCs = (text) => {
  if (!text || typeof text !== 'string') return [];
  
  const results = [];
  const seen = new Set();

  const add = (type, value) => {
    const normalized = value.toLowerCase().trim();
    if (!seen.has(normalized)) {
      results.push({ type, value: value.trim() });
      seen.add(normalized);
    }
  };

  // 1. Extract URLs
  const urls = text.match(URL_PATTERN) || [];
  urls.forEach(u => add('url', u));

  // 2. Extract IPs
  const ips = text.match(IP_PATTERN) || [];
  ips.forEach(i => add('ip', i));

  // 3. Extract Hashes
  Object.entries(HASH_PATTERNS).forEach(([type, regex]) => {
    const matches = text.match(regex) || [];
    matches.forEach(m => add('hash', m));
  });

  // 4. Extract Domains (Only if not already part of a URL)
  const domains = text.match(DOMAIN_PATTERN) || [];
  domains.forEach(d => {
    // Basic check: don't add if it's already captured as or in a URL
    const isCaptured = results.some(r => r.type === 'url' && r.value.includes(d));
    if (!isCaptured) {
      add('domain', d);
    }
  });

  return results;
};

/**
 * Heuristic check for potential phishing/typosquatting
 * @param {string} domain 
 * @returns {{suspicious: boolean, reason: string}}
 */
export const analyzeDomainHeuristics = (domain) => {
  const d = domain.toLowerCase();
  
  // High-risk TLDs
  const riskyTlds = ['.tk', '.ml', '.ga', '.cf', '.gq', '.zip', '.xyz', '.monster', '.top', '.icu'];
  const hasRiskyTld = riskyTlds.some(t => d.endsWith(t));
  
  // Homograph/Typosquatting markers
  const homographMarkers = /[031il]/; // simple ones like 0 instead of o, 3 instead of e
  const suspiciousChars = d.match(homographMarkers);
  
  if (hasRiskyTld) return { suspicious: true, reason: 'High-risk TLD detected' };
  if (suspiciousChars && (d.includes('google') || d.includes('amazon') || d.includes('apple') || d.includes('bank'))) {
    return { suspicious: true, reason: 'Potential typosquatting of major brand' };
  }
  
  return { suspicious: false, reason: null };
};
