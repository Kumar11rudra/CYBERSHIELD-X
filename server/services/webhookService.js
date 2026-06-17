const axios = require('axios');
const crypto = require('crypto');
const Webhook = require('../models/Webhook');
const User = require('../models/User');
const logger = require('../utils/logger');

// Maps alert severity to colors (Slack / Teams attachments)
const SEVERITY_COLORS = {
  critical: '#ff0033', // Red
  high: '#ff9900',     // Orange
  warning: '#ffcc00',  // Yellow
  info: '#00d4ff',     // Cyan
};

const sendSlackPayload = async (webhook, payload) => {
  const color = SEVERITY_COLORS[payload.severity] || '#00d4ff';
  const slackBody = {
    text: `🛡️ *CyberShield X Alert Notification* - *${payload.severity.toUpperCase()}*`,
    attachments: [
      {
        color,
        fields: [
          { title: 'Title', value: payload.title, short: false },
          { title: 'Message', value: payload.message, short: false },
          { title: 'Category', value: payload.category, short: true },
          { title: 'Source', value: payload.source, short: true },
        ],
        ts: Math.floor(Date.now() / 1000),
      },
    ],
  };
  
  await axios.post(webhook.url, slackBody);
};

const sendTeamsPayload = async (webhook, payload) => {
  const color = SEVERITY_COLORS[payload.severity] || '#00d4ff';
  const teamsBody = {
    '@type': 'MessageCard',
    '@context': 'http://schema.org/extensions',
    themeColor: color.replace('#', ''),
    summary: payload.title,
    sections: [
      {
        activityTitle: `🛡️ CyberShield X Alert Sentinel`,
        activitySubtitle: `Severity: ${payload.severity.toUpperCase()}`,
        facts: [
          { name: 'Category', value: payload.category },
          { name: 'Source', value: payload.source },
          { name: 'Triggered At', value: new Date().toISOString() },
        ],
        text: `**${payload.title}**\n\n${payload.message}`,
      },
    ],
  };

  await axios.post(webhook.url, teamsBody);
};

const sendGenericPayload = async (webhook, payload) => {
  const body = JSON.stringify({
    event: `${payload.category}_alert`,
    timestamp: new Date(),
    data: payload,
  });

  const headers = {
    'Content-Type': 'application/json',
  };

  if (webhook.signatureEnabled && webhook.secret) {
    const signature = crypto
      .createHmac('sha256', webhook.secret)
      .update(body)
      .digest('hex');
    headers['X-CyberShield-Signature'] = signature;
  }

  await axios.post(webhook.url, body, { headers });
};

const triggerWebhookForNotification = async (doc) => {
  try {
    const { organizationId, userId, severity, category, title, message, source } = doc;
    
    // Only trigger for warning, high, and critical alerts
    if (severity === 'info') return;

    const eventMap = {
      ioc: severity === 'critical' ? 'critical_ioc' : 'high_risk_correlation',
      vulnerability: severity === 'critical' ? 'critical_vuln' : 'high_risk_correlation',
      ssl: 'ssl_expired',
    };
    
    const matchedEvent = eventMap[category] || 'high_risk_correlation';
    const payload = {
      title,
      message,
      severity,
      category,
      source,
    };

    // 1. Scoped Organization Webhooks
    if (organizationId) {
      const webhooks = await Webhook.find({
        organizationId,
        events: matchedEvent,
        active: true,
      });

      for (const webhook of webhooks) {
        try {
          if (webhook.type === 'Slack') {
            await sendSlackPayload(webhook, payload);
          } else if (webhook.type === 'Teams') {
            await sendTeamsPayload(webhook, payload);
          } else {
            await sendGenericPayload(webhook, payload);
          }

          webhook.lastSuccess = new Date();
          await webhook.save();
        } catch (err) {
          logger.warn(`[WEBHOOK-DISPATCH] Failed dispatching to ${webhook.name}: ${err.message}`);
          webhook.lastFailure = new Date();
          await webhook.save();
        }
      }
    }

    // 2. Personal Workspace Webhook Fallback
    if (!organizationId && userId) {
      const user = await User.findById(userId).select('webhookUrl');
      if (user && user.webhookUrl) {
        try {
          // Send simple generic payload to personal URL
          await axios.post(user.webhookUrl, {
            event: 'personal_alert',
            timestamp: new Date(),
            data: payload,
          });
        } catch (err) {
          logger.warn(`[WEBHOOK-PERSONAL] Failed personal webhook dispatch: ${err.message}`);
        }
      }
    }
  } catch (error) {
    logger.error(`[WEBHOOK-SERVICE] Execution failure: ${error.message}`);
  }
};

module.exports = {
  triggerWebhookForNotification,
};
