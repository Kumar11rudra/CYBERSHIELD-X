const axios = require('axios');

const sendTeamsRichCard = async (config, context) => {
  const { webhookUrl } = config;
  if (!webhookUrl) throw new Error('Teams integration missing webhookUrl');

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

  await axios.post(webhookUrl, teamsBody, { timeout: 8000 });
  return { delivered: true };
};

const testTeamsConnection = async (config) => {
  const { webhookUrl } = config;
  if (!webhookUrl) throw new Error('Teams webhookUrl is missing');
  await axios.post(webhookUrl, {
    '@type': 'MessageCard',
    '@context': 'http://schema.org/extensions',
    themeColor: '00D4FF',
    summary: 'CyberShield X Integration Test',
    text: '✅ CyberShield X — Teams integration configured successfully.',
  }, { timeout: 8000 });
  return { delivered: true };
};

module.exports = {
  sendTeamsRichCard,
  testTeamsConnection,
};
