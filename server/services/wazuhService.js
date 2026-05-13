const axios = require('axios');

/**
 * Wazuh SOC Service
 * Connects to a local Wazuh manager for enterprise-grade security monitoring.
 */

const WAZUH_BASE = process.env.WAZUH_URL || 'https://localhost:55000';

const getSecurityEvents = async () => {
  const user = process.env.WAZUH_USER || 'admin';
  const pass = process.env.WAZUH_PASS || 'admin';

  try {
    // 1. Authenticate with local Wazuh Manager
    const auth = await axios.get(`${WAZUH_BASE}/security/user/authenticate`, {
      auth: { username: user, password: pass },
      httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false })
    });

    const token = auth.data.data.token;

    // 2. Fetch latest security alerts
    const alerts = await axios.get(`${WAZUH_BASE}/alerts`, {
      headers: { 'Authorization': `Bearer ${token}` },
      params: { limit: 10, sort: '-timestamp' },
      httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false })
    });

    return {
      source: 'Wazuh Open-Source SIEM',
      alerts: alerts.data.data.affected_items,
      status: 'active'
    };
  } catch (error) {
    console.warn('[WAZUH] Manager offline or credentials missing. Using local OSSEC simulator.');
    return {
      source: 'CyberShield-X SOC (Simulated)',
      alerts: [
        { description: 'Brute force attack detected on SSH', severity: 7, timestamp: new Date() },
        { description: 'Integrity checksum changed: /etc/passwd', severity: 9, timestamp: new Date() }
      ],
      status: 'simulated',
      note: 'Install Wazuh Manager locally for real-time SOC monitoring.'
    };
  }
};

module.exports = { getSecurityEvents };
