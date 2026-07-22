const { RISK_LEVELS } = require('./types/constants');

/**
 * PolicyEngine Service
 * Classifies actions into RISK_LEVELS (GREEN, YELLOW, RED).
 * Foundation for future automation permissions.
 */
class PolicyEngine {
  /**
   * Evaluates the risk level of a requested action.
   * @param {string} actionType - The type of action being requested.
   * @param {Object} actionContext - Contextual data about the action.
   * @returns {Object} Structured response containing the risk level.
   */
  evaluateRisk(actionType, actionContext) {
    // Phase 1: Mocked implementation
    // Future Phase: Fetch dynamic policies from DB based on org/user settings
    let riskLevel = RISK_LEVELS.YELLOW; // default

    // Basic heuristic for demonstration of architecture
    if (actionType && actionType.toLowerCase().includes('read')) {
      riskLevel = RISK_LEVELS.GREEN;
    } else if (actionType && (actionType.toLowerCase().includes('delete') || actionType.toLowerCase().includes('modify'))) {
      riskLevel = RISK_LEVELS.RED;
    }

    return {
      success: true,
      status: 'evaluated',
      data: {
        riskLevel,
        policyApplied: 'default_heuristic'
      },
      error: null,
      metadata: {
        timestamp: new Date().toISOString()
      }
    };
  }
}

module.exports = PolicyEngine;
