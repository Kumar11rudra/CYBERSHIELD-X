const crypto = require('crypto');
const User = require('../models/User');
const { buildIdentityLookup } = require('../utils/identity');
const { sendPasswordResetOtp, sendPasswordChangeNotification } = require('./emailAlerts');

const RESET_TOKEN_EXPIRY_MINUTES = 10;

const hashResetToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

const createResetOtp = () => String(Math.floor(100000 + Math.random() * 900000));

const requestPasswordReset = async (identity) => {
  const user = await User.findOne(buildIdentityLookup(identity));

  if (!user) {
    return {
      requested: true,
      expiresInMinutes: RESET_TOKEN_EXPIRY_MINUTES,
    };
  }

  const otp = createResetOtp();
  user.passwordResetTokenHash = hashResetToken(otp); // Reuse field for OTP hash
  user.passwordResetExpiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_MINUTES * 60 * 1000);
  await user.save({ validateBeforeSave: false });

  const delivery = await sendPasswordResetOtp({
    to: user.email,
    username: user.username,
    otp,
    expiresInMinutes: RESET_TOKEN_EXPIRY_MINUTES,
  });

  return {
    requested: true,
    deliveryMode: delivery.mode,
    expiresInMinutes: RESET_TOKEN_EXPIRY_MINUTES,
    destination: user.email.replace(/(.{2})(.*)(@.*)/, '$1***$3') // Obfuscated email for feedback
  };
};

const verifyResetOtp = async (identity, otp) => {
  const user = await User.findOne({
    ...buildIdentityLookup(identity),
    passwordResetTokenHash: hashResetToken(otp.trim()),
    passwordResetExpiresAt: { $gt: new Date() },
  });

  if (!user) {
    throw new Error('Invalid or expired OTP code.');
  }

  // Generate a temporary reset token that is valid for 5 minutes after OTP verification
  const tempToken = createResetOtp() + createResetOtp(); 
  user.passwordResetTokenHash = hashResetToken(tempToken);
  user.passwordResetExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min window to change pass
  await user.save({ validateBeforeSave: false });

  return tempToken;
};

const resetPassword = async ({ token, password }) => {
  const hashedToken = hashResetToken(token.trim());
  const user = await User.findOne({
    passwordResetTokenHash: hashedToken,
    passwordResetExpiresAt: { $gt: new Date() },
  });

  if (!user) {
    const error = new Error('Session expired. Please start the reset process again.');
    error.status = 400;
    throw error;
  }

  user.password = password;
  user.passwordResetTokenHash = undefined;
  user.passwordResetExpiresAt = undefined;
  await user.save();

  // Send password change notification
  await sendPasswordChangeNotification({ to: user.email, username: user.username }).catch(console.error);

  return user;
};

module.exports = {
  requestPasswordReset,
  verifyResetOtp,
  resetPassword,
  hashResetToken,
  RESET_TOKEN_EXPIRY_MINUTES,
};
