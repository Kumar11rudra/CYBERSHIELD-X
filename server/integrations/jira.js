const axios = require('axios');
const { secureHttpAgent, secureHttpsAgent, isPrivateOrLoopback } = require('../utils/ssrfValidator');

// Secure axios instance — all requests routed through ssrfLookup connection-time validation
const secureAxios = axios.create({
  httpAgent: secureHttpAgent,
  httpsAgent: secureHttpsAgent,
  timeout: 10000,
});

/**
 * Validates that a user-supplied API base URL does not target a private/internal host.
 * Throws if the URL is invalid, uses a non-http(s) protocol, or resolves to a private range.
 */
async function validateApiUrl(url, label) {
  if (!url || typeof url !== 'string') throw new Error(`${label}: baseUrl is required`);
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(`${label}: invalid baseUrl format`);
  }
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error(`${label}: baseUrl must use http or https`);
  }
  // Strip IPv6 brackets from hostname (e.g. [::1] -> ::1) before SSRF check
  const bareHost = parsed.hostname.replace(/^\[|\]$/g, '');
  if (await isPrivateOrLoopback(bareHost)) {
    throw new Error(`${label}: baseUrl resolves to a private/internal address (SSRF prevention)`);
  }
}

const createJiraTicket = async (config, context) => {
  const { baseUrl, email, apiToken, projectKey, issueType = 'Bug' } = config;

  if (!baseUrl || !email || !apiToken || !projectKey) {
    throw new Error('Jira integration missing required fields: baseUrl, email, apiToken, projectKey');
  }

  // Validate the baseUrl against SSRF before making the request
  await validateApiUrl(baseUrl, 'Jira');

  const jiraPriorityMap = {
    'P1-Critical': 'Highest',
    'P2-High': 'High',
    'P3-Medium': 'Medium',
    'P4-Low': 'Low',
    Critical: 'Highest',
    High: 'High',
    Medium: 'Medium',
    Low: 'Low',
  };

  const issueBody = {
    fields: {
      project: { key: projectKey },
      issuetype: { name: issueType },
      summary: `[CyberShield X] ${context.cve || 'Security Finding'} — ${context.asset || 'Unknown Asset'}`,
      description: {
        version: 1,
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: `Security finding automatically detected by CyberShield X.\n\n`,
              },
              { type: 'text', text: `CVE: ${context.cve || 'N/A'}\n` },
              { type: 'text', text: `Severity: ${context.severity || 'N/A'}\n` },
              { type: 'text', text: `Asset: ${context.asset || 'N/A'}\n` },
              { type: 'text', text: `SLA Status: ${context.slaStatus || 'N/A'}\n` },
              { type: 'text', text: `Risk Score: ${context.riskScore || 'N/A'}\n\n` },
              { type: 'text', text: context.description || 'Please investigate and remediate.' },
            ],
          },
        ],
      },
      priority: { name: jiraPriorityMap[context.priority] || jiraPriorityMap[context.severity] || 'Medium' },
      labels: ['cybershield', 'security', 'automated'],
    },
  };

  const auth = Buffer.from(`${email}:${apiToken}`).toString('base64');
  const normalizedBase = baseUrl.replace(/\/$/, '');

  const response = await secureAxios.post(
    `${normalizedBase}/rest/api/3/issue`,
    issueBody,
    {
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    }
  );

  const ticketKey = response.data.key;
  const ticketUrl = `${normalizedBase}/browse/${ticketKey}`;
  return { ticketKey, url: ticketUrl, issueId: response.data.id };
};

const testJiraConnection = async (config) => {
  const { baseUrl, email, apiToken, projectKey } = config;
  if (!baseUrl || !email || !apiToken || !projectKey) {
    throw new Error('Jira configuration missing required fields');
  }
  await validateApiUrl(baseUrl, 'Jira');
  const auth = Buffer.from(`${email}:${apiToken}`).toString('base64');
  const normalizedBase = baseUrl.replace(/\/$/, '');
  const response = await secureAxios.get(
    `${normalizedBase}/rest/api/3/project/${projectKey}`,
    {
      headers: { Authorization: `Basic ${auth}`, Accept: 'application/json' },
    }
  );
  return { project: response.data.name, key: response.data.key };
};

module.exports = {
  createJiraTicket,
  testJiraConnection,
};
