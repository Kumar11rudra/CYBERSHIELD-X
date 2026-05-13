import { z } from 'zod';

/**
 * SMART VALIDATOR - Advanced Zod Schemas for Cyber Indicators
 */

const IP_V4_REGEX = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
const HASH_MD5_REGEX = /^[a-f0-9]{32}$/i;
const HASH_SHA1_REGEX = /^[a-f0-9]{40}$/i;
const HASH_SHA256_REGEX = /^[a-f0-9]{64}$/i;

export const iocSchema = z.object({
  target: z.string().trim().min(3).max(2048),
});

export const detectIocType = (value) => {
  const v = value.trim();
  if (!v) return null;

  // 1. Check IP
  if (IP_V4_REGEX.test(v)) return 'ip';
  
  // 2. Check Hash
  if (HASH_MD5_REGEX.test(v) || HASH_SHA1_REGEX.test(v) || HASH_SHA256_REGEX.test(v)) return 'hash';
  
  // 3. Check URL
  try {
    const url = new URL(v.startsWith('http') ? v : `https://${v}`);
    if (url.hostname.includes('.') && !v.includes(' ')) {
      // If it contains a slash, it's definitely a URL. Otherwise it might be just a domain.
      return v.includes('/') || v.startsWith('http') ? 'url' : 'domain';
    }
  } catch (e) {
    // Ignore URL parsing errors
  }

  // 4. Check Domain (Fallback)
  const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i;
  if (domainRegex.test(v)) return 'domain';

  return null;
};

export const validateTarget = (value) => {
  const type = detectIocType(value);
  if (!type) {
    return { valid: false, error: 'Enter a valid URL, domain, IP, or Hash (MD5/SHA).' };
  }
  return { valid: true, type };
};
