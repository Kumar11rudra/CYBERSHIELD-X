const https = require('https');

class GitHubDeploymentAdapter {
  constructor() {
    this.name = 'GitHub Actions';
    this.id = 'github';
  }

  async fetchWithTimeout(url, headers, timeoutMs = 3000) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        req.destroy();
        reject(new Error('GitHub API request timed out'));
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
              reject(new Error('Invalid JSON from GitHub API'));
            }
          } else {
            reject(new Error(`GitHub API returned HTTP ${res.statusCode}`));
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
    const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
    let owner = process.env.GITHUB_OWNER || process.env.GITHUB_REPOSITORY_OWNER;
    let repo = process.env.GITHUB_REPO || process.env.GITHUB_REPOSITORY;

    if (process.env.GITHUB_REPOSITORY && process.env.GITHUB_REPOSITORY.includes('/')) {
      const parts = process.env.GITHUB_REPOSITORY.split('/');
      owner = owner || parts[0];
      repo = repo || parts[1];
    }

    if (!token || !owner || !repo) {
      return {
        id: this.id,
        name: this.name,
        configured: false,
        status: 'NOT_CONFIGURED',
        latest: null,
        history: [],
        detail: 'GITHUB_TOKEN or GITHUB_OWNER/REPO not configured in environment'
      };
    }

    try {
      const url = `https://api.github.com/repos/${owner}/${repo}/actions/runs?per_page=10`;
      const headers = {
        'User-Agent': 'CyberShield-X-Observability',
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      };

      const data = await this.fetchWithTimeout(url, headers, 3000);
      const runs = (data.workflow_runs || []).map((run) => {
        const started = run.created_at ? new Date(run.created_at).getTime() : 0;
        const ended = run.updated_at ? new Date(run.updated_at).getTime() : 0;
        const durationMs = (ended > started && started > 0) ? (ended - started) : null;

        let runStatus = 'UNKNOWN';
        if (run.status === 'completed') {
          runStatus = run.conclusion === 'success' ? 'PASSING' : 'FAILED';
        } else if (run.status === 'in_progress') {
          runStatus = 'BUILDING';
        } else if (run.status === 'queued') {
          runStatus = 'QUEUED';
        }

        return {
          id: run.id ? String(run.id) : '',
          name: run.name || 'Workflow Run',
          status: runStatus,
          conclusion: run.conclusion || 'pending',
          commit: run.head_sha ? run.head_sha.substring(0, 7) : null,
          fullCommit: run.head_sha || null,
          branch: run.head_branch || null,
          runNumber: run.run_number,
          createdAt: run.created_at,
          completedAt: run.updated_at,
          durationMs,
          url: run.html_url || ''
        };
      });

      const latestRun = runs.length > 0 ? runs[0] : null;
      const isPassing = latestRun ? latestRun.status === 'PASSING' : false;

      return {
        id: this.id,
        name: this.name,
        configured: true,
        status: isPassing ? 'HEALTHY' : (latestRun ? 'DEGRADED' : 'UNKNOWN'),
        latest: latestRun,
        history: runs.slice(0, 10),
        detail: latestRun ? `Latest run #${latestRun.runNumber} (${latestRun.status})` : 'No workflow runs found'
      };
    } catch (err) {
      return {
        id: this.id,
        name: this.name,
        configured: true,
        status: 'DEGRADED',
        latest: null,
        history: [],
        detail: `GitHub API error: ${err.message}`
      };
    }
  }
}

module.exports = GitHubDeploymentAdapter;
