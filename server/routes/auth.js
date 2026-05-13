const express = require('express');
const router = express.Router();
const {
  checkUsername,
  signup,
  sendSignupOtp,
  confirmSignupOtp,
  checkEmailRisk,
  requestPasswordReset,
  confirmResetOtp,
  resetPassword,
  login,
  logout,
  refreshAccessToken,
  adminLogin,
  getProfile,
  updateProfile,
  getActivityLogs,
  logActivityClient,
  devPromote,
  deleteAccount,
  updateWebhook,
  // 2FA
  enable2FA,
  confirm2FA,
  disable2FA,
  sendLoginOtp,
  googleLogin,
  checkPasswordBreach,
  getSessions,
  revokeSession,
  updatePassword,
} = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { authValidationRules, handleValidationErrors } = require('../utils/validators');

router.post('/check-username', checkUsername);
router.post('/password-check', (req, res) => checkPasswordBreach(req, res));
router.post('/email-check', authValidationRules.emailCheck, handleValidationErrors, checkEmailRisk);
router.post('/request-email-otp', authValidationRules.requestOtp, handleValidationErrors, sendSignupOtp);
router.post('/verify-email-otp', authValidationRules.verifyOtp, handleValidationErrors, confirmSignupOtp);
router.post('/request-password-reset', authValidationRules.requestPasswordReset, handleValidationErrors, requestPasswordReset);
router.post('/verify-reset-otp', authValidationRules.verifyResetOtp, handleValidationErrors, confirmResetOtp);
router.post('/reset-password', authValidationRules.resetPassword, handleValidationErrors, resetPassword);
router.post('/signup', authValidationRules.signup, handleValidationErrors, signup);
router.post('/admin-login', authValidationRules.login, handleValidationErrors, adminLogin);
router.post('/login', authValidationRules.login, handleValidationErrors, login);
router.post('/google', googleLogin);
router.post('/logout', authenticate, logout);

// ─── Security Management ───────────────────────────────────────────────────────
router.get('/sessions', authenticate, getSessions);
router.post('/sessions/revoke', authenticate, revokeSession);
router.post('/update-password', authenticate, updatePassword);

// ─── Token Refresh (Silent Session Renewal) ────────────────────────────────────────────
// Public route - reads refreshToken HttpOnly cookie to issue new access token
router.post('/refresh', refreshAccessToken);

router.get('/me', authenticate, getProfile);
router.patch('/me', authenticate, updateProfile);
router.get('/activity', authenticate, getActivityLogs);
router.post('/activity', authenticate, logActivityClient);
router.post('/dev-promote', authenticate, devPromote);
router.delete('/delete-account', authenticate, deleteAccount);
router.patch('/webhook', authenticate, updateWebhook);

// 2FA Routes
router.post('/2fa/enable', authenticate, enable2FA);
router.post('/2fa/confirm', authenticate, confirm2FA);
router.post('/2fa/disable', authenticate, disable2FA);
router.post('/2fa/send-otp', sendLoginOtp); // Public — called before login

module.exports = router;
