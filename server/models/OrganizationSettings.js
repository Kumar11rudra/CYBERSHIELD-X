const mongoose = require('mongoose');

const organizationSettingsSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      unique: true,
      index: true,
    },
    defaultRiskThreshold: {
      type: Number,
      default: 75,
      min: 0,
      max: 100,
    },
    alertChannels: {
      type: [String],
      default: ['email', 'dashboard'],
    },
    retentionDays: {
      type: Number,
      default: 90,
    },
    aiModel: {
      type: String,
      default: 'llama3',
    },
    branding: {
      type: mongoose.Schema.Types.Mixed,
      default: { logo: '', primaryColor: '#00d4ff' },
    },
    timezone: {
      type: String,
      default: 'UTC',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('OrganizationSettings', organizationSettingsSchema);
