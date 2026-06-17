const TenantContextService = require('../services/TenantContextService');

module.exports = {
  requireOrgContext: TenantContextService.requireOrgContext,
  enforcePermission: TenantContextService.enforcePermission,
};
