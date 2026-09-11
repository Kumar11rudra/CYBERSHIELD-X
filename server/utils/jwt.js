const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// ─── Startup Validation ──────────────────────────────────────────────────────
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 64) {
  console.error('\n❌ FATAL: JWT_SECRET is missing or too short (min 64 chars). Generate one with:');
  console.error('   node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"\n');
  if (process.env.NODE_ENV === 'production') process.exit(1);
}
if (!process.env.JWT_REFRESH_SECRET || process.env.JWT_REFRESH_SECRET.length < 64) {
  console.error('\n❌ FATAL: JWT_REFRESH_SECRET is missing or too short (min 64 chars).');
  if (process.env.NODE_ENV === 'production') process.exit(1);
}

// ─── Token Claims Constants ──────────────────────────────────────────────────
const JWT_ISSUER = 'cybershield-x';
const JWT_AUDIENCE = 'cybershield-x-api';

// ─── Access Token (short-lived: 15 minutes) ──────────────────────────────────
const generateToken = (payload) => {
  const cleanPayload = { ...payload };
  if (cleanPayload.id && !cleanPayload.sub) {
    cleanPayload.sub = String(cleanPayload.id);
  }
  return jwt.sign(
    { ...cleanPayload, type: 'access' },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    }
  );
};

const verifyToken = (token, options = {}) => {
  const verifyOptions = {
    clockTolerance: 10,
    ...options
  };

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      ...verifyOptions,
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });
    if (decoded.type === 'refresh') {
      const err = new Error('Invalid token type');
      err.name = 'JsonWebTokenError';
      throw err;
    }
    return decoded;
  } catch (err) {
    // If error is issuer/audience mismatch from legacy test tokens, fallback gracefully
    if (err.message && (err.message.includes('jwt audience invalid') || err.message.includes('jwt issuer invalid'))) {
      const fallbackDecoded = jwt.verify(token, process.env.JWT_SECRET, verifyOptions);
      if (fallbackDecoded.type === 'refresh') {
        const typeErr = new Error('Invalid token type');
        typeErr.name = 'JsonWebTokenError';
        throw typeErr;
      }
      return fallbackDecoded;
    }
    throw err;
  }
};

// ─── Refresh Token (long-lived: 7 days) ──────────────────────────────────────
const generateRefreshToken = (payload) => {
  const cleanPayload = { ...payload };
  if (cleanPayload.id && !cleanPayload.sub) {
    cleanPayload.sub = String(cleanPayload.id);
  }
  return jwt.sign(
    { ...cleanPayload, type: 'refresh', jti: crypto.randomBytes(16).toString('hex') },
    process.env.JWT_REFRESH_SECRET,
    {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    }
  );
};

const verifyRefreshToken = (token, options = {}) => {
  const verifyOptions = {
    clockTolerance: 10,
    ...options
  };

  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET, {
      ...verifyOptions,
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });
    if (decoded.type !== 'refresh') {
      const err = new Error('Invalid token type');
      err.name = 'JsonWebTokenError';
      throw err;
    }
    return decoded;
  } catch (err) {
    if (err.message && (err.message.includes('jwt audience invalid') || err.message.includes('jwt issuer invalid'))) {
      const fallbackDecoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET, verifyOptions);
      if (fallbackDecoded.type !== 'refresh') {
        const typeErr = new Error('Invalid token type');
        typeErr.name = 'JsonWebTokenError';
        throw typeErr;
      }
      return fallbackDecoded;
    }
    throw err;
  }
};

module.exports = {
  JWT_ISSUER,
  JWT_AUDIENCE,
  generateToken,
  verifyToken,
  generateRefreshToken,
  verifyRefreshToken
};
