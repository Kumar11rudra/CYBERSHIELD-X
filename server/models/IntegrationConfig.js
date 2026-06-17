const mongoose = require('mongoose');

/**
 * IntegrationConfig — stores per-org external integration credentials.
 * Secrets (tokens, API keys) are stored here but NEVER returned in API responses.
 */
const integrationConfigSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['Jira', 'GitHub', 'Slack', 'Teams', 'PagerDuty'],
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Integration name is required'],
      trim: true,
      maxlength: 100,
    },
    // config holds integration-specific credentials and settings.
    // Shape per type:
    // Jira: { baseUrl, email, apiToken, projectKey, issueType }
    // GitHub: { owner, repo, token, labels }
    // Slack: { webhookUrl }
    // Teams: { webhookUrl }
    // PagerDuty: { routingKey, serviceId }
    config: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      default: {},
    },
    active: {
      type: Boolean,
      default: true,
    },
    lastTestedAt: Date,
    lastTestStatus: {
      type: String,
      enum: ['success', 'failed', 'pending'],
      default: 'pending',
    },
    lastError: {
      type: String,
      default: '',
    },
    lastSuccessAt: Date,
    lastFailureAt: Date,
    healthStatus: {
      type: String,
      enum: ['Healthy', 'Warning', 'Failed', 'Unknown'],
      default: 'Unknown',
    },
  },
  {
    timestamps: true,
  }
);

integrationConfigSchema.index({ organizationId: 1, type: 1 });

// Mask secrets when converting to JSON (never send tokens to client)
integrationConfigSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  if (obj.config) {
    const masked = { ...obj.config };
    ['apiToken', 'token', 'webhookUrl', 'routingKey', 'secret'].forEach(key => {
      if (masked[key]) masked[key] = '••••••••';
    });
    obj.config = masked;
  }
  return obj;
};

module.exports = mongoose.model('IntegrationConfig', integrationConfigSchema);
