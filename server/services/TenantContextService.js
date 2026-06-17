const Membership = require('../models/Membership');
const { hasPermission } = require('../utils/permissions');

class TenantContextService {
  static async resolveContext(req) {
    const orgId = req.headers['x-organization-id'] || req.query.orgId || req.params.orgId;
    if (!orgId) {
      return { organizationId: null, membership: null, role: null };
    }

    const membership = await Membership.findOne({
      organizationId: orgId,
      userId: req.user._id,
    });

    if (!membership) {
      return { organizationId: orgId, membership: null, role: null };
    }

    return {
      organizationId: orgId,
      membership,
      role: membership.role,
    };
  }

  static requireOrgContext(req, res, next) {
    const orgId = req.headers['x-organization-id'] || req.query.orgId || req.params.orgId;
    if (!orgId) {
      return res.status(400).json({ error: 'Organization context required. Pass X-Organization-Id header.' });
    }
    next();
  }

  static enforcePermission(permission) {
    return async (req, res, next) => {
      try {
        const context = await TenantContextService.resolveContext(req);
        if (context.organizationId) {
          if (!context.membership) {
            return res.status(403).json({ error: 'Access Denied. You are not a member of this organization.' });
          }

          if (!hasPermission(context.role, permission)) {
            return res.status(403).json({ error: `Access Denied. Missing required permission: ${permission}` });
          }

          req.organizationId = context.organizationId;
          req.membership = context.membership;
          req.orgRole = context.role;
        }
        next();
      } catch (error) {
        next(error);
      }
    };
  }
}

module.exports = TenantContextService;
