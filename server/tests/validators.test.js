/**
 * CyberShield X — Validators Unit Test Suite
 * Tests: URL, IP, Domain, Hash detection and normalization
 */

const {
  isValidURL,
  isValidIP,
  isValidDomain,
  isValidHash,
  normalizeScanTarget,
  detectInputType,
  getHashType,
} = require('../utils/validators');

// ══════════════════════════════════════════════════════════════════════════════
// URL VALIDATION
// ══════════════════════════════════════════════════════════════════════════════
describe('URL Validation', () => {
  const validURLs = [
    'http://example.com',
    'https://www.google.com',
    'https://sub.domain.co.uk/path?q=1',
    'example.com',           // Should auto-prefix https://
    'www.google.com',
  ];

  const invalidURLs = [
    'not a url',
    'ftp://ftp.example.com',   // Only http/https allowed
    '   ',
    '',
  ];

  validURLs.forEach(url => {
    it(`"${url}" should be a valid URL`, () => {
      expect(isValidURL(url.includes('://') ? url : `https://${url}`)).toBe(true);
    });
  });

  invalidURLs.forEach(url => {
    it(`"${url}" should NOT be a valid URL`, () => {
      expect(isValidURL(url)).toBe(false);
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// IP ADDRESS VALIDATION
// ══════════════════════════════════════════════════════════════════════════════
describe('IP Address Validation', () => {
  const validIPs = [
    '192.168.1.1',
    '8.8.8.8',
    '0.0.0.0',
    '255.255.255.255',
    '2001:0db8:85a3::8a2e:0370:7334', // IPv6
    '::1',                              // IPv6 loopback
  ];

  const invalidIPs = [
    '256.1.1.1',     // Out of range
    '192.168.1',     // Incomplete
    'abc.def.ghi.jkl',
    'not-an-ip',
    '',
  ];

  validIPs.forEach(ip => {
    it(`"${ip}" should be a valid IP`, () => {
      expect(isValidIP(ip)).toBe(true);
    });
  });

  invalidIPs.forEach(ip => {
    it(`"${ip}" should NOT be a valid IP`, () => {
      expect(isValidIP(ip)).toBe(false);
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// DOMAIN VALIDATION
// ══════════════════════════════════════════════════════════════════════════════
describe('Domain Validation', () => {
  const validDomains = [
    'google.com',
    'sub.example.co.uk',
    'my-domain.io',
    'api.cybershieldx.in',
  ];

  const invalidDomains = [
    'https://google.com',  // Has protocol — not a bare domain
    '192.168.1.1',         // IP address
    'localhost',           // No TLD
    'not valid.com',       // Has space
    'has/slash.com',       // Has slash
    '',
  ];

  validDomains.forEach(domain => {
    it(`"${domain}" should be a valid domain`, () => {
      expect(isValidDomain(domain)).toBe(true);
    });
  });

  invalidDomains.forEach(domain => {
    it(`"${domain}" should NOT be a valid domain`, () => {
      expect(isValidDomain(domain)).toBe(false);
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// HASH VALIDATION
// ══════════════════════════════════════════════════════════════════════════════
describe('Hash Validation', () => {
  it('32-char hex should be valid MD5', () => {
    const md5 = 'd41d8cd98f00b204e9800998ecf8427e';
    expect(isValidHash(md5)).toBe(true);
    expect(getHashType(md5)).toBe('md5');
  });

  it('40-char hex should be valid SHA1', () => {
    const sha1 = 'da39a3ee5e6b4b0d3255bfef95601890afd80709';
    expect(isValidHash(sha1)).toBe(true);
    expect(getHashType(sha1)).toBe('sha1');
  });

  it('64-char hex should be valid SHA256', () => {
    const sha256 = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
    expect(isValidHash(sha256)).toBe(true);
    expect(getHashType(sha256)).toBe('sha256');
  });

  it('Non-hex string should NOT be a valid hash', () => {
    expect(isValidHash('thisisnothash')).toBe(false);
    expect(isValidHash('zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz')).toBe(false);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// TYPE DETECTION
// ══════════════════════════════════════════════════════════════════════════════
describe('Input Type Detection', () => {
  it('Should detect IP address', () => {
    expect(detectInputType('8.8.8.8')).toBe('ip');
  });

  it('Should detect domain', () => {
    expect(detectInputType('google.com')).toBe('domain');
  });

  it('Should detect URL', () => {
    expect(detectInputType('https://example.com/path')).toBe('url');
  });

  it('Should detect MD5 hash', () => {
    expect(detectInputType('d41d8cd98f00b204e9800998ecf8427e')).toBe('hash');
  });

  it('Should return null for invalid input', () => {
    expect(detectInputType('not valid input!!')).toBeNull();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// NORMALIZATION
// ══════════════════════════════════════════════════════════════════════════════
describe('Target Normalization', () => {
  it('Should lowercase domain', () => {
    expect(normalizeScanTarget('GOOGLE.COM')).toBe('google.com');
  });

  it('Should normalize URL hostname to lowercase', () => {
    const normalized = normalizeScanTarget('https://EXAMPLE.COM/Path');
    expect(normalized).toContain('example.com');
  });

  it('Should return null for garbage input', () => {
    expect(normalizeScanTarget('not!! valid')).toBeNull();
  });
});
