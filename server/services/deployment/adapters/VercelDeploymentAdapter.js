const https = require('https');

class VercelDeploymentAdapter {
  constructor() {
    this.name = 'Vercel';
    this.id = 'vercel';
  }

  async fetchWithTimeout(url, headers, timeoutMs = 3000) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        req.destroy();
        reject(new Error('Vercel API request timed out'));
      }, timeoutMs);

      const req = https.get(url, { headers }, (res) => {
        let rawData = '';
        res.on('data', (chunk) => { rawData += chunk; });
        res.on('end', () => {
          clearTimeout(timer);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              resolve(JSON.parse(rawData));
            } catch (err) {
              reject(new Error('Invalid JSON from Vercel API'));
            }
          } else {
            reject(new Error(`Vercel API returned HTTP ${res.statusCode}`));
          }
        });
      });

      req.on('error', (err) => {
        clearTimeout(timer);
        reject(err);
      });
    });
  }

  async getDeploymentData() {
    const token = process.env.VERCEL_TOKEN;
    const projectId = process.env.VERCEL_PROJECT_ID;
    const teamId = process.env.VERCEL_TEAM_ID;

    if (!token) {
      return {
        id: this.id,
        name: this.name,
        configured: false,
        status: 'NOT_CONFIGURED',
        latest: null,
        history: [],
        detail: 'VERCEL_TOKEN not configured in environment'
      };
    }

    try {
      let url = `https://api.vercel.com/v6/deployments?limit=10`;
      if (projectId) url += `&projectId=${encodeURIComponent(projectId)}`;
      if (teamId) url += `&teamId=${encodeURIComponent(teamId)}`;

      const headers = {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      };

      const data = await this.fetchWithTimeout(url, headers, 3000);
      const deployments = (data.deployments || []).map((dep) => {
        const created = dep.created ? Number(dep.created) : 0;
        const ready = dep.ready ? Number(dep.ready) : 0;
        const durationMs = (ready > created && created > 0) ? (ready - created) : null;

        let status = 'UNKNOWN';
        if (dep.state === 'READY') status = 'LIVE';
        else if (dep.state === 'BUILDING') status = 'BUILDING';
        else if (dep.state === 'ERROR' || dep.state === 'CANCELED') status = 'FAILED';

        return {
          id: dep.uid || '',
          name: dep.name || 'Vercel Deployment',
          status,
          commit: dep.meta?.githubCommitSha ? dep.meta.githubCommitSha.substring(0, 7) : null,
          fullCommit: dep.meta?.githubCommitSha || null,
          branch: dep.meta?.githubCommitRef || null,
          createdAt: created ? new Date(created).toISOString() : null,
          completedAt: ready ? new Date(ready).toISOString() : null,
          durationMs,
          url: dep.url ? `https://${dep.url}` : ''
        };
      });

      const latest = deployments.length > 0 ? deployments[0] : null;

      return {
        id: this.id,
        name: this.name,
        configured: true,
        status: latest ? (latest.status === 'LIVE' ? 'HEALTHY' : 'DEGRADED') : 'UNKNOWN',
        latest,
        history: deployments.slice(0, 10),
        detail: latest ? `Latest deployment ${latest.status} (${latest.commit})` : 'No Vercel deployments found'
      };
    } catch (err) {
      return {
        id: this.id,
        name: this.name,
        configured: true,
        status: 'DEGRADED',
        latest: null,
        history: [],
        detail: `Vercel API error: ${err.message}`
      };
    }
  }
}

module.exports = VercelDeploymentAdapter;
