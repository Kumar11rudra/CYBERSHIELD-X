const ROLES = {
  OWNER: 'owner',
  ADMIN: 'admin',
  ANALYST: 'analyst',
  VIEWER: 'viewer',
};

const PERMISSIONS = {
  // Organization Admin Tasks
  ORG_DELETE: 'org:delete',
  ORG_UPDATE_SETTINGS: 'org:update_settings',
  ORG_MANAGE_MEMBERS: 'org:manage_members',
  ORG_VIEW_MEMBERS: 'org:view_members',
  ORG_MANAGE_TEAMS: 'org:manage_teams',

  // Asset Inventory Management
  ASSET_CREATE: 'asset:create',
  ASSET_UPDATE: 'asset:update',
  ASSET_DELETE: 'asset:delete',
  ASSET_VIEW: 'asset:view',

  // Scan Executions
  SCAN_RUN: 'scan:run',
  SCAN_MANAGE_SCHEDULE: 'scan:manage_schedule',
  SCAN_VIEW: 'scan:view',

  // Webhook Integrations
  WEBHOOK_MANAGE: 'webhook:manage',

  // Vulnerability Management
  VULN_MANAGE_STATUS: 'vuln:manage_status',
  VULN_VIEW: 'vuln:view',
  VULN_ASSIGN: 'vuln:assign',
};

const ROLE_PERMISSIONS = {
  [ROLES.OWNER]: Object.values(PERMISSIONS),
  [ROLES.ADMIN]: [
    PERMISSIONS.ORG_UPDATE_SETTINGS,
    PERMISSIONS.ORG_MANAGE_MEMBERS,
    PERMISSIONS.ORG_VIEW_MEMBERS,
    PERMISSIONS.ORG_MANAGE_TEAMS,
    PERMISSIONS.ASSET_CREATE,
    PERMISSIONS.ASSET_UPDATE,
    PERMISSIONS.ASSET_DELETE,
    PERMISSIONS.ASSET_VIEW,
    PERMISSIONS.SCAN_RUN,
    PERMISSIONS.SCAN_MANAGE_SCHEDULE,
    PERMISSIONS.SCAN_VIEW,
    PERMISSIONS.WEBHOOK_MANAGE,
    PERMISSIONS.VULN_MANAGE_STATUS,
    PERMISSIONS.VULN_VIEW,
    PERMISSIONS.VULN_ASSIGN,
  ],
  [ROLES.ANALYST]: [
    PERMISSIONS.ORG_VIEW_MEMBERS,
    PERMISSIONS.ASSET_VIEW,
    PERMISSIONS.SCAN_RUN,
    PERMISSIONS.SCAN_VIEW,
    PERMISSIONS.VULN_MANAGE_STATUS,
    PERMISSIONS.VULN_VIEW,
    PERMISSIONS.VULN_ASSIGN,
  ],
  [ROLES.VIEWER]: [
    PERMISSIONS.ORG_VIEW_MEMBERS,
    PERMISSIONS.ASSET_VIEW,
    PERMISSIONS.SCAN_VIEW,
    PERMISSIONS.VULN_VIEW,
  ],
};

const hasPermission = (userRole, permission) => {
  const permissions = ROLE_PERMISSIONS[userRole] || [];
  return permissions.includes(permission);
};

module.exports = {
  ROLES,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  hasPermission,
};
