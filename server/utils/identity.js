const crypto = require('crypto');
const { normalizeEmail } = require('../services/emailRisk');

const normalizeMobileNumber = (value = '') => {
  const digits = String(value || '').replace(/\D/g, '');
  return digits || '';
};

const getMobileNumberVariants = (value = '') => {
  const raw = String(value || '').trim();
  const digits = normalizeMobileNumber(raw);
  const variants = new Set();

  if (raw) variants.add(raw);
  if (digits) {
    variants.add(digits);
    variants.add(`+${digits}`);

    // Support common India local/dev input styles used by this app.
    if (digits.length === 10) {
      variants.add(`91${digits}`);
      variants.add(`+91${digits}`);
    }

    if (digits.length === 12 && digits.startsWith('91')) {
      variants.add(digits.slice(-10));
    }

    if (digits.length === 11 && digits.startsWith('0')) {
      variants.add(digits.slice(1));
    }
  }

  return Array.from(variants).filter(Boolean);
};

const buildIdentityLookup = (identity = '') => {
  const trimmedIdentity = String(identity || '').trim();
  const normalizedEmail = normalizeEmail(trimmedIdentity);
  const emailHash = crypto.createHash('sha256').update(normalizedEmail).digest('hex');
  
  const mobileVariants = getMobileNumberVariants(trimmedIdentity);
  const mobileHashes = mobileVariants.map(v => 
    crypto.createHash('sha256').update(normalizeMobileNumber(v)).digest('hex')
  );

  return {
    $or: [
      { emailHash: emailHash },
      { username: trimmedIdentity },
      ...(mobileHashes.length > 0 ? [{ mobileHash: { $in: mobileHashes } }] : []),
    ],
  };
};

module.exports = {
  normalizeMobileNumber,
  getMobileNumberVariants,
  buildIdentityLookup,
};
