class DeploymentConfigValidator {
  validateConfiguration() {
    // 1. GitHub Actions Validation
    const ghToken = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
    let ghOwner = process.env.GITHUB_OWNER || process.env.GITHUB_REPOSITORY_OWNER;
    let ghRepo = process.env.GITHUB_REPO || process.env.GITHUB_REPOSITORY;

    if (process.env.GITHUB_REPOSITORY && process.env.GITHUB_REPOSITORY.includes('/')) {
      const parts = process.env.GITHUB_REPOSITORY.split('/');
      ghOwner = ghOwner || parts[0];
      ghRepo = ghRepo || parts[1];
    }

    const ghMissing = [];
    if (!ghToken) ghMissing.push('GITHUB_TOKEN');
    if (!ghOwner) ghMissing.push('GITHUB_OWNER');
    if (!ghRepo) ghMissing.push('GITHUB_REPO');

    let ghStatus = 'NOT_CONFIGURED';
    let ghFormatting = 'UNCONFIGURED';

    if (ghMissing.length === 0) {
      ghStatus = 'CONFIGURED';
      const isValidFormat =
        typeof ghToken === 'string' &&
        ghToken.trim().length >= 10 &&
        (ghToken.startsWith('ghp_') || ghToken.startsWith('github_pat_') || ghToken.startsWith('gho_') || ghToken.length > 20);
      ghFormatting = isValidFormat ? 'CONFIGURED_VALID_FORMAT' : 'INVALID_FORMAT';
    } else if (ghMissing.length < 3) {
      ghStatus = 'MISSING_REQUIRED_ENV';
    }

    // 2. Vercel Validation (Note: Vercel is EXCLUDED from active deployment targets. Cloudflare Pages is active frontend target.)
    const vercelToken = process.env.VERCEL_TOKEN;
    const vercelProject = process.env.VERCEL_PROJECT_ID;

    const vercelMissing = [];
    if (!vercelToken) vercelMissing.push('VERCEL_TOKEN');
    if (!vercelProject) vercelMissing.push('VERCEL_PROJECT_ID');

    let vercelStatus = 'NOT_ACTIVE_TARGET';
    let vercelFormatting = 'UNCONFIGURED';

    if (vercelToken) {
      vercelStatus = 'CONFIGURED';
      const isValidFormat = typeof vercelToken === 'string' && vercelToken.trim().length >= 10;
      vercelFormatting = isValidFormat ? 'CONFIGURED_VALID_FORMAT' : 'INVALID_FORMAT';
    }

    // 3. Render Validation
    const renderKey = process.env.RENDER_API_KEY;
    const renderService = process.env.RENDER_SERVICE_ID;

    const renderMissing = [];
    if (!renderKey) renderMissing.push('RENDER_API_KEY');
    if (!renderService) renderMissing.push('RENDER_SERVICE_ID');

    let renderStatus = 'NOT_CONFIGURED';
    let renderFormatting = 'UNCONFIGURED';

    if (renderMissing.length === 0) {
      renderStatus = 'CONFIGURED';
      const isValidFormat = typeof renderKey === 'string' && (renderKey.startsWith('rnd_') || renderKey.trim().length >= 10);
      renderFormatting = isValidFormat ? 'CONFIGURED_VALID_FORMAT' : 'INVALID_FORMAT';
    } else if (renderMissing.length < 2 && renderKey) {
      renderStatus = 'MISSING_REQUIRED_ENV';
      renderFormatting = 'CONFIGURED_VALID_FORMAT';
    }

    const providers = [
      {
        id: 'github',
        name: 'GitHub Actions',
        configured: ghMissing.length === 0,
        status: ghStatus,
        formattingStatus: ghFormatting,
        missingVariables: ghMissing
      },
      {
        id: 'vercel',
        name: 'Vercel',
        configured: !!vercelToken,
        status: vercelStatus,
        formattingStatus: vercelFormatting,
        missingVariables: vercelMissing
      },
      {
        id: 'render',
        name: 'Render',
        configured: renderMissing.length === 0,
        status: renderStatus,
        formattingStatus: renderFormatting,
        missingVariables: renderMissing
      }
    ];

    const readyCount = providers.filter((p) => p.configured && p.formattingStatus === 'CONFIGURED_VALID_FORMAT').length;
    const readinessScore = `${readyCount}/${providers.length}`;

    return {
      providers,
      readinessScore
    };
  }
}

module.exports = DeploymentConfigValidator;
