class DeploymentHealthCorrelator {
  constructor() {
    this.correlationWindowMinutes = 30;
  }

  correlate(systemHealth = {}, deploymentObservability = {}) {
    const now = Date.now();
    const windowMs = this.correlationWindowMinutes * 60 * 1000;

    // Extract recent deployment from history or applications
    const history = Array.isArray(deploymentObservability.history) ? deploymentObservability.history : [];
    let recentDeployment = null;

    if (history.length > 0) {
      const sorted = [...history].filter((h) => h.createdAt).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      if (sorted.length > 0) {
        const deployTime = new Date(sorted[0].createdAt).getTime();
        if (now - deployTime <= windowMs) {
          recentDeployment = sorted[0];
        }
      }
    }

    // Evaluate health anomalies
    const anomalies = [];
    const impactedMetrics = [];

    const summary = systemHealth.summary || {};
    const services = systemHealth.services || {};

    const errorRate = typeof summary.errorRate === 'number' ? summary.errorRate : 0;
    const apiLatency = typeof summary.apiLatencyMs === 'number' ? summary.apiLatencyMs : 0;
    const dbStatus = services.database?.status || 'UNKNOWN';

    if (errorRate > 5) {
      anomalies.push(`High error rate detected: ${errorRate}% (Threshold > 5%)`);
      impactedMetrics.push('errorRate');
    }

    if (apiLatency > 300) {
      anomalies.push(`Elevated API response latency: ${apiLatency} ms (Threshold > 300ms)`);
      impactedMetrics.push('apiLatency');
    }

    if (dbStatus !== 'HEALTHY' && dbStatus !== 'LIVE') {
      anomalies.push(`Database subsystem reporting non-healthy status: ${dbStatus}`);
      impactedMetrics.push('databaseHealth');
    }

    // Determine correlation status
    let status = 'NO_RECENT_DEPLOYMENTS';
    let evidence = 'No deployment completed within the 30-minute observation window.';

    if (recentDeployment) {
      if (anomalies.length === 0) {
        status = 'STABLE';
        evidence = `Deployment ${recentDeployment.id || recentDeployment.commit || 'record'} completed cleanly at ${recentDeployment.createdAt}. System operating within nominal operational thresholds.`;
      } else if (impactedMetrics.includes('errorRate') || impactedMetrics.includes('databaseHealth')) {
        status = 'CORRELATED_DEGRADATION';
        evidence = `System degradation detected following deployment ${recentDeployment.id || recentDeployment.commit || 'record'} at ${recentDeployment.createdAt}. Anomalies: ${anomalies.join('; ')}.`;
      } else if (impactedMetrics.includes('apiLatency')) {
        status = 'POST_DEPLOY_LATENCY_SPIKE';
        evidence = `Post-deployment latency elevation observed following deployment ${recentDeployment.id || recentDeployment.commit || 'record'} at ${recentDeployment.createdAt}. Latency: ${apiLatency} ms.`;
      }
    } else if (anomalies.length > 0) {
      status = 'NO_RECENT_DEPLOYMENTS';
      evidence = `Runtime health anomalies detected (${anomalies.join('; ')}), but zero deployments occurred within the 30-minute window.`;
    }

    return {
      status,
      correlationWindowMinutes: this.correlationWindowMinutes,
      recentDeployment: recentDeployment ? {
        id: recentDeployment.id || null,
        provider: recentDeployment.provider || 'UNKNOWN',
        service: recentDeployment.service || 'UNKNOWN',
        commit: recentDeployment.commit || null,
        branch: recentDeployment.branch || null,
        createdAt: recentDeployment.createdAt || null
      } : null,
      anomalies,
      impactedMetrics,
      evidence
    };
  }
}

module.exports = DeploymentHealthCorrelator;
