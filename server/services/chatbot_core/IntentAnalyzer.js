class IntentAnalyzer {
  /**
   * Parses the raw user message and context snapshot to determine the user's intent.
   * Currently uses lightweight rule-based/regex fallbacks for Phase 3.
   *
   * @param {string} userMessage - The raw message from the user.
   * @param {Object} contextSnapshot - The unified Application Snapshot.
   * @returns {Object} Structured result { success, status, data: { intent, confidence, entities }, error, metadata }
   */
  analyze(userMessage, contextSnapshot) {
    try {
      const msg = (userMessage || '').toLowerCase();
      let intent = 'conversational';
      let confidence = 0.9;
      const entities = {};

      // Comprehensive intent classification
      if (msg.includes('hi') || msg.includes('hello') || msg.includes('hey') || msg.includes('how are you') || msg.includes('kaise ho')) {
        intent = 'greeting';
        confidence = 0.95;
      } else if (msg.includes('who are you') || msg.includes('what is cybershield') || msg.includes('about')) {
        intent = 'platform_info';
        confidence = 0.95;
      } else if (msg.includes('playbook') || msg.includes('chained') || msg.includes('orchestrat')) {
        intent = 'playbook_execution';
        confidence = 0.9;
      } else if (msg.includes('scan') || msg.includes('nmap') || msg.includes('recon') || msg.includes('subfinder')) {
        intent = 'execute_scan';
        confidence = 0.85;
      } else if (msg.includes('remediate') || msg.includes('fix') || msg.includes('heal')) {
        intent = 'remediate_issue';
        confidence = 0.8;
      } else if (msg.includes('status') || msg.includes('health') || msg.includes('check')) {
        intent = 'query_status';
        confidence = 0.9;
      } else if (msg.includes('analyze') || msg.includes('investigate') || msg.includes('threat')) {
        intent = 'analyze_threat';
        confidence = 0.85;
      } else if (msg.includes('tool') || msg.includes('catalog')) {
        intent = 'tool_lookup';
        confidence = 0.9;
      }

      return {
        success: true,
        status: 'SUCCESS',
        data: {
          intent,
          confidence,
          entities
        },
        error: null,
        metadata: {
          analyzedAt: new Date().toISOString()
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

module.exports = IntentAnalyzer;
