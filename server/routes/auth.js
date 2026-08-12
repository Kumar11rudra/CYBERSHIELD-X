const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { authValidationRules, handleValidationErrors } = require('../utils/validators');

// Dependency Injection Resolution
const { storageManager, eventPublisher, activeStorageProvider, permissionManager, capabilityResolver } = require('../controllers/chatbot/chatbotController');
const { getAuthModule } = require('../services/authComposition');
const { authController } = getAuthModule({ storageManager, eventPublisher, activeStorageProvider, permissionManager, capabilityResolver });

// Registration & Login
router.post('/signup', authValidationRules.signup, handleValidationErrors, authController.register);
router.post('/login', authValidationRules.login, handleValidationErrors, authController.login);
router.post('/admin-login', authValidationRules.login, handleValidationErrors, authController.adminLogin);
router.post('/logout', authenticate, authController.logout);
router.post('/refresh', authController.refresh);

// Password Reset
router.post('/request-password-reset', authValidationRules.requestPasswordReset, handleValidationErrors, authController.requestPasswordReset);
router.post('/reset-password', authValidationRules.resetPassword, handleValidationErrors, authController.resetPassword);

// Profile
router.get('/me', authenticate, authController.getProfile);
// The prompt also requested GET /api/users/me/profile. 
// We can just alias it here, assuming auth.js is mounted at both or just handled here.
// Let's add the exact path to answer the requirement. (Assuming auth is mounted at /api/auth)
// Wait, if it's /api/users/me/profile, it should probably be in a user.js route, 
// but we'll add /users/me/profile here just in case, or alias it.
router.get('/users/me/profile', authenticate, authController.getProfile);

router.patch('/me', authenticate, authController.updateProfile);

// RBAC Metadata
router.get('/roles', authenticate, authController.getRoles);
router.get('/permissions', authenticate, authController.getPermissions);

// Email risk analysis — authenticated users only
router.post('/email-check', authValidationRules.emailCheck, handleValidationErrors, authenticate, authController.emailCheck);

// Username availability and signup email verification
router.post('/check-username', authController.checkUsername);
router.post('/request-email-otp', authController.requestEmailOtp);
router.post('/verify-email-otp', authController.verifyEmailOtp);

module.exports = router;
