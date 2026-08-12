const https = require('https');

class RenderDeploymentAdapter {
  constructor() {
    this.name = 'Render';
    this.id = 'render';
  }

  async fetchWithTimeout(url, headers, timeoutMs = 3000) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        req.destroy();
        reject(new Error('Render API request timed out'));
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
              reject(new Error('Invalid JSON from Render API'));
            }
          } else {
            reject(new Error(`Render API returned HTTP ${res.statusCode}`));
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
    const apiKey = process.env.RENDER_API_KEY;
    const serviceId = process.env.RENDER_SERVICE_ID;

    if (!apiKey || !serviceId) {
      return {
        id: this.id,
        name: this.name,
        configured: false,
        status: 'NOT_CONFIGURED',
        latest: null,
        history: [],
        detail: 'RENDER_API_KEY or RENDER_SERVICE_ID not configured in environment'
      };
    }

    try {
      const url = `https://api.render.com/v1/services/${encodeURIComponent(serviceId)}/deploys?limit=10`;
      const headers = {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json'
      };

      const data = await this.fetchWithTimeout(url, headers, 3000);
      const deploys = (Array.isArray(data) ? data : data.deploys || []).map((item) => {
        const dep = item.deploy || item;
        const started = dep.createdAt ? new Date(dep.createdAt).getTime() : 0;
        const ended = dep.finishedAt ? new Date(dep.finishedAt).getTime() : 0;
        const durationMs = (ended > started && started > 0) ? (ended - started) : null;

        let status = 'UNKNOWN';
        if (dep.status === 'live') status = 'LIVE';
        else if (dep.status === 'build_in_progress' || dep.status === 'pre_deploy_in_progress') status = 'BUILDING';
        else if (dep.status === 'build_failed' || dep.status === 'update_failed') status = 'FAILED';
        else if (dep.status === 'canceled') status = 'CANCELED';

        return {
          id: dep.id || '',
          name: 'Render Web Service',
          status,
          commit: dep.commit?.id ? dep.commit.id.substring(0, 7) : null,
          fullCommit: dep.commit?.id || null,
          branch: dep.commit?.branch || null,
          createdAt: dep.createdAt || null,
          completedAt: dep.finishedAt || null,
          durationMs,
          url: dep.url || ''
        };
      });

      const latest = deploys.length > 0 ? deploys[0] : null;

      return {
        id: this.id,
        name: this.name,
        configured: true,
        status: latest ? (latest.status === 'LIVE' ? 'HEALTHY' : 'DEGRADED') : 'UNKNOWN',
        latest,
        history: deploys.slice(0, 10),
        detail: latest ? `Latest deployment ${latest.status} (${latest.commit})` : 'No Render deployments found'
      };
    } catch (err) {
      return {
        id: this.id,
        name: this.name,
        configured: true,
        status: 'DEGRADED',
        latest: null,
        history: [],
        detail: `Render API error: ${err.message}`
      };
    }
  }
}

module.exports = RenderDeploymentAdapter;
