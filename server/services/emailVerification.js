const crypto = require('crypto');
const User = require('../models/User');
const { analyzeEmailRisk, normalizeEmail } = require('./emailRisk');
const { sendVerificationCode } = require('./emailAlerts');

const OTP_TTL_MS = 10 * 60 * 1000;
const VERIFIED_TTL_MS = 20 * 60 * 1000;
const RESEND_INTERVAL_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;

const verificationStore = new Map();

const createError = (status, message, extra = {}) => {
  const error = new Error(message);
  error.status = status;
  Object.assign(error, extra);
  return error;
};

const cleanupExpired = () => {
  const now = Date.now();
  for (const [email, record] of verificationStore.entries()) {
    const expiredOtp = record.expiresAt <= now && (!record.verifiedToken || record.verifiedTokenExpiresAt <= now);
    const expiredVerifiedToken = record.verifiedToken && record.verifiedTokenExpiresAt <= now;

    if (expiredOtp || expiredVerifiedToken) {
      verificationStore.delete(email);
    }
  }
};

const hashValue = (value) => crypto.createHash('sha256').update(value).digest('hex');

const createOtp = () => String(Math.floor(100000 + Math.random() * 900000));

const createVerificationToken = () => crypto.randomBytes(24).toString('hex');

const timingSafeEqualHex = (a, b) => {
  const left = Buffer.from(a, 'hex');
  const right = Buffer.from(b, 'hex');
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
};

const resetEmailVerification = (email) => {
  verificationStore.delete(normalizeEmail(email));
};

const requestEmailOtp = async (email) => {
  cleanupExpired();

  const normalizedEmail = normalizeEmail(email);
  const emailAnalysis = await analyzeEmailRisk(normalizedEmail);

  if (['disposable', 'invalid'].includes(emailAnalysis.status)) {
    throw createError(422, 'This email cannot be verified. Use a real, deliverable inbox.', { emailAnalysis });
  }

  const existingUser = await User.findOne({ email: normalizedEmail }).select('_id');
  if (existingUser) {
    throw createError(409, 'An account with this email already exists.');
  }

  const existingRecord = verificationStore.get(normalizedEmail);
  const now = Date.now();
  if (existingRecord && existingRecord.resendAvailableAt > now) {
    throw createError(429, 'Please wait before requesting another OTP.', {
      retryAfterSeconds: Math.ceil((existingRecord.resendAvailableAt - now) / 1000),
    });
  }

  const otp = createOtp();
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const verifyLink = `${frontendUrl}/verify-email?email=${encodeURIComponent(normalizedEmail)}&code=${otp}`;

  const delivery = await sendVerificationCode({
    to: normalizedEmail,
    code: otp,
    expiresInMinutes: OTP_TTL_MS / 60000,
    verifyLink,
  });

  verificationStore.set(normalizedEmail, {
    email: normalizedEmail,
    otpHash: hashValue(otp),
    expiresAt: now + OTP_TTL_MS,
    resendAvailableAt: now + RESEND_INTERVAL_MS,
    attemptsRemaining: MAX_ATTEMPTS,
    verifiedToken: null,
    verifiedTokenExpiresAt: null,
  });

  return {
    email: normalizedEmail,
    deliveryMode: delivery.mode,
    expiresInSeconds: OTP_TTL_MS / 1000,
    resendInSeconds: RESEND_INTERVAL_MS / 1000,
  };
};

const verifyEmailOtp = async (email, otp) => {
  cleanupExpired();

  const normalizedEmail = normalizeEmail(email);
  const record = verificationStore.get(normalizedEmail);

  if (!record || record.expiresAt <= Date.now()) {
    verificationStore.delete(normalizedEmail);
    throw createError(400, 'OTP expired. Request a new verification code.');
  }

  if (record.verifiedToken && record.verifiedTokenExpiresAt > Date.now()) {
    return {
      email: normalizedEmail,
      verificationToken: record.verifiedToken,
      expiresInSeconds: Math.ceil((record.verifiedTokenExpiresAt - Date.now()) / 1000),
    };
  }

  const otpHash = hashValue(otp.trim());
  if (!timingSafeEqualHex(record.otpHash, otpHash)) {
    record.attemptsRemaining -= 1;
    if (record.attemptsRemaining <= 0) {
      verificationStore.delete(normalizedEmail);
      throw createError(429, 'Too many incorrect OTP attempts. Request a new code.');
    }

    throw createError(400, 'Incorrect OTP code.', { attemptsRemaining: record.attemptsRemaining });
  }

  const verificationToken = createVerificationToken();
  record.verifiedToken = verificationToken;
  record.verifiedTokenExpiresAt = Date.now() + VERIFIED_TTL_MS;
  record.otpHash = null;
  record.attemptsRemaining = 0;

  return {
    email: normalizedEmail,
    verificationToken,
    expiresInSeconds: VERIFIED_TTL_MS / 1000,
  };
};

const isVerifiedEmailTokenValid = (email, verificationToken) => {
  cleanupExpired();

  const normalizedEmail = normalizeEmail(email);
  const record = verificationStore.get(normalizedEmail);

  if (!record || !record.verifiedToken || record.verifiedTokenExpiresAt <= Date.now()) {
    return false;
  }

  return timingSafeEqualHex(hashValue(record.verifiedToken), hashValue(verificationToken));
};

const consumeVerifiedEmailToken = (email) => {
  verificationStore.delete(normalizeEmail(email));
};

module.exports = {
  requestEmailOtp,
  verifyEmailOtp,
  isVerifiedEmailTokenValid,
  consumeVerifiedEmailToken,
  resetEmailVerification,
};
