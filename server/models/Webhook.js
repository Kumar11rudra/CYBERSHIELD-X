const mongoose = require('mongoose');

const webhookSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Webhook name is required'],
      trim: true,
    },
    url: {
      type: String,
      required: [true, 'Webhook URL is required'],
      trim: true,
      validate: {
        validator: (v) => /^https?:\/\//i.test(v),
        message: 'Webhook URL must start with http:// or https://',
      },
    },
    type: {
      type: String,
      enum: ['Slack', 'Teams', 'Generic'],
      default: 'Generic',
      required: true,
    },
    events: {
      type: [String],
      default: ['critical_ioc', 'critical_vuln', 'ssl_expired', 'high_risk_correlation'],
    },
    secret: {
      type: String,
      required: true,
    },
    signatureEnabled: {
      type: Boolean,
      default: true,
      required: true,
    },
    lastSuccess: Date,
    lastFailure: Date,
    active: {
      type: Boolean,
      default: true,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Webhook', webhookSchema);
