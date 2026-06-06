/**
 * Dev mode  (NODE_ENV != 'production'): OTP "000000" is a universal bypass for testing.
 * Prod mode (NODE_ENV == 'production'): Only real OTP accepted. No bypasses.
 *
 * Security Features:
 * - Account Lockout: 5 failed attempts → 30 min lockout
 * - JWT Refresh Token Rotation: access=15m, refresh=7d
 * - Timing-safe OTP comparison (crypto.timingSafeEqual)
 */

const crypto = require('crypto');
const axios = require('axios');

const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const Scan = require('../models/Scan');
const CommunityNote = require('../models/CommunityNote');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const { generateToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const { buildIdentityLookup, normalizeMobileNumber } = require('../utils/identity');
const { resolveIpLocation } = require('../services/geoService');
const UAParser = require('ua-parser-js');
const { analyzeEmailRisk, normalizeEmail } = require('../services/emailRisk');
const Verification = require('../models/Verification');
const {
  requestEmailOtp,
  verifyEmailOtp,
  isVerifiedEmailTokenValid,
  consumeVerifiedEmailToken,
} = require('../services/emailVerification');
const {
  requestPasswordReset: requestPasswordResetFlow,
  verifyResetOtp: verifyResetOtpFlow,
  resetPassword: resetPasswordWithToken,
} = require('../services/passwordReset');
const { sendWelcomeEmail, sendVerificationCode } = require('../services/emailAlerts');
const logger = require('../utils/logger');

const IS_DEV = process.env.NODE_ENV !== 'production';

// ─── Account Lockout Config ───────────────────────────────────────────────────
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 30 * 60 * 1000; // 30 minutes

const devLog = (...args) => {
  if (IS_DEV) console.log('[auth][DEV]', ...args);
};

const escapeRegex = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// ─── Shared: Find user + run lockout/credential checks ───────────────────────
// Returns { user } on success, or sends response + returns null on failure.
const authenticateWithLockout = async (req, res, identity, password) => {
  const trimmed = String(identity).trim();
  const user = await User.findOne(buildIdentityLookup(trimmed))
    .select('+password +otp +otpExpiry +otpRequired +failedLoginAttempts +lockoutUntil +totpSecret');

  // Lockout check
  if (user && user.lockoutUntil && new Date() < new Date(user.lockoutUntil)) {
    const minutesLeft = Math.ceil((new Date(user.lockoutUntil) - new Date()) / 60000);
    await ActivityLog.create({
      userId: user._id,
      action: 'LOGIN_BLOCKED_LOCKOUT',
      metadata: { ip: req.ip, userAgent: req.get('User-Agent') },
    }).catch(() => {});
    logger.warn(`[AUDIT] Login blocked due to lockout: User ${user._id} IP ${req.ip}`);
    res.status(423).json({
      error: `Account locked. Try again in ${minutesLeft} minute(s).`,
      lockoutMinutesRemaining: minutesLeft,
    });
    return null;
  }

  // Credential check
  const isPasswordValid = user && await user.comparePassword(password);
  if (!user || !isPasswordValid) {
    if (user) {
      const newAttempts = (user.failedLoginAttempts || 0) + 1;
      const isNowLocked = newAttempts >= MAX_FAILED_ATTEMPTS;
      await User.findByIdAndUpdate(user._id, {
        failedLoginAttempts: newAttempts,
        ...(isNowLocked && { lockoutUntil: new Date(Date.now() + LOCKOUT_DURATION_MS) }),
      });
      if (isNowLocked) {
        await ActivityLog.create({
          userId: user._id,
          action: 'LOGIN_ACCOUNT_LOCKED',
          metadata: { ip: req.ip, attempts: newAttempts },
        }).catch(() => {});
        logger.warn(`[AUDIT] Account locked due to failed attempts: User ${user._id} IP ${req.ip}`);
        res.status(423).json({ error: 'Too many failed attempts. Account locked for 30 minutes.' });
        return null;
      }
      const attemptsLeft = MAX_FAILED_ATTEMPTS - newAttempts;
      logger.warn(`[AUDIT] Failed login attempt: User ${user._id} IP ${req.ip}. Attempts left: ${attemptsLeft}`);
      res.status(401).json({ error: `Invalid credentials. ${attemptsLeft} attempt(s) remaining before lockout.` });
      return null;
    }
    logger.warn(`[AUDIT] Failed login attempt: Unknown user identity '${identity}' IP ${req.ip}`);
    res.status(401).json({ error: 'Invalid credentials' });
    return null;
  }

  // Reset failed attempts on success
  if (user.failedLoginAttempts > 0 || user.lockoutUntil) {
    await User.findByIdAndUpdate(user._id, { failedLoginAttempts: 0, lockoutUntil: null });
  }

  return user;
};

// Helper to set HttpOnly Cookies (access + refresh)
const setAuthCookies = (res, accessToken, refreshToken) => {
  // Cross-domain: sameSite must be 'none' when frontend and backend are on different domains
  const cookieSameSite = IS_DEV ? 'strict' : 'none';
  // Access token — short lived (15 minutes)
  res.cookie('token', accessToken, {
    httpOnly: true,
    secure: true,
    sameSite: cookieSameSite,
    maxAge: 15 * 60 * 1000, // 15 minutes
  });
  // Refresh token — long lived (7 days), scoped to refresh endpoint only
  if (refreshToken) {
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: cookieSameSite,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/api/auth/refresh', // Only sent to this endpoint
    });
  }
};

// Legacy helper kept for any internal use
const setTokenCookie = (res, token) => {
  res.cookie('token', token, {
    httpOnly: true,
    secure: true,
    sameSite: IS_DEV ? 'strict' : 'none',
    maxAge: 15 * 60 * 1000,
  });
};

const isValidOtp = (submitted, real) => {
  try {
    // Timing-safe comparison to prevent timing attacks
    const a = Buffer.from(String(submitted).padStart(6, '0'));
    const b = Buffer.from(String(real).padStart(6, '0'));
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
};

const hashOtp = (otp) => crypto.createHash('sha256').update(String(otp).trim()).digest('hex');

const timingSafeEqualString = (left, right) => {
  const a = Buffer.from(String(left));
  const b = Buffer.from(String(right));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};

const isStoredOtpMatch = (submitted, stored) => {
  if (!submitted || !stored) return false;
  const storedValue = String(stored);
  if (/^[a-f0-9]{64}$/i.test(storedValue)) {
    return timingSafeEqualString(hashOtp(submitted), storedValue);
  }
  return timingSafeEqualString(String(submitted), storedValue);
};


// ─── #14: Password Breach Check (HaveIBeenPwned) ───────────────────────────
const checkPwnedPassword = async (password) => {
  try {
    const sha1 = crypto.createHash('sha1').update(password).digest('hex').toUpperCase();
    const prefix = sha1.slice(0, 5);
    const suffix = sha1.slice(5);
    const { data } = await axios.get(`https://api.pwnedpasswords.com/range/${prefix}`, { timeout: 3000 });
    return data.includes(suffix);
  } catch (err) {
    console.warn('[SECURITY] Could not check pwned passwords (network issue):', err.message);
    return false; // Fail open
  }
};

const checkPasswordBreach = async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) return res.status(400).json({ error: 'Password is required' });
    const isPwned = await checkPwnedPassword(password);
    res.json({ isPwned });
  } catch (err) {
    res.status(500).json({ error: 'Internal security engine error' });
  }
};

const signup = async (req, res, next) => {
  try {
    const { username, email, password, mobileNumber, fullName, age, country, gender, verificationToken } = req.body;
    const normalizedEmail = normalizeEmail(email);

    // ─── Verification Check ──────────────────────────────────────────────────
    if (!isVerifiedEmailTokenValid(normalizedEmail, verificationToken)) {
      return res.status(403).json({ error: 'Email verification required or token expired' });
    }

    const normalizedMobileNumber = normalizeMobileNumber(mobileNumber);

    const existing = await User.findOne({
      $or: [
        { email: normalizedEmail },
        { username },
        ...(normalizedMobileNumber ? [{ mobileNumber: normalizedMobileNumber }] : [])
      ]
    });

    if (existing) {
      let field = 'username';
      if (existing.email === normalizedEmail) field = 'email';
      if (normalizedMobileNumber && existing.mobileNumber === normalizedMobileNumber) field = 'mobile number';
      return res.status(409).json({ error: `This ${field} is already in use` });
    }

    // #14: Password breach check
    const isPwned = await checkPwnedPassword(password);
    if (isPwned) {
      return res.status(400).json({ error: 'This password has appeared in a data breach. Please choose a stronger password.' });
    }

    const user = await User.create({
      username,
      email: normalizedEmail,
      password,
      ...(normalizedMobileNumber && { mobileNumber: normalizedMobileNumber }),
      ...(fullName && { fullName }),
      ...(age && { age }),
      ...(country && { country }),
      ...(gender && { gender }),
    });

    // Consume the token so it cannot be reused
    consumeVerifiedEmailToken(normalizedEmail);

    // ─── #11: Session Fingerprinting (Anti-Hijacking) ─────────────────────────
    const nexusToken = req.headers['x-nexus-session-token'];
    let fingerprintHash = null;
    if (nexusToken) {
      fingerprintHash = crypto.createHash('sha256').update(nexusToken).digest('hex');
    }

    const tokenPayload = { id: user._id, role: user.role, fingerprintHash };
    const accessToken = generateToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);
    setAuthCookies(res, accessToken, refreshToken);

    console.log('\n======================================================');
    console.log(`🚀 [NEW ACCOUNT] User Registered: ${username} | ${normalizedEmail}`);
    console.log('======================================================\n');

    // Note: token is set in HttpOnly cookie — not returned in body to prevent XSS

    // Send welcome email with full registration details
    await sendWelcomeEmail({
      to: user.email,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      age: user.age,
      gender: user.gender,
      country: user.country,
    }).catch(console.error);

    return res.status(201).json({
      message: 'Account created successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (e) {
    next(e);
  }
};

const sendSignupOtp = async (req, res, next) => {
  try {
    const result = await requestEmailOtp(req.body.email);
    res.json({
      message: result.deliveryMode === 'email'
        ? 'OTP sent to your inbox.'
        : 'OTP generated in preview mode. Check the server console.',
      email: result.email,
      deliveryMode: result.deliveryMode,
      expiresInSeconds: result.expiresInSeconds,
      resendInSeconds: result.resendInSeconds,
    });
  } catch (e) {
    next(e);
  }
};

const confirmSignupOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    const result = await verifyEmailOtp(email, otp);
    res.json({
      message: 'Email verified successfully.',
      verificationToken: result.verificationToken,
    });
  } catch (e) {
    next(e);
  }
};


const checkEmailRisk = async (req, res, next) => {
  try {
    const analysis = await analyzeEmailRisk(req.body.email);
    res.json({ analysis });
  } catch (e) {
    next(e);
  }
};

const requestPasswordReset = async (req, res, next) => {
  try {
    const { identity } = req.body;
    const result = await requestPasswordResetFlow(identity);
    res.json({
      message: result.deliveryMode === 'preview'
        ? 'If an account exists, a reset code was generated in preview mode. Check the server console.'
        : `If an account exists, a reset code has been sent to ${result.destination || 'your email'}.`,
      ...(result.deliveryMode && { deliveryMode: result.deliveryMode }),
      expiresInMinutes: result.expiresInMinutes,
    });
  } catch (e) {
    next(e);
  }
};

const confirmResetOtp = async (req, res, next) => {
  try {
    const { identity, otp } = req.body;
    const resetToken = await verifyResetOtpFlow(identity, otp);
    res.json({
      message: 'OTP verified successfully.',
      resetToken,
    });
  } catch (e) {
    next(e);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    await resetPasswordWithToken({
      token: req.body.token,
      password: req.body.password,
    });

    res.json({
      message: 'Password reset successful. You can now log in with your new password.',
    });
  } catch (e) {
    next(e);
  }
};

const login = async (req, res, next) => {
  try {
    const { identity: normalizedIdentity, email, password, otp, clientIntel } = req.body;
    const identity = normalizedIdentity || email;
    if (!identity || !password) {
      return res.status(400).json({ error: 'Identity (Email/Mobile/Username) and Password are required' });
    }

    // Shared lockout + credential check
    const user = await authenticateWithLockout(req, res, identity, password);
    if (!user) return; // response already sent by helper

    // ─── 2FA TOTP CHECK (Architecture Concept D) ──────────────────────────────
    if (user.isTotpEnabled) {
      if (!otp) return res.status(401).json({ error: 'Authenticator code required', totpRequired: true });

      const isVerified = speakeasy.totp.verify({
        secret: user.totpSecret,
        encoding: 'base32',
        token: otp,
        window: 1 // Allow 30 seconds clock drift
      });

      if (!isVerified) {
        return res.status(401).json({ error: 'Invalid authenticator code.' });
      }
    }
    // ─── LEGACY EMAIL OTP CHECK (Fallback) ────────────────────────────────────
    else if (user.otpRequired) {
      if (!otp) return res.status(401).json({ error: 'OTP required', otpRequired: true });
      if (!IS_DEV && user.otpExpiry && new Date() > new Date(user.otpExpiry)) {
        return res.status(401).json({ error: 'OTP has expired.' });
      }
      if (!isStoredOtpMatch(otp, user.otp) && !isValidOtp(otp, user.otp)) {
        // SECURITY: Never reveal bypass codes in API responses, even in dev mode
        return res.status(401).json({
          error: 'Invalid OTP. Please check your email and try again.',
        });
      }
      user.otp = undefined;
      user.otpExpiry = undefined;
    }

    user.lastLoginAt = new Date();
    try {
      await user.save();
      const parser = new UAParser(req.get('User-Agent'));
      const device = parser.getDevice();
      const os = parser.getOS();
      const browser = parser.getBrowser();
      // ─── #12: Login Anomaly Detection ─────────────────────────────────────────
      // Check if this device is significantly different from recent logins
      const isKnownDevice = user.trustedDevices?.some(
        (d) => d.userAgent === req.get('User-Agent')
      );

      const ipLocation = await resolveIpLocation(req.ip).catch(() => ({}));

      if (user.trustedDevices && user.trustedDevices.length > 0 && !isKnownDevice) {
        console.warn(`[SECURITY] Anomaly detected: Login from new device for ${user.email}`);
        await ActivityLog.create({
          userId: user._id,
          action: 'LOGIN_ANOMALY',
          status: 'warning',
          metadata: { ip: req.ip, userAgent: req.get('User-Agent'), reason: 'Unknown device signature' }
        });
        // In a strict mode, we could force OTP here:
        // if (!otp) return res.status(401).json({ error: 'New device detected. OTP required.', requireOtp: true });
      }

      // Add to trusted devices
      user.trustedDevices = user.trustedDevices || [];
      user.trustedDevices.push({
        deviceId: crypto.randomBytes(8).toString('hex'),
        userAgent: req.get('User-Agent'),
        lastUsedAt: new Date(),
      });

      await ActivityLog.create({
        userId: user._id,
        action: 'LOGIN',
        metadata: {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          device: `${browser.name} on ${os.name}`,
          os: `${os.name} ${os.version}`,
          hardware: { vendor: device.vendor || 'Unknown Vendor', model: device.model || 'Generic PC/Mobile' },
          network: { isp: ipLocation.isp || 'Unknown ISP', type: clientIntel?.network?.type || 'Direct/Unknown' },
          location: {
            city: clientIntel?.location?.city || ipLocation.city,
            country: clientIntel?.location?.country || ipLocation.country,
            coordinates: clientIntel?.location ? [clientIntel.location.lon, clientIntel.location.lat] : ipLocation.coordinates,
          },
        },
      }).catch(() => {});
    } catch (saveError) {
      console.error('[AUTH ERROR] Failed to update login session:', saveError.message);
    }

    // ─── #11: Session Fingerprinting (Anti-Hijacking) ─────────────────────────
    const nexusToken = req.headers['x-nexus-session-token'];
    let fingerprintHash = null;
    if (nexusToken) {
      fingerprintHash = crypto.createHash('sha256').update(nexusToken).digest('hex');
    }

    const tokenPayload = { id: user._id, role: user.role, fingerprintHash };
    const accessToken = generateToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);
    setAuthCookies(res, accessToken, refreshToken);
    console.log(`\n🔑 [LOGIN SUCCESS] User Online: ${user.email}\n`);

    return res.json({
      message: 'Login successful',
      // SECURITY: OTP bypass code removed from API responses (was leaking DEV_BYPASS_OTP)
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
        emailAlerts: user.emailAlerts,
        alertThreshold: user.alertThreshold,
      },
    });
  } catch (e) {
    next(e);
  }
};

const googleLogin = async (req, res, next) => {
  try {
    const { access_token, clientIntel } = req.body;
    if (!access_token) return res.status(400).json({ error: 'Google access token is required' });

    // Verify token with Google
    const axios = require('axios');
    let googleUser;
    try {
      const response = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      googleUser = response.data;
    } catch (err) {
      logger.warn(`[AUDIT] Google Login failed to verify token: IP ${req.ip}`);
      return res.status(401).json({ error: 'Invalid Google token' });
    }

    if (!googleUser.email) {
      return res.status(400).json({ error: 'Google account must have an email' });
    }

    // Find or create user
    let user = await User.findOne({ email: googleUser.email.toLowerCase() });

    if (!user) {
      let baseUsername = googleUser.email.split('@')[0];
      let finalUsername = baseUsername;
      let counter = 1;
      
      // Ensure unique username (case-insensitive)
      while (await User.findOne({ username: { $regex: new RegExp(`^${finalUsername}$`, 'i') } })) {
        finalUsername = `${baseUsername}${counter}`;
        counter++;
      }

      try {
        user = await User.create({
          username: finalUsername,
          email: googleUser.email.toLowerCase(),
          password: crypto.randomBytes(16).toString('hex'), // Random password for OAuth users
          emailVerified: true,
          emailVerificationToken: null,
        });
      } catch (createErr) {
        // Fallback if race condition causes duplicate key anyway
        if (createErr.code === 11000) {
          finalUsername = `${baseUsername}${Math.floor(Math.random() * 100000)}`;
          user = await User.create({
            username: finalUsername,
            email: googleUser.email.toLowerCase(),
            password: crypto.randomBytes(16).toString('hex'),
            emailVerified: true,
            emailVerificationToken: null,
          });
        } else {
          throw createErr;
        }
      }
      logger.info(`[AUDIT] New user registered via Google: ${user._id}`);
    } else if (!user.emailVerified) {
      user.emailVerified = true;
      await user.save();
    }

    const nexusToken = req.headers['x-nexus-session-token'];
    let fingerprintHash = null;
    if (nexusToken) {
      fingerprintHash = crypto.createHash('sha256').update(nexusToken).digest('hex');
    }

    const tokenPayload = { id: user._id, role: user.role, fingerprintHash };
    const accessToken = generateToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);
    setAuthCookies(res, accessToken, refreshToken);

    logger.info(`[AUDIT] Successful Google login: User ${user._id} IP ${req.ip}`);

    return res.json({
      message: 'Google Login successful',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
      },
    });
  } catch (error) {
    next(error);
  }
};


const getProfile = async (req, res) => res.json({ user: req.user });

const updateProfile = async (req, res, next) => {
  try {
    const { username, email, mobileNumber, emailAlerts, alertThreshold } = req.body;
    const updates = {};
    const normalizedMobileNumber = normalizeMobileNumber(mobileNumber);
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Check for unique field conflicts if they are being updated
    if (username && username !== user.username) {
      const normalizedUsername = String(username).trim();
      if (!/^[a-zA-Z0-9_]{3,30}$/.test(normalizedUsername)) {
        return res.status(400).json({ error: 'Username must be 3-30 letters, numbers, or underscores' });
      }
      const existing = await User.findOne({ username: normalizedUsername, _id: { $ne: user._id } });
      if (existing) return res.status(409).json({ error: 'Username already taken' });
      user.username = normalizedUsername;
      updates.username = normalizedUsername;
    }

    if (email && normalizeEmail(email) !== user.email) {
      const normalizedEmail = normalizeEmail(email);
      const existing = await User.findOne({ email: normalizedEmail, _id: { $ne: user._id } });
      if (existing) return res.status(409).json({ error: 'Email already in use' });
      user.email = normalizedEmail;
      user.emailVerified = false;
      user.emailVerifiedAt = undefined;
      updates.email = normalizedEmail;
      updates.emailVerified = false;
    }

    if (normalizedMobileNumber && normalizedMobileNumber !== user.mobileNumber) {
      const existing = await User.findOne({ mobileNumber: normalizedMobileNumber, _id: { $ne: user._id } });
      if (existing) return res.status(409).json({ error: 'Mobile number already in use' });
      user.mobileNumber = normalizedMobileNumber;
      updates.mobileNumber = normalizedMobileNumber;
    }

    if (emailAlerts !== undefined) {
      user.emailAlerts = Boolean(emailAlerts);
      updates.emailAlerts = user.emailAlerts;
    }
    if (alertThreshold !== undefined) {
      const threshold = Number(alertThreshold);
      if (!Number.isFinite(threshold) || threshold < 0 || threshold > 100) {
        return res.status(400).json({ error: 'Alert threshold must be between 0 and 100' });
      }
      user.alertThreshold = threshold;
      updates.alertThreshold = threshold;
    }
    if (req.body.avatar !== undefined) {
      user.avatar = String(req.body.avatar || '');
      updates.avatar = '[updated]';
    }
    if (req.body.preferredNickname !== undefined) {
      user.preferredNickname = String(req.body.preferredNickname || '').trim().slice(0, 50);
      updates.preferredNickname = user.preferredNickname;
    }

    await user.save();

    // Log profile update activity
    try {
      await ActivityLog.create({
        userId: req.user._id,
        action: 'PROFILE_UPDATE',
        metadata: {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          details: `Updated: ${Object.keys(updates).join(', ')}`
        }
      });
    } catch (logError) {
      console.error('[LOG ERROR] Profile update log failed:', logError.message);
    }

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        mobileNumber: user.mobileNumber,
        role: user.role,
        emailAlerts: user.emailAlerts,
        alertThreshold: user.alertThreshold
      }
    });
  } catch (e) {
    next(e);
  }
};

const adminLogin = async (req, res, next) => {
  try {
    const { identity: normalizedIdentity, email, password } = req.body;
    const identity = normalizedIdentity || email;
    if (!identity || !password) {
      return res.status(400).json({ error: 'Identity (Email/Mobile/Username) and Password are required' });
    }

    // Shared lockout + credential check
    const user = await authenticateWithLockout(req, res, identity, password);
    if (!user) return; // response already sent by helper

    // CRITICAL SECURITY: admin role check
    if (user.role !== 'admin') {
      console.warn(`[SECURITY] Non-admin login attempt to Admin Portal: ${identity}`);
      return res.status(403).json({ error: 'ACCESS DENIED: Not recognized as Central Command Admin.' });
    }

    // STRICT EMAIL CHECK (Founder Request)
    if (user.email !== 'official.cybershieldx@gmail.com') {
      console.warn(`[SECURITY] Unauthorized email admin login attempt: ${user.email}`);
      return res.status(403).json({ error: 'ACCESS DENIED: Only the official CyberShield X email is authorized for admin access.' });
    }

    user.lastLoginAt = new Date();
    try {
      await user.save();
      const parser = new UAParser(req.get('User-Agent'));
      const device = parser.getDevice();
      const os = parser.getOS();
      const { clientIntel } = req.body;
      const ipLocation = await resolveIpLocation(req.ip).catch(() => ({}));

      // ─── #12: Login Anomaly Detection (Admin) ────────────────────────────────
      const isKnownDevice = user.trustedDevices?.some(
        (d) => d.userAgent === req.get('User-Agent')
      );
      if (user.trustedDevices && user.trustedDevices.length > 0 && !isKnownDevice) {
        console.warn(`[SECURITY] Anomaly: Admin login from new device!`);
      }
      user.trustedDevices = user.trustedDevices || [];
      user.trustedDevices.push({
        deviceId: crypto.randomBytes(8).toString('hex'),
        userAgent: req.get('User-Agent'),
        lastUsedAt: new Date(),
      });

      await ActivityLog.create({
        userId: user._id,
        action: 'LOGIN',
        metadata: {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          device: `Admin Console (${os.name})`,
          hardware: { vendor: device.vendor || 'Authorized Terminal', model: device.model || 'Nexus Workstation' },
          network: { isp: ipLocation.isp || 'Unknown ISP', type: clientIntel?.network?.type || 'Secure Node' },
          location: { city: ipLocation.city, country: ipLocation.country, coordinates: ipLocation.coordinates },
          details: 'Accessed Admin Terminal',
        },
      }).catch(() => {});
    } catch (saveError) {
      console.error('[AUTH ERROR] Admin lastLoginAt update failed:', saveError.message);
    }

    // ─── #11: Session Fingerprinting (Anti-Hijacking) ─────────────────────────
    const nexusToken = req.headers['x-nexus-session-token'];
    let fingerprintHash = null;
    if (nexusToken) {
      fingerprintHash = crypto.createHash('sha256').update(nexusToken).digest('hex');
    }

    const tokenPayload = { id: user._id, role: user.role, fingerprintHash };
    const accessToken = generateToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);
    setAuthCookies(res, accessToken, refreshToken);
    console.log(`\n🛡️ [ADMIN ACCESS] Command Level Auth: ${user.email}\n`);

    return res.json({
      message: 'Central Command Access Granted',
      user: { id: user._id, username: user.username, email: user.email, role: user.role },
    });
  } catch (e) {
    next(e);
  }
};

const logout = async (req, res, next) => {
  try {
    const userId = req.user._id;

    await User.findByIdAndUpdate(userId, { lastLogoutAt: new Date() });

    // Safe IP lookup — don't fail logout if geo service is down
    const location = await resolveIpLocation(req.ip).catch(() => ({ city: 'Unknown', country: 'Unknown' }));
    await ActivityLog.create({
      userId,
      action: 'LOGOUT',
      metadata: { ip: req.ip, userAgent: req.get('User-Agent'), location }
    }).catch(() => {});

    res.clearCookie('token');
    res.clearCookie('refreshToken', { path: '/api/auth/refresh' });
    res.json({ message: 'Session terminated successfully' });
  } catch (e) {
    next(e);
  }
};

// ─── REFRESH TOKEN ENDPOINT ────────────────────────────────────────────────────
// Called silently by frontend before access token expires
const refreshAccessToken = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ error: 'No refresh token provided. Please log in again.' });
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch (err) {
      res.clearCookie('token');
      res.clearCookie('refreshToken', { path: '/api/auth/refresh' });
      return res.status(401).json({ error: 'Refresh token expired or invalid. Please log in again.' });
    }

    // Verify user still exists and is not banned
    const user = await User.findById(decoded.id).select('_id role isBanned');
    if (!user || user.isBanned) {
      res.clearCookie('token');
      res.clearCookie('refreshToken', { path: '/api/auth/refresh' });
      return res.status(401).json({ error: 'Account unavailable. Please contact support.' });
    }

    // Issue new access token (rotate)
    const tokenPayload = { id: user._id, role: user.role };
    const newAccessToken = generateToken(tokenPayload);
    const newRefreshToken = generateRefreshToken(tokenPayload); // Rotate refresh token too
    setAuthCookies(res, newAccessToken, newRefreshToken);

    res.json({
      message: 'Token refreshed successfully',
      token: newAccessToken,
    });
  } catch (e) {
    next(e);
  }
};

const devPromote = async (req, res, next) => {
  try {
    if (!IS_DEV) return res.status(403).json({ error: 'Only allowed in DEV mode' });
    const user = await User.findByIdAndUpdate(req.user._id, { role: 'admin' }, { new: true });

    // Issue new tokens to include admin role
    const tokenPayload = { id: user._id, role: user.role };
    const accessToken = generateToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);
    setAuthCookies(res, accessToken, refreshToken);
    res.json({ message: 'Upgraded to Admin Privileges successfully', token: accessToken, user });
  } catch (e) {
    next(e);
  }
};

const logActivityClient = async (req, res, next) => {
  try {
    const { action, status, metadata } = req.body;
    if (!action) return res.status(400).json({ error: 'Action is required' });

    await ActivityLog.create({
      userId: req.user._id,
      action: action.toUpperCase(),
      status: status || 'success',
      metadata: {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        ...metadata,
      }
    });

    res.json({ success: true });
  } catch (e) {
    next(e);
  }
};

const getActivityLogs = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      ActivityLog.find({ userId: req.user._id })
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit),
      ActivityLog.countDocuments({ userId: req.user._id }),
    ]);

    res.json({
      logs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
      },
    });
  } catch (e) {
    next(e);
  }
};

// ══════════════════════════════════════════════
// 2FA MANAGEMENT
// ══════════════════════════════════════════════

// ─── Concept D: TOTP-Based 2FA ──────────────────────────────────────────────
const enable2FA = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const secret = speakeasy.generateSecret({
      name: `CyberShield X (${user.email})`
    });

    user.totpSecret = secret.base32;
    await user.save();

    const qrCode = await QRCode.toDataURL(secret.otpauth_url);

    res.json({
      secret: secret.base32,
      qrCode,
      message: 'Scan the QR code with Google Authenticator or Authy.',
    });
  } catch (e) {
    next(e);
  }
};

const confirm2FA = async (req, res, next) => {
  try {
    const { otp } = req.body;
    const user = await User.findById(req.user._id).select('+totpSecret');

    if (!user.totpSecret) {
      return res.status(400).json({ error: '2FA not initiated. Call enable2FA first.' });
    }

    const isVerified = speakeasy.totp.verify({
      secret: user.totpSecret,
      encoding: 'base32',
      token: otp,
      window: 1 // 30s clock drift
    });

    if (!isVerified) return res.status(400).json({ error: 'Invalid or expired Authenticator code.' });

    // Enable 2FA on the account
    user.isTotpEnabled = true;
    user.twoFactorEnabled = true;
    user.otpRequired = false; // Disable legacy email OTP
    await user.save();

    await ActivityLog.create({
      userId: req.user._id,
      action: '2FA_ENABLED',
      metadata: { ip: req.ip, userAgent: req.get('User-Agent'), method: 'TOTP' },
    });

    res.json({ message: '2FA has been successfully enabled on your account.', twoFactorEnabled: true });
  } catch (e) {
    next(e);
  }
};

const disable2FA = async (req, res, next) => {
  try {
    // Only allow disabling if they verify a final TOTP code OR we bypass if they lost device (recovery flow usually)
    // For now, allow direct disable when authenticated
    await User.findByIdAndUpdate(req.user._id, {
      twoFactorEnabled: false,
      isTotpEnabled: false,
      totpSecret: null,
      otpRequired: false,
      otp: null,
      otpExpiry: null,
    });

    await ActivityLog.create({
      userId: req.user._id,
      action: '2FA_DISABLED',
      metadata: { ip: req.ip, userAgent: req.get('User-Agent') },
    });

    res.json({ message: '2FA has been disabled.', twoFactorEnabled: false });
  } catch (e) {
    next(e);
  }
};

// Sends a login-time OTP (called when 2FA user attempts login)
const sendLoginOtp = async (req, res, next) => {
  try {
    const identity = req.body.identity || req.body.email;
    if (!identity) return res.status(400).json({ error: 'Email, mobile number, or username required.' });

    const user = await User.findOne(buildIdentityLookup(identity)).select('+otp +otpExpiry +otpRequired +totpSecret');
    if (!user || (!user.twoFactorEnabled && !user.otpRequired)) {
      return res.status(400).json({ error: '2FA is not enabled for this account.' });
    }
    if (user.isTotpEnabled) {
      return res.status(400).json({ error: 'Use your authenticator app code for this account.' });
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    user.otp = hashOtp(otp);
    user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    user.otpRequired = true;
    await user.save({ validateBeforeSave: false });

    const result = await sendVerificationCode({
      to: user.email,
      code: otp,
      expiresInMinutes: 10,
    });
    res.json({
      message: 'Login OTP sent to your registered email.',
      deliveryMode: result.mode,
    });
  } catch (e) {
    next(e);
  }
};

const deleteAccount = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Deep Purge: Delete all associated data (including Vault assets for GDPR compliance)
    const VaultAsset = require('../models/VaultAsset');
    await Promise.all([
      Scan.deleteMany({ userId }),
      ActivityLog.deleteMany({ userId }),
      CommunityNote.deleteMany({ authorId: userId }),
      VaultAsset.deleteMany({ userId }),
      User.findByIdAndDelete(userId),
    ]);

    console.log(`\n[DATA PURGE] Permanently deleted user and all associated data for: ${userId}`);

    // Clear BOTH cookies after account deletion
    res.clearCookie('token');
    res.clearCookie('refreshToken', { path: '/api/auth/refresh' });
    res.json({ message: 'Account and associated data permanently purged.' });
  } catch (e) {
    next(e);
  }
};

// ─── SSRF-Safe Webhook URL Validation ──────────────────────────────────────────
const BLOCKED_WEBHOOK_HOSTS = new Set([
  'localhost', '127.0.0.1', '0.0.0.0', '::1', '[::1]',
  '169.254.169.254',         // AWS/GCP metadata
  'metadata.google.internal', // GCP metadata
  'metadata.internal',       // Generic cloud metadata
]);
const BLOCKED_IP_PREFIXES = ['10.', '172.16.', '172.17.', '172.18.', '172.19.',
  '172.20.', '172.21.', '172.22.', '172.23.', '172.24.', '172.25.', '172.26.',
  '172.27.', '172.28.', '172.29.', '172.30.', '172.31.', '192.168.', '169.254.', '0.'];

function isSafeWebhookUrl(urlString) {
  try {
    const url = new URL(urlString);
    // Force HTTPS only
    if (url.protocol !== 'https:') return { safe: false, reason: 'Only HTTPS webhook URLs are allowed.' };
    // Block known internal/metadata hosts
    if (BLOCKED_WEBHOOK_HOSTS.has(url.hostname)) return { safe: false, reason: 'Internal/reserved hosts are not allowed.' };
    // Block private IP ranges
    if (BLOCKED_IP_PREFIXES.some(prefix => url.hostname.startsWith(prefix))) return { safe: false, reason: 'Private IP ranges are not allowed.' };
    // Block IP-only hostnames (additional safety)
    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(url.hostname)) return { safe: false, reason: 'Raw IP addresses are not allowed. Use a domain name.' };
    return { safe: true };
  } catch {
    return { safe: false, reason: 'Invalid URL format.' };
  }
}

// ─── Update Webhook URL ────────────────────────────────────────────────────────
async function updateWebhook(req, res) {
  try {
    const { webhookUrl, test } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (webhookUrl !== undefined) {
      if (webhookUrl) {
        // ─── SSRF PROTECTION: Validate webhook URL before saving ───────────
        const validation = isSafeWebhookUrl(webhookUrl);
        if (!validation.safe) {
          return res.status(400).json({ error: `Webhook rejected: ${validation.reason}` });
        }
      }
      user.webhookUrl = webhookUrl;
      await user.save();
    }

    // Test ping (only HTTPS allowed via the validation above)
    if (test && user.webhookUrl) {
      // Re-validate before making the request (defense in depth)
      const recheck = isSafeWebhookUrl(user.webhookUrl);
      if (!recheck.safe) {
        return res.status(400).json({ error: `Webhook test blocked: ${recheck.reason}` });
      }

      const payload = JSON.stringify({
        source: 'CyberShield X',
        event: 'webhook_test',
        message: '✅ Webhook connected! You will receive threat alerts here.',
        timestamp: new Date().toISOString(),
      });
      const url = new URL(user.webhookUrl);
      const https = require('https'); // Only HTTPS — HTTP blocked by validation
      await new Promise((resolve, reject) => {
        const httpReq = https.request(
          {
            hostname: url.hostname,
            port: url.port || 443,
            path: url.pathname + url.search,
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) },
          },
          (r) => { r.resume(); resolve(r.statusCode); }
        );
        httpReq.on('error', reject);
        httpReq.setTimeout(5000, () => { httpReq.destroy(); reject(new Error('timeout')); });
        httpReq.write(payload);
        httpReq.end();
      });
      return res.json({ success: true, message: 'Test ping sent successfully!' });
    }

    res.json({ success: true, webhookUrl: user.webhookUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

const checkUsername = async (req, res, next) => {
  try {
    const { username } = req.body;
    if (!username) return res.status(400).json({ error: 'Username is required' });
    const normalizedUsername = String(username).trim().toLowerCase();
    
    if (!/^[a-z0-9_]{3,30}$/.test(normalizedUsername)) {
      return res.status(400).json({ error: 'Username must be 3-30 letters, numbers, or underscores' });
    }

    const existingUser = await User.findOne({ username: new RegExp(`^${escapeRegex(normalizedUsername)}$`, 'i') });

    if (existingUser) {
      // Generate Suggestions
      const suggestions = [];
      const suffixes = [Math.floor(Math.random() * 999), 'nexus', 'shield', 'x', 'agent', Math.floor(Math.random() * 100)];
      
      for (const suffix of suffixes) {
        if (suggestions.length >= 3) break;
        const candidate = `${normalizedUsername}_${suffix}`;
        const isTaken = await User.exists({ username: new RegExp(`^${escapeRegex(candidate)}$`, 'i') });
        if (!isTaken) suggestions.push(candidate);
      }

      return res.json({ available: false, suggestions });
    }

    res.json({ available: true });
  } catch (err) {
    next(err);
  }
};

const getSessions = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('trustedDevices');
    res.json({ sessions: user.trustedDevices || [] });
  } catch (e) {
    next(e);
  }
};

const revokeSession = async (req, res, next) => {
  try {
    const { deviceId } = req.body;
    if (!deviceId) return res.status(400).json({ error: 'Device ID required' });

    const user = await User.findById(req.user._id);
    user.trustedDevices = user.trustedDevices.filter(d => d.deviceId !== deviceId);
    await user.save();

    await ActivityLog.create({
      userId: req.user._id,
      action: 'SESSION_REVOKED',
      metadata: { deviceId, ip: req.ip, userAgent: req.get('User-Agent') }
    });

    res.json({ message: 'Session successfully purged from Nexus Core.', sessions: user.trustedDevices });
  } catch (e) {
    next(e);
  }
};

const updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new passwords are required' });
    }

    const user = await User.findById(req.user._id).select('+password');
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ error: 'Identity verification failed: Incorrect current password' });
    }

    // Security check: Pwned password
    const isPwned = await checkPwnedPassword(newPassword);
    if (isPwned) {
      return res.status(400).json({ error: 'The new password has appeared in a known data breach. Select a more robust key.' });
    }

    user.password = newPassword;
    await user.save();

    await ActivityLog.create({
      userId: req.user._id,
      action: 'PASSWORD_ROTATED',
      metadata: { ip: req.ip, userAgent: req.get('User-Agent') }
    });

    res.json({ message: 'Security key successfully rotated.' });
  } catch (e) {
    next(e);
  }
};

module.exports = {
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
  devPromote,
  getActivityLogs,
  logActivityClient,
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
};
