class RiskAnalyzer {
  constructor(policyEngine) {
    this.policyEngine = policyEngine; // Dependency Injection
  }

  /**
   * Upgrades the existing PolicyEngine by performing deep contextual risk analysis
   * on the classified intent before any action is planned.
   *
   * @param {Object} intentPayload - Output data from IntentAnalyzer.
   * @param {Object} contextSnapshot - The unified Application Snapshot.
   * @returns {Object} Structured result { success, status, data: { riskLevel, restrictions, reasoning }, error, metadata }
   */
  evaluate(intentPayload, contextSnapshot) {
    try {
      if (!intentPayload || !intentPayload.intent) {
        throw new Error('Missing intent payload');
      }

      // Default high risk if we cannot determine
      let riskLevel = 'HIGH';
      let restrictions = ['Requires manual approval'];
      let reasoning = 'Intent requires explicit authorization.';

      const { intent } = intentPayload;

      // Safe Intents
      if (intent === 'conversational' || intent === 'query_status') {
        riskLevel = 'LOW';
        restrictions = [];
        reasoning = 'Read-only informational intent.';
      } 
      // Medium Intents
      else if (intent === 'analyze_threat') {
        riskLevel = 'MEDIUM';
        restrictions = ['Logging required'];
        reasoning = 'Analysis does not modify state but consumes resources.';
      }
      // High/Critical Intents
      else if (intent === 'execute_scan' || intent === 'remediate_issue') {
        riskLevel = 'HIGH';
        restrictions = ['Requires Admin role', 'Explicit user approval required'];
        reasoning = 'Modifies state or triggers external active scans.';
      }

      // Wrap existing PolicyEngine evaluation (if available) for deeper constraints
      let policyResult = null;
      if (this.policyEngine && typeof this.policyEngine.evaluateRisk === 'function') {
         policyResult = this.policyEngine.evaluateRisk(contextSnapshot);
      }

      return {
        success: true,
        status: 'SUCCESS',
        data: {
          riskLevel,
          restrictions,
          reasoning,
          policyResult // Attach legacy policy engine results
        },
        error: null,
        metadata: {
          evaluatedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      // Security Consideration: Default to DENY / HIGH RISK on error
      return {
        success: false,
        status: 'DENY',
        data: {
          riskLevel: 'CRITICAL',
          restrictions: ['System Error - Operations Locked'],
          reasoning: 'Error during risk analysis.'
        },
        error: error.message,
        metadata: {}
      };
    }
  }
}

module.exports = RiskAnalyzer;
