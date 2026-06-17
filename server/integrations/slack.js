const axios = require('axios');

const sendSlackBlocks = async (config, context) => {
  const { webhookUrl } = config;
  if (!webhookUrl) throw new Error('Slack integration missing webhookUrl');

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

  await axios.post(webhookUrl, slackBody, { timeout: 8000 });
  return { delivered: true, channel: 'slack-webhook' };
};

const testSlackConnection = async (config) => {
  const { webhookUrl } = config;
  if (!webhookUrl) throw new Error('Slack webhookUrl is missing');
  await axios.post(webhookUrl, {
    text: '✅ CyberShield X — Integration test successful! Your Slack notifications are configured correctly.',
  }, { timeout: 8000 });
  return { delivered: true };
};

module.exports = {
  sendSlackBlocks,
  testSlackConnection,
};
