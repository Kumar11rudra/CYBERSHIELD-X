const axios = require('axios');
const crypto = require('crypto');

const sendGenericPayload = async (config, context) => {
  const { url, secret, signatureEnabled } = config;
  if (!url) throw new Error('Generic Webhook missing target URL');

  const body = JSON.stringify({
    event: context.event || 'automated_playbook_alert',
    timestamp: new Date(),
    data: context,
  });

  const headers = {
    'Content-Type': 'application/json',
  };

  if (signatureEnabled && secret) {
    const signature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');
    headers['X-CyberShield-Signature'] = signature;
  }

  const response = await axios.post(url, body, { headers, timeout: 8000 });
  return { status: response.status, data: response.data };
};

const testWebhookConnection = async (config) => {
  const { url } = config;
  if (!url) throw new Error('Generic Webhook target URL is missing');
  const body = JSON.stringify({
    event: 'test_connection',
    timestamp: new Date(),
    data: { message: 'Connection Test from CyberShield X' },
  });
  const response = await axios.post(url, body, {
    headers: { 'Content-Type': 'application/json' },
    timeout: 8000,
  });
  return { status: response.status };
};

module.exports = {
  sendGenericPayload,
  testWebhookConnection,
};
