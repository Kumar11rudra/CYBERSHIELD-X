const GitHubDeploymentAdapter = require('./adapters/GitHubDeploymentAdapter');
const VercelDeploymentAdapter = require('./adapters/VercelDeploymentAdapter');
const RenderDeploymentAdapter = require('./adapters/RenderDeploymentAdapter');
const DeploymentHealthCorrelator = require('./DeploymentHealthCorrelator');
const DeploymentConfigValidator = require('./DeploymentConfigValidator');

class DeploymentService {
  constructor(deps = {}) {
    this.gitHubAdapter = deps.gitHubAdapter || new GitHubDeploymentAdapter();
    this.vercelAdapter = deps.vercelAdapter || new VercelDeploymentAdapter();
    this.renderAdapter = deps.renderAdapter || new RenderDeploymentAdapter();
    this.correlator = deps.correlator || new DeploymentHealthCorrelator();
    this.configValidator = deps.configValidator || new DeploymentConfigValidator();
  }

  async getDeploymentObservability() {
    const [githubData, vercelData, renderData] = await Promise.all([
      this.gitHubAdapter.getDeploymentData().catch((err) => ({
        id: 'github',
        name: 'GitHub Actions',
        configured: false,
        status: 'DEGRADED',
        latest: null,
        history: [],
        detail: `Adapter exception: ${err.message}`
      })),
      this.vercelAdapter.getDeploymentData().catch((err) => ({
        id: 'vercel',
        name: 'Vercel',
        configured: false,
        status: 'DEGRADED',
        latest: null,
        history: [],
        detail: `Adapter exception: ${err.message}`
      })),
      this.renderAdapter.getDeploymentData().catch((err) => ({
        id: 'render',
        name: 'Render',
        configured: false,
        status: 'DEGRADED',
        latest: null,
        history: [],
        detail: `Adapter exception: ${err.message}`
      }))
    ]);

    const providers = [githubData, vercelData, renderData];
    const configuredProviders = providers.filter((p) => p.configured);

    // Determine overall status
    let overallStatus = 'NOT_CONFIGURED';
    if (configuredProviders.length > 0) {
      const hasFailure = configuredProviders.some((p) => p.status === 'DEGRADED' || p.status === 'FAILED');
      overallStatus = hasFailure ? 'DEGRADED' : 'HEALTHY';
    }

    // Determine Frontend deployment status & metadata
    let frontendStatus = 'NOT_CONFIGURED';
    let frontendCommit = process.env.VERCEL_GIT_COMMIT_SHA
      ? process.env.VERCEL_GIT_COMMIT_SHA.substring(0, 7)
      : null;
    let frontendBranch = process.env.VERCEL_GIT_COMMIT_REF || null;
    let frontendProvider = 'Vercel';
    let frontendDeployedAt = null;

    if (vercelData.configured && vercelData.latest) {
      frontendStatus = vercelData.latest.status;
      frontendCommit = vercelData.latest.commit || frontendCommit;
      frontendBranch = vercelData.latest.branch || frontendBranch;
      frontendProvider = 'Vercel';
      frontendDeployedAt = vercelData.latest.completedAt || vercelData.latest.createdAt || null;
    }

    // Determine Backend deployment status & metadata
    let backendStatus = 'NOT_CONFIGURED';
    let backendCommit = process.env.GIT_COMMIT || process.env.GITHUB_SHA
      ? (process.env.GIT_COMMIT || process.env.GITHUB_SHA).substring(0, 7)
      : null;
    let backendBranch = process.env.GIT_BRANCH || process.env.GITHUB_REF || null;
    let backendProvider = 'Render';
    let backendDeployedAt = null;

    if (renderData.configured && renderData.latest) {
      backendStatus = renderData.latest.status;
      backendCommit = renderData.latest.commit || backendCommit;
      backendBranch = renderData.latest.branch || backendBranch;
      backendProvider = 'Render';
      backendDeployedAt = renderData.latest.completedAt || renderData.latest.createdAt || null;
    }

    // Determine CI/CD pipeline status & metadata
    let cicdStatus = 'NOT_CONFIGURED';
    let cicdCommit = null;
    let cicdBranch = null;
    let cicdRunNumber = null;
    let cicdDurationMs = null;
    let cicdDeployedAt = null;

    if (githubData.configured && githubData.latest) {
      cicdStatus = githubData.latest.status;
      cicdCommit = githubData.latest.commit;
      cicdBranch = githubData.latest.branch;
      cicdRunNumber = githubData.latest.runNumber;
      cicdDurationMs = githubData.latest.durationMs;
      cicdDeployedAt = githubData.latest.completedAt || githubData.latest.createdAt || null;
    }

    // Authoritative pipeline visualizer stage mapping
    const isDeployPassed =
      (vercelData.configured && vercelData.latest?.status === 'LIVE') ||
      (renderData.configured && renderData.latest?.status === 'LIVE');

    const isDeployConfigured = vercelData.configured || renderData.configured;

    const pipeline = {
      build: githubData.configured && githubData.latest
        ? (githubData.latest.status === 'PASSING' ? 'PASSED' : githubData.latest.status)
        : 'NOT_CONFIGURED',
      test: githubData.configured && githubData.latest
        ? (githubData.latest.status === 'PASSING' ? 'PASSED' : githubData.latest.status)
        : 'NOT_CONFIGURED',
      deploy: isDeployPassed
        ? 'PASSED'
        : (isDeployConfigured ? 'DEGRADED' : 'NOT_CONFIGURED'),
      healthCheck: 'HEALTHY'
    };

    // Combine deployment history bounded to max 10 records
    const combinedHistory = [];
    providers.forEach((p) => {
      if (Array.isArray(p.history)) {
        p.history.forEach((item) => {
          combinedHistory.push({
            id: `${p.id}-${item.id || Math.random()}`,
            provider: p.name,
            service: item.name || p.name,
            status: item.status,
            commit: item.commit || null,
            branch: item.branch || null,
            durationMs: item.durationMs || null,
            createdAt: item.createdAt || null,
            url: item.url || ''
          });
        });
      }
    });

    combinedHistory.sort((a, b) => {
      if (!a.createdAt) return 1;
      if (!b.createdAt) return -1;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
    const boundedHistory = combinedHistory.slice(0, 10);

    return {
      overallStatus,
      timestamp: new Date().toISOString(),
      providers,
      applications: [
        {
          id: 'frontend',
          name: 'Frontend Client',
          provider: frontendProvider,
          environment: process.env.NODE_ENV || 'development',
          deploymentStatus: frontendStatus,
          runtimeStatus: 'HEALTHY',
          commitSha: frontendCommit,
          branch: frontendBranch,
          deployedAt: frontendDeployedAt
        },
        {
          id: 'backend',
          name: 'Backend API Engine',
          provider: backendProvider,
          environment: process.env.NODE_ENV || 'development',
          deploymentStatus: backendStatus,
          runtimeStatus: 'HEALTHY',
          commitSha: backendCommit,
          branch: backendBranch,
          deployedAt: backendDeployedAt
        },
        {
          id: 'cicd',
          name: 'GitHub Actions CI/CD Pipeline',
          provider: 'GitHub Actions',
          environment: 'production',
          deploymentStatus: cicdStatus,
          runtimeStatus: 'HEALTHY',
          commitSha: cicdCommit,
          branch: cicdBranch,
          runNumber: cicdRunNumber,
          durationMs: cicdDurationMs,
          deployedAt: cicdDeployedAt
        }
      ],
      pipeline,
      history: boundedHistory
    };
  }

  async getDeploymentCorrelation(systemHealth = {}) {
    const deploymentObservability = await this.getDeploymentObservability();
    const correlation = this.correlator.correlate(systemHealth, deploymentObservability);
    const configReadiness = this.configValidator.validateConfiguration();

    return {
      timestamp: new Date().toISOString(),
      deploymentObservability,
      correlation,
      configReadiness
    };
  }
}

module.exports = DeploymentService;
