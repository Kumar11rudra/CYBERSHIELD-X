const axios = require('axios');

const createGitHubIssue = async (config, context) => {
  const { owner, repo, token, labels = [] } = config;

  if (!owner || !repo || !token) {
    throw new Error('GitHub integration missing required fields: owner, repo, token');
  }

  const severityEmoji = {
    Critical: '🔴', High: '🟠', Medium: '🟡', Low: '🟢',
  };
  const emoji = severityEmoji[context.severity] || '⚠️';

  const body = `## ${emoji} Security Finding — CyberShield X

**CVE:** \`${context.cve || 'N/A'}\`
**Severity:** ${context.severity || 'N/A'}
**Priority:** ${context.priority || 'N/A'}
**Asset:** ${context.asset || 'Unknown'}
**SLA Status:** ${context.slaStatus || 'N/A'}
**Risk Score:** ${context.riskScore || 'N/A'}/100

---

### Description
${context.description || 'Security finding automatically detected by CyberShield X. Please investigate and apply the appropriate patch or mitigation.'}

---

### Remediation Checklist
- [ ] Verify the finding is reproducible
- [ ] Apply the appropriate patch or mitigation
- [ ] Verify fix in staging environment
- [ ] Close this issue and mark as Verified in CyberShield X

---
*Automatically created by [CyberShield X](${process.env.CLIENT_URL || 'https://cybershield.app'})*`;

  const issueLabels = ['security', 'cybershield-x', context.severity?.toLowerCase() || 'medium', ...labels];

  const response = await axios.post(
    `https://api.github.com/repos/${owner}/${repo}/issues`,
    {
      title: `[CyberShield X] ${context.cve || 'Security Finding'} on ${context.asset || 'Unknown Asset'}`,
      body,
      labels: issueLabels,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/vnd.github.v3+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      timeout: 10000,
    }
  );

  return {
    issueNumber: response.data.number,
    url: response.data.html_url,
    title: response.data.title,
  };
};

const testGitHubConnection = async (config) => {
  const { owner, repo, token } = config;
  if (!owner || !repo || !token) {
    throw new Error('GitHub configuration missing required fields');
  }
  const response = await axios.get(
    `https://api.github.com/repos/${owner}/${repo}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
      timeout: 8000,
    }
  );
  return { repo: response.data.full_name, private: response.data.private };
};

module.exports = {
  createGitHubIssue,
  testGitHubConnection,
};
