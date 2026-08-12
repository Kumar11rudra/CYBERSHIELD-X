'use strict';

const net = require('net');
const dns = require('dns');

/**
 * Parses numeric octets supporting octal, hex, and decimal representations.
 */
function parseNumericOctet(part) {
  if (part.startsWith('0x') || part.startsWith('0X')) {
    return parseInt(part, 16);
  }
  if (part.startsWith('0') && part.length > 1) {
    return parseInt(part, 8);
  }
  return parseInt(part, 10);
}

/**
 * Converts a 32-bit integer to IPv4 dot-decimal format.
 */
function ipFromLong(num) {
  return [
    (num >>> 24) & 0xff,
    (num >>> 16) & 0xff,
    (num >>> 8) & 0xff,
    num & 0xff
  ].join('.');
}

/**
 * Normalizes input hostname or IP, converting decimal, hex, and mixed IPv4 formats.
 */
function normalizeHostname(input) {
  if (!input || typeof input !== 'string') return '';
  let lower = input.toLowerCase().trim();

  // Extract hostname if input is a URL or protocol-relative
  if (lower.includes('://') || lower.startsWith('//')) {
    try {
      const urlToParse = lower.startsWith('//') ? `http:${lower}` : lower;
      const parsed = new URL(urlToParse);
      lower = parsed.hostname;
    } catch {
      lower = lower.replace(/^https?:\/\//, '').split('/')[0];
      if (lower.startsWith('[')) {
        const endBracket = lower.indexOf(']');
        if (endBracket > -1) lower = lower.slice(1, endBracket);
      } else if ((lower.match(/:/g) || []).length <= 1) {
        lower = lower.split(':')[0];
      }
    }
  } else {
    if (lower.startsWith('[')) {
      const endBracket = lower.indexOf(']');
      if (endBracket > -1) lower = lower.slice(1, endBracket);
    } else if ((lower.match(/:/g) || []).length <= 1) {
      lower = lower.split(':')[0];
    }
  }

  // Handle IPv4 decimal format (e.g. 2130706433)
  if (/^\d+$/.test(lower)) {
    const num = parseInt(lower, 10);
    if (!isNaN(num) && num >= 0 && num <= 4294967295) {
      return ipFromLong(num);
    }
  }

  // Handle IPv4 hex format (e.g. 0x7f000001)
  if (/^0x[0-9a-f]+$/i.test(lower)) {
    const num = parseInt(lower, 16);
    if (!isNaN(num) && num >= 0 && num <= 4294967295) {
      return ipFromLong(num);
    }
  }

  // Handle mixed IPv4 format (e.g. 0x7f.0.0.1 or 0177.0.0.1)
  if (lower.includes('.')) {
    const parts = lower.split('.');
    if (parts.length === 4) {
      try {
        const octets = parts.map(p => parseNumericOctet(p));
        if (octets.every(o => !isNaN(o) && o >= 0 && o <= 255)) {
          return octets.join('.');
        }
      } catch {}
    }
  }

  return lower;
}

/**
 * Verifies if an IP address is in a private, loopback, link-local, multicast, or reserved range.
 */
const isPrivateIp = (ip) => {
  if (!ip || typeof ip !== 'string') return false;
  let cleanIp = ip.trim();

  // Extract IPv4 suffix from IPv4-mapped IPv6 address
  if (cleanIp.startsWith('::ffff:') || cleanIp.startsWith('0:0:0:0:0:ffff:')) {
    const suffix = cleanIp.split(':').pop();
    if (net.isIPv4(suffix)) {
      cleanIp = suffix;
    } else {
      // Hex representation of mapped IPv4 (e.g. ::ffff:7f00:0001)
      const blocks = cleanIp.split(':');
      const hex1 = blocks[blocks.length - 2];
      const hex2 = blocks[blocks.length - 1];
      if (/^[0-9a-f]{1,4}$/i.test(hex1) && /^[0-9a-f]{1,4}$/i.test(hex2)) {
        const val1 = parseInt(hex1, 16);
        const val2 = parseInt(hex2, 16);
        const ipv4 = [
          (val1 >>> 8) & 0xff,
          val1 & 0xff,
          (val2 >>> 8) & 0xff,
          val2 & 0xff
        ].join('.');
        if (net.isIPv4(ipv4)) {
          cleanIp = ipv4;
        }
      }
    }
  }

  // IPv4 Private & Loopback Checks
  if (net.isIPv4(cleanIp)) {
    const parts = cleanIp.split('.').map(Number);
    const [a, b, c, d] = parts;
    if (a === 127) return true; // Loopback: 127.0.0.0/8
    if (a === 10) return true;  // Class A: 10.0.0.0/8
    if (a === 172 && b >= 16 && b <= 31) return true; // Class B: 172.16.0.0/12
    if (a === 192 && b === 168) return true; // Class C: 192.168.0.0/16
    if (a === 169 && b === 254) return true; // Link-Local: 169.254.0.0/16
    if (a === 0) return true;  // Local-net: 0.0.0.0/8
    if (a >= 224) return true; // Multicast/Broadcast/Reserved: 224.0.0.0/4 and 240.0.0.0/4
    return false;
  }

  // IPv6 Private & Loopback Checks
  if (net.isIPv6(cleanIp)) {
    const normalized = cleanIp.toLowerCase();
    if (normalized === '::1' || normalized === '0:0:0:0:0:0:0:1') return true; // Loopback
    if (normalized === '::' || normalized === '0:0:0:0:0:0:0:0') return true;  // Unspecified
    if (/^fe[89ab]/i.test(normalized)) return true; // Link-Local: fe80::/10
    if (/^f[cd]/i.test(normalized)) return true; // Unique Local ULA: fc00::/7
    if (normalized.startsWith('ff')) return true; // Multicast: ff00::/8
    return false;
  }

  return false;
};

/**
 * Resolves a hostname and checks if any resolved IP belongs to private/loopback ranges.
 */
const isPrivateOrLoopback = async (input) => {
  const host = normalizeHostname(input);
  if (!host) return false;

  if (host === 'localhost' || host === 'metadata.google.internal' || host === '169.254.169.254') {
    return true;
  }

  if (net.isIP(host)) {
    return isPrivateIp(host);
  }

  try {
    const dnsPromises = dns.promises;
    const addresses = await dnsPromises.resolve(host).catch(() => []);
    if (addresses.length > 0) {
      return addresses.some(addr => isPrivateIp(addr));
    }
  } catch {}

  try {
    const dnsPromises = dns.promises;
    const { address } = await dnsPromises.lookup(host).catch(() => ({}));
    if (address) {
      return isPrivateIp(address);
    }
  } catch {}

  return false;
};

/**
 * Custom DNS Lookup mapping for http.request options to secure sockets against DNS rebinding.
 */
const ssrfLookup = (hostname, options, callback) => {
  const cb = typeof options === 'function' ? options : callback;
  const opts = typeof options === 'function' ? {} : options;

  const normalizedHost = normalizeHostname(hostname);
  if (normalizedHost === 'localhost' || normalizedHost === 'metadata.google.internal' || normalizedHost === '169.254.169.254') {
    return cb(new Error(`SSRF Blocked: Host ${hostname} is private`));
  }

  dns.lookup(hostname, opts, (err, address, family) => {
    if (err) return cb(err);
    
    const addresses = Array.isArray(address) ? address : [{ address, family }];
    
    for (const addrObj of addresses) {
      const addr = typeof addrObj === 'string' ? addrObj : addrObj.address;
      if (isPrivateIp(addr)) {
        return cb(new Error(`SSRF Blocked: Resolved IP ${addr} is private`));
      }
    }
    
    cb(null, address, family);
  });
};

const http = require('http');
const https = require('https');

const secureHttpAgent = new http.Agent({ lookup: ssrfLookup });
const secureHttpsAgent = new https.Agent({ lookup: ssrfLookup });

module.exports = {
  isPrivateIp,
  normalizeHostname,
  isPrivateOrLoopback,
  ssrfLookup,
  secureHttpAgent,
  secureHttpsAgent
};
