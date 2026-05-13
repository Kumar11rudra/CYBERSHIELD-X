const mongoose = require('mongoose');

const verificationSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  otp: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['email_signup', 'phone_signup'],
    default: 'email_signup'
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: '10m' } // Automatically delete after 10 minutes
  },
  verified: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

verificationSchema.index({ email: 1, type: 1 }, { unique: true });

const Verification = mongoose.model('Verification', verificationSchema);
module.exports = Verification;
