const crypto = require('crypto');
const User = require('../models/User');
const Verification = require('../models/Verification');
const { analyzeEmailRisk, normalizeEmail } = require('./emailRisk');
const { sendVerificationCode } = require('./emailAlerts');

const OTP_TTL_MS = 10 * 60 * 1000;
const VERIFIED_TTL_MS = 20 * 60 * 1000;
const RESEND_INTERVAL_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;

const hashValue = (value) => crypto.createHash('sha256').update(value).digest('hex');

const createOtp = () => String(Math.floor(100000 + Math.random() * 900000));

const createVerificationToken = () => crypto.randomBytes(24).toString('hex');

const timingSafeEqualHex = (a, b) => {
  const left = Buffer.from(a, 'hex');
  const right = Buffer.from(b, 'hex');
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
};

const resetEmailVerification = async (email) => {
  await Verification.deleteOne({ email: normalizeEmail(email), type: 'email_signup' });
};

const requestEmailOtp = async (email) => {
  const normalizedEmail = normalizeEmail(email);
  const emailAnalysis = await analyzeEmailRisk(normalizedEmail);

  if (['disposable', 'invalid'].includes(emailAnalysis.status)) {
    const error = new Error('This email cannot be verified. Use a real, deliverable inbox.');
    error.status = 422;
    error.emailAnalysis = emailAnalysis;
    throw error;
  }

  const existingUser = await User.findOne({ email: normalizedEmail }).select('_id');
  if (existingUser) {
    const error = new Error('An account with this email already exists.');
    error.status = 409;
    throw error;
  }

  const existingRecord = await Verification.findOne({ email: normalizedEmail, type: 'email_signup' });
  const now = Date.now();
  if (existingRecord && existingRecord.updatedAt && (now - existingRecord.updatedAt.getTime()) < RESEND_INTERVAL_MS) {
    const error = new Error('Please wait before requesting another OTP.');
    error.status = 429;
    error.retryAfterSeconds = Math.ceil((RESEND_INTERVAL_MS - (now - existingRecord.updatedAt.getTime())) / 1000);
    throw error;
  }

  const otp = createOtp();
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const verifyLink = `${frontendUrl}/verify-email?email=${encodeURIComponent(normalizedEmail)}&code=${otp}`;

  // Create or update verification record in DB
  await Verification.findOneAndUpdate(
    { email: normalizedEmail, type: 'email_signup' },
    {
      otp: hashValue(otp),
      expiresAt: new Date(now + OTP_TTL_MS),
      verified: false,
      verificationToken: null,
      attemptsRemaining: MAX_ATTEMPTS,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  try {
    const delivery = await sendVerificationCode({
      to: normalizedEmail,
      code: otp,
      expiresInMinutes: OTP_TTL_MS / 60000,
      verifyLink,
    });

    return {
      email: normalizedEmail,
      deliveryMode: delivery.mode,
      expiresInSeconds: OTP_TTL_MS / 1000,
      resendInSeconds: RESEND_INTERVAL_MS / 1000,
    };
  } catch (err) {
    // If mail sending fails, remove the verification record so the user can retry instantly
    await Verification.deleteOne({ email: normalizedEmail, type: 'email_signup' });
    throw err;
  }
};

const verifyEmailOtp = async (email, otp) => {
  const normalizedEmail = normalizeEmail(email);
  const record = await Verification.findOne({ email: normalizedEmail, type: 'email_signup' });

  if (!record || record.expiresAt <= new Date()) {
    if (record) {
      await Verification.deleteOne({ email: normalizedEmail, type: 'email_signup' });
    }
    const error = new Error('OTP expired. Request a new verification code.');
    error.status = 400;
    throw error;
  }

  if (record.verified && record.verificationToken) {
    return {
      email: normalizedEmail,
      verificationToken: record.verificationToken,
      expiresInSeconds: Math.ceil((record.expiresAt.getTime() - Date.now()) / 1000),
    };
  }

  const otpHash = hashValue(otp.trim());
  if (!timingSafeEqualHex(record.otp, otpHash)) {
    record.attemptsRemaining -= 1;
    if (record.attemptsRemaining <= 0) {
      await Verification.deleteOne({ email: normalizedEmail, type: 'email_signup' });
      const error = new Error('Too many incorrect OTP attempts. Request a new code.');
      error.status = 429;
      throw error;
    }

    await record.save();
    const error = new Error('Incorrect OTP code.');
    error.status = 400;
    error.attemptsRemaining = record.attemptsRemaining;
    throw error;
  }

  const verificationToken = createVerificationToken();
  record.verified = true;
  record.verificationToken = verificationToken;
  record.expiresAt = new Date(Date.now() + VERIFIED_TTL_MS);
  record.otp = 'VERIFIED';
  record.attemptsRemaining = 0;
  await record.save();

  return {
    email: normalizedEmail,
    verificationToken,
    expiresInSeconds: VERIFIED_TTL_MS / 1000,
  };
};

const isVerifiedEmailTokenValid = async (email, verificationToken) => {
  const normalizedEmail = normalizeEmail(email);
  const record = await Verification.findOne({ email: normalizedEmail, type: 'email_signup' });

  if (!record || !record.verified || !record.verificationToken || record.expiresAt <= new Date()) {
    return false;
  }

  return timingSafeEqualHex(hashValue(record.verificationToken), hashValue(verificationToken));
};

const consumeVerifiedEmailToken = async (email) => {
  await Verification.deleteOne({ email: normalizeEmail(email), type: 'email_signup' });
};

module.exports = {
  requestEmailOtp,
  verifyEmailOtp,
  isVerifiedEmailTokenValid,
  consumeVerifiedEmailToken,
  resetEmailVerification,
};
