/**
 * 🛡️ CyberShield X — Role-Based Access Control (RBAC) Middleware
 *
 * Enforces role boundaries across operational endpoints:
 * - VIEWER: Read-only access to cases, alerts, assets, readiness
 * - ANALYST: Standard tooling execution, case notes, finding creation, alert investigation
 * - OPERATOR: Native terminal execution, scan jobs, process cancellation, playbook triggers
 * - ADMIN: Dependency remediation, configuration management, user management, full access
 */

const ROLE_HIERARCHY = {
  viewer: 10,
  user: 20,
  analyst: 20,
  operator: 30,
  admin: 40,
};

/**
 * Normalizes user role string
 */
function normalizeRole(role) {
  if (!role || typeof role !== 'string') return 'viewer';
  const lower = role.toLowerCase().trim();
  return ROLE_HIERARCHY[lower] !== undefined ? lower : 'viewer';
}

/**
 * Require a minimum role in the hierarchy
 * @param {string} minimumRole - e.g. 'analyst', 'operator', 'admin'
 */
function requireMinimumRole(minimumRole) {
  const requiredLevel = ROLE_HIERARCHY[minimumRole.toLowerCase()] || 40;

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'UNAUTHORIZED',
      });
    }

    const userRole = normalizeRole(req.user.role);
    const userLevel = ROLE_HIERARCHY[userRole] || 10;

    if (userLevel < requiredLevel) {
      return res.status(403).json({
        success: false,
        error: `Access denied. Requires minimum role: ${minimumRole.toUpperCase()}`,
        code: 'PERMISSION_DENIED',
        requiredRole: minimumRole.toUpperCase(),
        currentRole: userRole.toUpperCase(),
      });
    }

    next();
  };
}

/**
 * Require one of the explicit allowed roles
 * @param {Array<string>} allowedRoles - e.g. ['analyst', 'operator', 'admin']
 */
function requireRoles(allowedRoles = []) {
  const allowed = allowedRoles.map((r) => r.toLowerCase());

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'UNAUTHORIZED',
      });
    }

    const userRole = normalizeRole(req.user.role);

    // Admin always has bypass privilege
    if (userRole === 'admin' || allowed.includes(userRole)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      error: `Access denied. Allowed roles: ${allowedRoles.join(', ').toUpperCase()}`,
      code: 'PERMISSION_DENIED',
      currentRole: userRole.toUpperCase(),
    });
  };
}

module.exports = {
  ROLE_HIERARCHY,
  normalizeRole,
  requireMinimumRole,
  requireRoles,
};
