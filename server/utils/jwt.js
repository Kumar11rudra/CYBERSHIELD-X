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

// ─── Access Token (short-lived: 15 minutes) ──────────────────────────────────
const generateToken = (payload) => {
  return jwt.sign(
    { ...payload, type: 'access' },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m' }
  );
};

const verifyToken = (token) => {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  // Reject refresh tokens being used as access tokens
  if (decoded.type === 'refresh') {
    const err = new Error('Invalid token type');
    err.name = 'JsonWebTokenError';
    throw err;
  }
  return decoded;
};

// ─── Refresh Token (long-lived: 7 days) ──────────────────────────────────────
const generateRefreshToken = (payload) => {
  return jwt.sign(
    { ...payload, type: 'refresh', jti: crypto.randomBytes(16).toString('hex') },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );
};

const verifyRefreshToken = (token) => {
  const decoded = jwt.verify(
    token,
    process.env.JWT_REFRESH_SECRET
  );
  if (decoded.type !== 'refresh') {
    const err = new Error('Invalid token type');
    err.name = 'JsonWebTokenError';
    throw err;
  }
  return decoded;
};

module.exports = { generateToken, verifyToken, generateRefreshToken, verifyRefreshToken };
