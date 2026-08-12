const mongoose = require('mongoose');

const verificationSchema = new mongoose.Schema({
  email: {
    type: String,
    lowercase: true,
    trim: true,
    required: false
  },
  otp: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['email_signup', 'phone_signup', 'whatsapp_signup', 'password_reset'],
    default: 'email_signup'
  },
  purpose: {
    type: String,
    enum: ['email_signup', 'phone_signup', 'whatsapp_signup', 'password_reset'],
    default: 'email_signup'
  },
  destination: {
    type: String,
    lowercase: true,
    trim: true
  },
  channel: {
    type: String,
    enum: ['email', 'sms', 'whatsapp'],
    default: 'email'
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: '10m' } // Automatically delete after 10 minutes
  },
  verified: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['pending', 'verified', 'expired', 'consumed'],
    default: 'pending'
  },
  verificationToken: {
    type: String,
    default: null
  },
  attemptsRemaining: {
    type: Number,
    default: 5
  },
  cooldownUntil: {
    type: Date,
    default: null
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, { timestamps: true });

// Pre-save to populate destination and purpose automatically
verificationSchema.pre('save', function (next) {
  if (this.email && !this.destination) {
    this.destination = this.email;
  }
  if (this.type && !this.purpose) {
    this.purpose = this.type;
  }
  if (this.verified) {
    this.status = 'verified';
  }
  next();
});

verificationSchema.index({ destination: 1, type: 1 }, { unique: true, sparse: true });

const Verification = mongoose.model('Verification', verificationSchema);
module.exports = Verification;
