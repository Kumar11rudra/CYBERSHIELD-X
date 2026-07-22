class CapabilityResolver {
  constructor(toolRegistry) {
    this.toolRegistry = toolRegistry; // Dependency Injection
  }

  /**
   * Checks the ToolRegistry and ContextAggregator to verify if the AI 
   * actually has the technical tools required to fulfill the user's intent.
   *
   * @param {Object} intentPayload - Output data from IntentAnalyzer.
   * @param {Object} contextSnapshot - The unified Application Snapshot.
   * @returns {Object} Structured result { success, status, data: { canFulfill, requiredTools, missingCapabilities }, error, metadata }
   */
  resolve(intentPayload, contextSnapshot) {
    try {
      if (!intentPayload || !intentPayload.intent) {
        throw new Error('Missing intent payload');
      }

      const { intent } = intentPayload;
      let canFulfill = true;
      let requiredTools = [];
      let missingCapabilities = [];

      // Retrieve available tools from the registry (metadata only in Phase 3)
      let availableTools = [];
      if (this.toolRegistry && typeof this.toolRegistry.getAllTools === 'function') {
        const regResult = this.toolRegistry.getAllTools();
        if (regResult.success && Array.isArray(regResult.data)) {
          availableTools = regResult.data;
        }
      }

      let AvailableCapabilities = availableTools.map(t => t.id || t.name);
      let MissingCapabilities = [];
      let BlockedCapabilities = [];
      let AlternativeCapabilities = [];
      let FutureCapabilities = ['automation_engine', 'network_firewall', 'github_adapter'];
      let CapabilityConfidence = 0.9;

      if (intent === 'execute_scan') {
        requiredTools.push('abstract_scanner');
        if (AvailableCapabilities.length === 0) {
          canFulfill = false;
          MissingCapabilities.push('abstract_scanner');
          CapabilityConfidence = 0.5;
        } else {
          // In Phase 3, we abstract actual tools
          AlternativeCapabilities = AvailableCapabilities;
        }
      } else if (intent === 'remediate_issue') {
        requiredTools.push('automation_engine'); 
        canFulfill = false; // Phase 3 hardcode
        MissingCapabilities.push('automation_engine');
        CapabilityConfidence = 1.0;
      }

      return {
        success: true,
        status: 'SUCCESS',
        data: {
          canFulfill,
          requiredTools,
          AvailableCapabilities,
          MissingCapabilities,
          BlockedCapabilities,
          AlternativeCapabilities,
          FutureCapabilities,
          CapabilityConfidence
        },
        error: null,
        metadata: {
          resolvedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        success: false,
        status: 'ERROR',
        data: null,
        error: error.message,
        metadata: {}
      };
    }
  }
}

module.exports = CapabilityResolver;
