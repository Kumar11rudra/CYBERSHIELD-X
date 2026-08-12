const axios = require('axios');
const { secureHttpAgent, secureHttpsAgent, isPrivateOrLoopback } = require('../utils/ssrfValidator');

// Secure axios instance — all requests routed through ssrfLookup connection-time validation
const secureAxios = axios.create({
  httpAgent: secureHttpAgent,
  httpsAgent: secureHttpsAgent,
  timeout: 8000,
});

/**
 * Validates that a user-supplied webhook URL does not target a private/internal host.
 * Throws if the URL is invalid or resolves to a private range.
 */
async function validateWebhookUrl(url, label) {
  if (!url || typeof url !== 'string') throw new Error(`${label} webhookUrl is required`);
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(`${label}: invalid webhook URL format`);
  }
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error(`${label}: webhook URL must use http or https`);
  }
  // Strip IPv6 brackets from hostname (e.g. [::1] -> ::1) before SSRF check
  const bareHost = parsed.hostname.replace(/^\[|\]$/g, '');
  if (await isPrivateOrLoopback(bareHost)) {
    throw new Error(`${label}: webhook URL resolves to a private/internal address (SSRF prevention)`);
  }
}

const sendSlackBlocks = async (config, context) => {
  const { webhookUrl } = config;
  await validateWebhookUrl(webhookUrl, 'Slack');

  const severityColors = {
    critical: '#FF0033', high: '#FF6600', medium: '#FFB800', low: '#00CC44',
    Critical: '#FF0033', High: '#FF6600', Medium: '#FFB800', Low: '#00CC44',
    warning: '#FFB800', info: '#00D4FF',
  };
  const severityIcons = {
    Critical: '🔴', High: '🟠', Medium: '🟡', Low: '🟢',
    critical: '🔴', high: '🟠', warning: '🟡', info: '🔵',
  };

  const color = severityColors[context.severity] || '#00D4FF';
  const icon = severityIcons[context.severity] || '⚠️';
  const appUrl = process.env.CLIENT_URL || 'https://cybershield.app';
  const deepLink = context.vulnId
    ? `${appUrl}/vulnerabilities?highlight=${context.vulnId}`
    : `${appUrl}/vulnerabilities`;

  const slackBody = {
    attachments: [
      {
        color,
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: `${icon} CyberShield X Security Alert`,
              emoji: true,
            },
          },
          {
            type: 'section',
            fields: [
              { type: 'mrkdwn', text: `*Finding:*\n${context.cve || context.title || 'Security Alert'}` },
              { type: 'mrkdwn', text: `*Severity:*\n${context.severity || 'Unknown'}` },
              { type: 'mrkdwn', text: `*Asset:*\n${context.asset || 'N/A'}` },
              { type: 'mrkdwn', text: `*SLA Status:*\n${context.slaStatus || 'N/A'}` },
            ],
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: context.message || 'A security finding requires your attention.',
            },
          },
          {
            type: 'actions',
            elements: [
              {
                type: 'button',
                text: { type: 'plain_text', text: '🔍 View in CyberShield', emoji: true },
                url: deepLink,
                style: 'primary',
              },
            ],
          },
          {
            type: 'context',
            elements: [
              {
                type: 'mrkdwn',
                text: `*CyberShield X* · ${new Date().toUTCString()}`,
              },
            ],
          },
        ],
      },
    ],
  };

  await secureAxios.post(webhookUrl, slackBody);
  return { delivered: true, channel: 'slack-webhook' };
};

const testSlackConnection = async (config) => {
  const { webhookUrl } = config;
  await validateWebhookUrl(webhookUrl, 'Slack');
  await secureAxios.post(webhookUrl, {
    text: '✅ CyberShield X — Integration test successful! Your Slack notifications are configured correctly.',
  });
  return { delivered: true };
};

module.exports = {
  sendSlackBlocks,
  testSlackConnection,
};
