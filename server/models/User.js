const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
        message: 'Invalid email format',
      },
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
    },
    mobileNumber: {
      type: String,
      trim: true,
    },
    emailHash: {
      type: String,
      index: true,
    },
    mobileHash: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'active', 'suspended'],
      default: 'active',
      index: true,
    },
    fullName: {
      type: String,
      trim: true,
    },
    age: {
      type: Number,
      min: 13,
    },
    country: {
      type: String,
      trim: true,
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other'],
      default: 'Other',
    },
    preferredNickname: {
      type: String,
      trim: true,
      default: '',
    },
    role: {
      type: String,
      enum: ['user', 'admin', 'analyst'],
      default: 'user',
    },
    isDeleted: { type: Boolean, default: false },
    isBanned: { type: Boolean, default: false },
    banReason: { type: String, default: null },
    bannedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    bannedAt: { type: Date, default: null },
    emailAlerts: {
      type: Boolean,
      default: true,
    },
    alertThreshold: {
      type: Number,
      default: 75, // Send alert if score >= this
      min: 0,
      max: 100,
    },
    webhookUrl: {
      type: String,
      trim: true,
      default: '',
      validate: {
        validator: (v) => !v || v.startsWith('http'),
        message: 'Webhook URL must start with http/https',
      },
    },
    avatar: {
      type: String,
      default: '', // base64 or external URL
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerifiedAt: Date,
    passwordResetTokenHash: {
      type: String,
      select: false,
    },
    passwordResetExpiresAt: {
      type: Date,
      select: false,
    },
    totalScans: {
      type: Number,
      default: 0,
    },
    lastLoginAt: Date,
    lastLogoutAt: Date,
    trustedDevices: {
      type: [
        {
          deviceId: String,
          lastUsedAt: Date,
          userAgent: String,
        },
      ],
      validate: {
        validator: (arr) => arr.length <= 10,
        message: 'Max 10 trusted devices allowed',
      },
    },

    // Two-Factor Authentication (2FA)
    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },
    isTotpEnabled: {
      type: Boolean,
      default: false,
    },
    totpSecret: {
      type: String,
      select: false,
    },
    otp: {
      type: String,
      select: false,
    },
    otpExpiry: {
      type: Date,
      select: false,
    },
    otpRequired: {
      type: Boolean,
      default: false,
      select: false,
    },
    blockedIPs: [{
      type: String,
      validate: {
        validator: (v) => /^(\d{1,3}\.){3}\d{1,3}$/.test(v) || /^[0-9a-f:]+$/i.test(v),
        message: 'Invalid IP address format',
      },
    }],

    // ─── Account Lockout (Brute-force protection) ─────────────────────────
    failedLoginAttempts: {
      type: Number,
      default: 0,
      select: false, // Hidden from normal queries
    },
    lockoutUntil: {
      type: Date,
      default: null,
      select: false, // Hidden from normal queries
    },

  },
  {
    timestamps: true,
  }
);

// Hash password + trim trustedDevices before save
userSchema.pre('save', async function (next) {
  // Hash password only when changed
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
  }

  // Generate Search Hashes for encrypted fields
  if (this.isModified('email') && this.email) {
    this.emailHash = crypto.createHash('sha256').update(this.email.toLowerCase().trim()).digest('hex');
  }
  if (this.isModified('mobileNumber') && this.mobileNumber) {
    const digits = String(this.mobileNumber).replace(/\D/g, '');
    if (digits) {
      this.mobileHash = crypto.createHash('sha256').update(digits).digest('hex');
    }
  }

  // Keep only the 10 most recent trusted devices
  if (this.trustedDevices && this.trustedDevices.length > 10) {
    this.trustedDevices = this.trustedDevices
      .sort((a, b) => new Date(b.lastUsedAt) - new Date(a.lastUsedAt))
      .slice(0, 10);
  }
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

// ─── Field-Level Encryption (Node.js 24-compatible) ──────────────────────────
// Encrypts email and mobileNumber at rest using AES-256-CBC (createCipheriv).
// Replaces the deprecated mongoose-field-encryption plugin which used
// crypto.createDecipher — removed in Node.js v22+.
// All DB lookups use pre-computed SHA-256 hashes (emailHash, mobileHash),
// so non-deterministic IV encryption is safe here.
const { encryptField, decryptField } = require('../utils/userFieldEncryption');

const _encSecret = process.env.VAULT_ENCRYPTION_KEY
  || (process.env.NODE_ENV === 'production' ? null : 'default_fallback_encryption_key_32_bytes_long');

if (!_encSecret && process.env.NODE_ENV === 'production') {
  throw new Error('VAULT_ENCRYPTION_KEY is required for encrypted User fields in production.');
}

// Encrypt sensitive PII before saving to MongoDB
userSchema.pre('save', function (next) {
  if (!_encSecret) return next();
  if (this.isModified('email') && this.email && !this.email.startsWith('enc2:')) {
    this.email = encryptField(this.email, _encSecret);
  }
  if (this.isModified('mobileNumber') && this.mobileNumber && !this.mobileNumber.startsWith('enc2:')) {
    this.mobileNumber = encryptField(this.mobileNumber, _encSecret);
  }
  next();
});

// Decrypt PII fields after loading from MongoDB
userSchema.post('init', function () {
  if (!_encSecret) return;
  if (this.email) {
    const dec = decryptField(this.email, _encSecret);
    if (dec !== null) this.email = dec;
  }
  if (this.mobileNumber) {
    const dec = decryptField(this.mobileNumber, _encSecret);
    if (dec !== null) this.mobileNumber = dec;
  }
});

const User = mongoose.model('User', userSchema);

module.exports = User;
