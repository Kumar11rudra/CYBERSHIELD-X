class DecisionEngine {
  constructor(intentAnalyzer, riskAnalyzer, capabilityResolver, actionPlanner) {
    this.intentAnalyzer = intentAnalyzer;
    this.riskAnalyzer = riskAnalyzer;
    this.capabilityResolver = capabilityResolver;
    this.actionPlanner = actionPlanner;
  }

  /**
   * Central coordinator for Phase 3. Parses Intent, evaluates Risk, 
   * resolves Capabilities, and formulates an Action Plan if approved.
   *
   * @param {string} userMessage - Raw input.
   * @param {Object} contextSnapshot - Unified Application Snapshot.
   * @returns {Object} Structured result { success, status, data: { decision, plan, intent, risk }, error, metadata }
   */
  decide(userMessage, contextSnapshot) {
    try {
      // 1. Analyze Intent
      const intentRes = this.intentAnalyzer.analyze(userMessage, contextSnapshot);
      if (!intentRes.success) throw new Error('Intent analysis failed');
      
      const intentData = intentRes.data;

      // 2. Analyze Risk
      const riskRes = this.riskAnalyzer.evaluate(intentData, contextSnapshot);
      if (!riskRes.success) throw new Error('Risk analysis failed');

      const riskData = riskRes.data;

      // 3. Resolve Capabilities
      const capRes = this.capabilityResolver.resolve(intentData, contextSnapshot);
      if (!capRes.success) throw new Error('Capability resolution failed');

      const capData = capRes.data;

      // 4. Make Go/No-Go Decision
      let decision = 'PROCEED';
      let reason = 'All checks passed.';

      if (riskData.riskLevel === 'CRITICAL' || riskData.riskLevel === 'HIGH') {
        // In Phase 3, we strictly ESCALATE high risk intents rather than proceeding
        decision = 'ESCALATE';
        reason = `Risk Level is ${riskData.riskLevel}. Manual approval required.`;
      }

      if (!capData.canFulfill) {
        decision = 'DENY';
        reason = `Missing required capabilities: ${capData.MissingCapabilities.join(', ')}`;
      }

      // 5. Create Plan (if not denied)
      let planData = null;
      if (decision === 'PROCEED' || decision === 'ESCALATE') {
        const planRes = this.actionPlanner.createPlan(intentData, capData);
        if (planRes.success) {
          planData = planRes.data;
        }
      }

      return {
        success: true,
        status: 'SUCCESS',
        data: {
          decision,
          reason,
          intent: intentData,
          risk: riskData,
          plan: planData
        },
        error: null,
        metadata: {
          decidedAt: new Date().toISOString()
        }
      };

    } catch (error) {
      return {
        success: false,
        status: 'DENY', // Fail-safe
        data: null,
        error: error.message,
        metadata: {}
      };
    }
  }
}

module.exports = DecisionEngine;
