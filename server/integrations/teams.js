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

const sendTeamsRichCard = async (config, context) => {
  const { webhookUrl } = config;
  await validateWebhookUrl(webhookUrl, 'Teams');

  const severityColor = {
    Critical: 'attention', High: 'warning', Medium: 'accent', Low: 'good',
  };
  const appUrl = process.env.CLIENT_URL || 'https://cybershield.app';

  const teamsBody = {
    type: 'message',
    attachments: [
      {
        contentType: 'application/vnd.microsoft.card.adaptive',
        content: {
          $schema: 'http://adaptivecards.io/schemas/adaptive-card.json',
          type: 'AdaptiveCard',
          version: '1.4',
          body: [
            {
              type: 'Container',
              style: severityColor[context.severity] || 'default',
              items: [
                {
                  type: 'TextBlock',
                  text: `🛡️ CyberShield X Alert — ${context.severity || 'Security'} Finding`,
                  weight: 'Bolder',
                  size: 'Medium',
                  color: 'Attention',
                },
              ],
            },
            {
              type: 'FactSet',
              facts: [
                { title: 'CVE / Finding', value: context.cve || context.title || 'N/A' },
                { title: 'Severity', value: context.severity || 'Unknown' },
                { title: 'Asset', value: context.asset || 'N/A' },
                { title: 'SLA Status', value: context.slaStatus || 'N/A' },
                { title: 'Detected', value: new Date().toUTCString() },
              ],
            },
            {
              type: 'TextBlock',
              text: context.message || 'A security finding requires your attention.',
              wrap: true,
            },
          ],
          actions: [
            {
              type: 'Action.OpenUrl',
              title: 'View in CyberShield X',
              url: `${appUrl}/vulnerabilities`,
            },
          ],
        },
      },
    ],
  };

  await secureAxios.post(webhookUrl, teamsBody);
  return { delivered: true };
};

const testTeamsConnection = async (config) => {
  const { webhookUrl } = config;
  await validateWebhookUrl(webhookUrl, 'Teams');
  await secureAxios.post(webhookUrl, {
    '@type': 'MessageCard',
    '@context': 'http://schema.org/extensions',
    themeColor: '00D4FF',
    summary: 'CyberShield X Integration Test',
    text: '✅ CyberShield X — Teams integration configured successfully.',
  });
  return { delivered: true };
};

module.exports = {
  sendTeamsRichCard,
  testTeamsConnection,
};
