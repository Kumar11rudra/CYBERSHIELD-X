/**
 * CyberShield X — Non-Destructive Production Environment Readiness Validator
 * Safely audits environment variable configuration status without exposing secret values.
 */

class ProductionConfigValidator {
  validate(env = process.env) {
    const checks = [];

    // Core Backend Production Variables
    const coreVars = [
      { name: 'MONGODB_URI', required: true },
      { name: 'JWT_SECRET', required: true, minLength: 32 },
      { name: 'JWT_REFRESH_SECRET', required: true, minLength: 32 },
      { name: 'VAULT_ENCRYPTION_KEY', required: true, minLength: 16 },
      { name: 'CLIENT_URL', required: true }
    ];

    coreVars.forEach((item) => {
      const val = env[item.name];
      let status = 'MISSING';
      let safeFormat = 'UNCONFIGURED';

      if (val && typeof val === 'string' && val.trim().length > 0) {
        status = 'CONFIGURED';
        const isMinLengthValid = !item.minLength || val.trim().length >= item.minLength;
        safeFormat = isMinLengthValid ? 'VALID_FORMAT' : 'INVALID_FORMAT';
      }

      checks.push({
        variable: item.name,
        required: item.required,
        status,
        safeFormat
      });
    });

    // Optional Observability Provider Variables
    const providerVars = [
      { name: 'GITHUB_TOKEN', provider: 'GitHub Actions' },
      { name: 'VERCEL_TOKEN', provider: 'Vercel' },
      { name: 'RENDER_API_KEY', provider: 'Render' }
    ];

    providerVars.forEach((item) => {
      const val = env[item.name];
      let status = 'NOT_CONFIGURED';
      let safeFormat = 'OPTIONAL_UNCONFIGURED';

      if (val && typeof val === 'string' && val.trim().length > 0) {
        status = 'CONFIGURED';
        safeFormat = val.trim().length >= 10 ? 'VALID_FORMAT' : 'INVALID_FORMAT';
      }

      checks.push({
        variable: item.name,
        required: false,
        status,
        safeFormat
      });
    });

    const missingRequired = checks.filter((c) => c.required && c.status === 'MISSING');
    const isProductionReady = missingRequired.length === 0;

    return {
      timestamp: new Date().toISOString(),
      isProductionReady,
      missingRequiredCount: missingRequired.length,
      checks
    };
  }
}

if (require.main === module) {
  const validator = new ProductionConfigValidator();
  const report = validator.validate();
  console.log('─── CYBERSHIELD X PRODUCTION CONFIG READINESS REPORT ───');
  console.log(`Timestamp: ${report.timestamp}`);
  console.log(`Production Ready: ${report.isProductionReady ? 'YES' : 'NO'}`);
  console.log(`Missing Required Variables: ${report.missingRequiredCount}`);
  console.log('────────────────────────────────────────────────────────');
  report.checks.forEach((c) => {
    console.log(`  ${c.variable.padEnd(22)} → Status: ${c.status.padEnd(14)} Format: ${c.safeFormat}`);
  });
}

module.exports = ProductionConfigValidator;
