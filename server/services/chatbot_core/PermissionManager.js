const { PERMISSION_STATUS } = require('./types/constants');

/**
 * PermissionManager Service
 * Evaluates user roles against requested actions based on risk levels.
 */
class PermissionManager {
  /**
   * Verifies if a user is permitted to perform a specific action.
   * @param {Object} userContext - Details about the user (e.g., role, ID).
   * @param {string} riskLevel - The risk level of the action (from PolicyEngine).
   * @returns {Object} Structured response containing the permission decision.
   */
  verifyPermission(userContext, riskLevel) {
    // Phase 1: Abstract logic.
    let permission = PERMISSION_STATUS.DENIED;
    let reason = 'Default deny';

    const role = userContext?.role || 'guest';

    if (role === 'admin') {
      permission = PERMISSION_STATUS.GRANTED;
      reason = 'Admin override';
    } else if (role === 'user') {
      if (riskLevel === 'GREEN') {
        permission = PERMISSION_STATUS.GRANTED;
        reason = 'Standard user allowed for GREEN actions';
      } else if (riskLevel === 'YELLOW') {
        permission = PERMISSION_STATUS.REQUIRES_APPROVAL;
        reason = 'Standard user requires manual approval for YELLOW actions';
      }
    }

    return {
      success: true,
      status: 'verified',
      data: {
        permission,
        reason
      },
      error: null,
      metadata: {
        timestamp: new Date().toISOString()
      }
    };
  }
}

module.exports = PermissionManager;
