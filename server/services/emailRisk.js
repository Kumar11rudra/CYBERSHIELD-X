const dns = require('dns').promises;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

const DISPOSABLE_DOMAINS = new Set([
  '10minutemail.com',
  '20minutemail.com',
  'dispostable.com',
  'fakeinbox.com',
  'guerrillamail.com',
  'maildrop.cc',
  'mailinator.com',
  'mailnesia.com',
  'mailpoof.com',
  'mintemail.com',
  'sharklasers.com',
  'tempmail.dev',
  'tempmailo.com',
  'temp-mail.org',
  'throwawaymail.com',
  'trashmail.com',
  'yopmail.com',
]);

const FREE_PROVIDERS = new Set([
  'gmail.com',
  'googlemail.com',
  'hotmail.com',
  'icloud.com',
  'outlook.com',
  'proton.me',
  'protonmail.com',
  'yahoo.com',
  'yandex.com',
  'zoho.com',
]);

const RESERVED_DOMAINS = new Set([
  'example.com',
  'example.net',
  'example.org',
  'invalid',
  'localhost',
  'test',
]);

const COMMON_DOMAIN_TYPOS = new Map([
  ['gamil.com', 'gmail.com'],
  ['gmial.com', 'gmail.com'],
  ['gnail.com', 'gmail.com'],
  ['gmail.co', 'gmail.com'],
  ['hotmail.co', 'hotmail.com'],
  ['hotmial.com', 'hotmail.com'],
  ['outlok.com', 'outlook.com'],
  ['outllok.com', 'outlook.com'],
  ['icloud.co', 'icloud.com'],
  ['protonmai.com', 'protonmail.com'],
  ['yaho.com', 'yahoo.com'],
  ['yahho.com', 'yahoo.com'],
  ['yandex.co', 'yandex.com'],
]);

const COMMON_EMAIL_DOMAINS = [
  'gmail.com',
  'googlemail.com',
  'hotmail.com',
  'icloud.com',
  'outlook.com',
  'proton.me',
  'protonmail.com',
  'yahoo.com',
  'yandex.com',
  'zoho.com',
];

const LOCAL_RISK_KEYWORDS = ['burner', 'dummy', 'fake', 'spam', 'temp', 'test', 'throwaway', 'trash'];
const DOMAIN_RISK_KEYWORDS = ['burner', 'disposable', 'fake', 'mailinator', 'temp', 'throwaway', 'trash', 'yopmail'];

const withTimeout = (promise, timeoutMs = 2500) => Promise.race([
  promise,
  new Promise((_, reject) => {
    setTimeout(() => {
      const error = new Error('Lookup timed out');
      error.code = 'ETIMEOUT';
      reject(error);
    }, timeoutMs);
  }),
]);

const normalizeEmail = (email = '') => email.trim().toLowerCase();

const splitEmail = (email) => {
  const normalized = normalizeEmail(email);
  if (!EMAIL_REGEX.test(normalized)) return null;

  const [localPart, domain] = normalized.split('@');
  return { email: normalized, localPart, domain };
};

const levenshtein = (a, b) => {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const matrix = Array.from({ length: rows }, () => Array(cols).fill(0));

  for (let i = 0; i < rows; i += 1) matrix[i][0] = i;
  for (let j = 0; j < cols; j += 1) matrix[0][j] = j;

  for (let i = 1; i < rows; i += 1) {
    for (let j = 1; j < cols; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return matrix[a.length][b.length];
};

const isDisposableDomain = (domain) => (
  Array.from(DISPOSABLE_DOMAINS).some((knownDomain) => domain === knownDomain || domain.endsWith(`.${knownDomain}`))
);

const findDomainSuggestion = (domain) => {
  if (COMMON_DOMAIN_TYPOS.has(domain)) return COMMON_DOMAIN_TYPOS.get(domain);

  const match = COMMON_EMAIL_DOMAINS.find((knownDomain) => {
    if (domain === knownDomain) return false;
    if (Math.abs(domain.length - knownDomain.length) > 2) return false;
    return levenshtein(domain, knownDomain) <= 2;
  });

  return match || null;
};

const analyzeLocalPart = (localPart) => {
  let score = 0;
  const reasons = [];

  if (localPart.length > 24) {
    score += 10;
    reasons.push('Mailbox name is unusually long.');
  }

  const digitCount = (localPart.match(/\d/g) || []).length;
  if (digitCount >= 5) {
    score += 12;
    reasons.push('Mailbox name contains many digits.');
  }

  if (/(\.|_|-){3,}/.test(localPart)) {
    score += 8;
    reasons.push('Mailbox name uses repeated separators.');
  }

  if (/(.)\1{3,}/.test(localPart)) {
    score += 10;
    reasons.push('Mailbox name contains repeated characters.');
  }

  if (/[bcdfghjklmnpqrstvwxyz]{6,}/i.test(localPart)) {
    score += 12;
    reasons.push('Mailbox name looks randomly generated.');
  }

  if (LOCAL_RISK_KEYWORDS.some((keyword) => localPart.includes(keyword))) {
    score += 25;
    reasons.push('Mailbox name contains throwaway-style keywords.');
  }

  return { score: Math.min(score, 45), reasons };
};

const analyzeDomainSignals = (domain) => {
  let score = 0;
  const reasons = [];

  if (domain.startsWith('xn--')) {
    score += 15;
    reasons.push('Domain uses punycode and should be reviewed carefully.');
  }

  if (DOMAIN_RISK_KEYWORDS.some((keyword) => domain.includes(keyword))) {
    score += 25;
    reasons.push('Domain name resembles a temporary inbox provider.');
  }

  return { score, reasons };
};

const lookupMailRecords = async (domain) => {
  const safeResolve = async (resolver) => {
    try {
      return { records: await withTimeout(resolver(domain)), error: null };
    } catch (error) {
      return { records: [], error };
    }
  };

  const [mx, ipv4, ipv6] = await Promise.all([
    safeResolve(dns.resolveMx),
    safeResolve(dns.resolve4),
    safeResolve(dns.resolve6),
  ]);

  const hasMx = mx.records.length > 0;
  const hasFallbackAddress = ipv4.records.length > 0 || ipv6.records.length > 0;
  const missingCodes = new Set(['ENODATA', 'ENOTFOUND', 'ENONAME', 'ENODOMAIN']);
  const lookupErrors = [mx.error, ipv4.error, ipv6.error].filter(Boolean);
  const allMissing = lookupErrors.length > 0 && lookupErrors.every((error) => missingCodes.has(error.code));
  const transientFailure = lookupErrors.some((error) => !missingCodes.has(error.code));

  return {
    hasMx,
    hasFallbackAddress,
    dnsStatus: hasMx || hasFallbackAddress ? 'found' : allMissing ? 'missing' : transientFailure ? 'unverified' : 'unknown',
  };
};

const buildSummary = (status) => {
  if (status === 'disposable') return 'Known disposable mailbox detected.';
  if (status === 'invalid') return 'Domain looks undeliverable or reserved.';
  if (status === 'suspicious') return 'Address shows multiple fake-email signals.';
  if (status === 'review') return 'Address is usable but should be verified.';
  return 'Address looks deliverable and low risk.';
};

const buildRecommendedAction = (status) => {
  if (status === 'disposable' || status === 'invalid') return 'Block this email or ask for a different mailbox.';
  if (status === 'suspicious') return 'Allow only with OTP verification or manual review.';
  if (status === 'review') return 'Accept with caution and verify ownership.';
  return 'Safe to accept, with standard verification if needed.';
};

const analyzeEmailRisk = async (email) => {
  const parts = splitEmail(email);
  if (!parts) {
    return {
      email: normalizeEmail(email),
      status: 'invalid',
      riskScore: 100,
      summary: buildSummary('invalid'),
      recommendedAction: buildRecommendedAction('invalid'),
      reasons: ['Email format is invalid.'],
      checks: {
        syntax: false,
        disposableDomain: false,
        reservedDomain: false,
        hasMxRecords: false,
        hasFallbackAddress: false,
        dnsStatus: 'missing',
        typoSuggestion: null,
        freeProvider: false,
      },
    };
  }

  const { email: normalizedEmail, localPart, domain } = parts;
  const typoSuggestion = findDomainSuggestion(domain);
  const disposableDomain = isDisposableDomain(domain);
  const reservedDomain = RESERVED_DOMAINS.has(domain) || domain.endsWith('.local');
  const freeProvider = FREE_PROVIDERS.has(domain);

  let riskScore = 0;
  const reasons = [];

  if (disposableDomain) {
    riskScore = 100;
    reasons.push('Domain is listed as a disposable inbox provider.');
  }

  if (reservedDomain) {
    riskScore = Math.max(riskScore, 95);
    reasons.push('Domain is reserved for testing or local-only use.');
  }

  if (typoSuggestion) {
    riskScore += 40;
    reasons.push(`Domain looks similar to ${typoSuggestion}.`);
  }

  const localSignals = analyzeLocalPart(localPart);
  riskScore += localSignals.score;
  reasons.push(...localSignals.reasons);

  const domainSignals = analyzeDomainSignals(domain);
  riskScore += domainSignals.score;
  reasons.push(...domainSignals.reasons);

  const dnsCheck = await lookupMailRecords(domain);
  if (dnsCheck.dnsStatus === 'missing') {
    riskScore = Math.max(riskScore, 88);
    reasons.push('Domain has no MX or fallback address records.');
  } else if (dnsCheck.dnsStatus === 'unverified') {
    riskScore += 10;
    reasons.push('Mail records could not be fully verified right now.');
  }

  riskScore = Math.min(Math.round(riskScore), 100);

  let status = 'safe';
  if (disposableDomain) {
    status = 'disposable';
  } else if (reservedDomain || dnsCheck.dnsStatus === 'missing') {
    status = 'invalid';
  } else if (riskScore >= 70) {
    status = 'suspicious';
  } else if (riskScore >= 35) {
    status = 'review';
  }

  return {
    email: normalizedEmail,
    localPart,
    domain,
    status,
    riskScore,
    summary: buildSummary(status),
    recommendedAction: buildRecommendedAction(status),
    reasons: Array.from(new Set(reasons)).slice(0, 5),
    checks: {
      syntax: true,
      disposableDomain,
      reservedDomain,
      hasMxRecords: dnsCheck.hasMx,
      hasFallbackAddress: dnsCheck.hasFallbackAddress,
      dnsStatus: dnsCheck.dnsStatus,
      typoSuggestion,
      freeProvider,
    },
  };
};

module.exports = {
  analyzeEmailRisk,
  normalizeEmail,
};
