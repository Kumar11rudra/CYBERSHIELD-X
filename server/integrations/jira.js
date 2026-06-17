const axios = require('axios');

const createJiraTicket = async (config, context) => {
  const { baseUrl, email, apiToken, projectKey, issueType = 'Bug' } = config;

  if (!baseUrl || !email || !apiToken || !projectKey) {
    throw new Error('Jira integration missing required fields: baseUrl, email, apiToken, projectKey');
  }

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

  const response = await axios.post(
    `${baseUrl.replace(/\/$/, '')}/rest/api/3/issue`,
    issueBody,
    {
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      timeout: 10000,
    }
  );

  const ticketKey = response.data.key;
  const ticketUrl = `${baseUrl.replace(/\/$/, '')}/browse/${ticketKey}`;
  return { ticketKey, url: ticketUrl, issueId: response.data.id };
};

const testJiraConnection = async (config) => {
  const { baseUrl, email, apiToken, projectKey } = config;
  if (!baseUrl || !email || !apiToken || !projectKey) {
    throw new Error('Jira configuration missing required fields');
  }
  const auth = Buffer.from(`${email}:${apiToken}`).toString('base64');
  const response = await axios.get(
    `${baseUrl.replace(/\/$/, '')}/rest/api/3/project/${projectKey}`,
    {
      headers: { Authorization: `Basic ${auth}`, Accept: 'application/json' },
      timeout: 8000,
    }
  );
  return { project: response.data.name, key: response.data.key };
};

module.exports = {
  createJiraTicket,
  testJiraConnection,
};
