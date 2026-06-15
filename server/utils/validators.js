const { body, validationResult } = require('express-validator');
const net = require('net');

const HASH_PATTERNS = {
  md5: /^[a-f0-9]{32}$/i,
  sha1: /^[a-f0-9]{40}$/i,
  sha256: /^[a-f0-9]{64}$/i,
};

const parseURL = (input) => {
  const trimmed = input.trim();
  const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    const url = new URL(candidate);
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    if (!url.hostname.includes('.')) return null;
    return url;
  } catch {
    return null;
  }
};

const isValidURL = (input) => Boolean(parseURL(input));

const isValidIP = (input) => {
  return net.isIPv4(input) || net.isIPv6(input);
};

const isValidHash = (input) => Object.values(HASH_PATTERNS).some((pattern) => pattern.test(input.trim()));

const getHashType = (input) => {
  const trimmed = input.trim();
  return Object.entries(HASH_PATTERNS).find(([, pattern]) => pattern.test(trimmed))?.[0] || null;
};

const isDevSignupBypassEnabled = () => (
  process.env.NODE_ENV !== 'production'
  && process.env.ALLOW_DEV_SIGNUP_WITHOUT_OTP === 'true'
);

const normalizeIdentityField = body('identity').custom((value, { req }) => {
  const rawIdentity = value ?? req.body.email;

  if (typeof rawIdentity !== 'string' && typeof rawIdentity !== 'number') {
    throw new Error('Email, mobile number, or username is required');
  }

  const identity = String(rawIdentity).trim();
  if (!identity) {
    throw new Error('Email, mobile number, or username is required');
  }

  if (identity.length > 254) {
    throw new Error('Identity must be 254 characters or fewer');
  }

  req.body.identity = identity;
  req.body.email = identity;
  return true;
});

const isValidDomain = (input) => {
  const trimmed = input.trim().toLowerCase();
  if (!trimmed || trimmed.includes(' ') || trimmed.includes('/') || trimmed.includes('@')) return false;
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return false;
  if (isValidIP(trimmed)) return false;

  return /^(?=.{1,253}$)(?!-)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i.test(trimmed);
};

const normalizeScanTarget = (input) => {
  const trimmed = input.trim();
  if (isValidIP(trimmed)) return trimmed;
  if (isValidHash(trimmed)) return trimmed.toLowerCase();
  if (isValidDomain(trimmed)) return trimmed.toLowerCase();

  const url = parseURL(trimmed);
  if (!url) return null;

  url.hostname = url.hostname.toLowerCase();
  return url.toString();
};

const detectInputType = (input) => {
  const normalized = normalizeScanTarget(input);
  if (!normalized) return null;
  if (isValidIP(normalized)) return 'ip';
  if (isValidHash(normalized)) return 'hash';
  if (isValidDomain(normalized)) return 'domain';
  if (isValidURL(normalized)) return 'url';
  return null;
};

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

const scanValidationRules = [
  body('target')
    .trim()
    .notEmpty()
    .withMessage('Target IOC is required')
    .isLength({ min: 3, max: 2048 })
    .withMessage('Target must be between 3 and 2048 characters')
    .custom((value) => {
      if (!normalizeScanTarget(value)) {
        throw new Error('Enter a valid URL, domain, IP address, or MD5/SHA hash');
      }
      return true;
    }),
];

const authValidationRules = {
  signup: [
    body('username')
      .trim()
      .isLength({ min: 3, max: 30 })
      .withMessage('Username must be 3-30 characters')
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('Username can only contain letters, numbers, underscores'),
    body('email')
      .trim()
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email required'),

    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
      .withMessage('Password must contain uppercase, lowercase, a number, and a special character (@$!%*?&)'),
    body('fullName')
      .trim()
      .notEmpty()
      .withMessage('Full Name is required')
      .isLength({ max: 100 }),
    body('mobileNumber')
      .optional({ values: 'falsy' })
      .trim(),
    body('gender')
      .trim()
      .notEmpty()
      .withMessage('Gender is required')
      .isIn(['Male', 'Female', 'Other'])
      .withMessage('Select a valid gender'),
    body('age')
      .notEmpty()
      .withMessage('Age is required')
      .isInt({ min: 13, max: 120 })
      .withMessage('Age must be between 13 and 120'),
    body('country')
      .trim()
      .notEmpty()
      .withMessage('Country is required')
      .isLength({ max: 100 }),
    body('verificationToken')
      .custom((value, { req }) => {
        if (isDevSignupBypassEnabled()) return true;
        if (!value || !value.trim()) {
          throw new Error('Email verification token is required');
        }
        return true;
      }),
  ],
  login: [
    normalizeIdentityField,
    body('password').notEmpty().withMessage('Password required'),
  ],
  emailCheck: [
    body('email')
      .trim()
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email required'),
  ],
  requestOtp: [
    body('email')
      .trim()
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email required'),
  ],
  requestPasswordReset: [
    normalizeIdentityField,
  ],
  verifyResetOtp: [
    normalizeIdentityField,
    body('otp')
      .trim()
      .isLength({ min: 6, max: 6 })
      .withMessage('Enter the 6-digit OTP')
      .isNumeric()
      .withMessage('OTP must contain only numbers'),
  ],
  verifyOtp: [
    body('email')
      .trim()
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email required'),
    body('otp')
      .trim()
      .isLength({ min: 6, max: 6 })
      .withMessage('Enter the 6-digit OTP')
      .isNumeric()
      .withMessage('OTP must contain only numbers'),
  ],
  resetPassword: [
    body('token')
      .trim()
      .notEmpty()
      .withMessage('Reset token is required'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
      .withMessage('Password must contain uppercase, lowercase, a number, and a special character (@$!%*?&)'),
  ],
};

module.exports = {
  isValidURL,
  isValidIP,
  isValidDomain,
  isValidHash,
  getHashType,
  normalizeScanTarget,
  detectInputType,
  handleValidationErrors,
  scanValidationRules,
  authValidationRules,
};
