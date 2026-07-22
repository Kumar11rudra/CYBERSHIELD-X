/**
 * ContextAggregator Service
 * Merges state from ContextBuilder, ActivityCollector, SystemHealthCollector, 
 * MemoryManager, and ObservationPipeline into ONE Application Snapshot.
 */
class ContextAggregator {
  constructor(deps) {
    this.contextBuilder = deps.contextBuilder;
    this.activityCollector = deps.activityCollector;
    this.systemHealthCollector = deps.systemHealthCollector;
    this.memoryManager = deps.memoryManager;
    this.observationPipeline = deps.observationPipeline;
    this.toolRegistry = deps.toolRegistry; // Needed to fulfill snapshot requirements
  }

  /**
   * Generates the unified Application Snapshot.
   * Async, never blocks long term. Timeout mechanisms implemented internally if needed.
   * @param {Object} req - The Express request object.
   * @returns {Object} Structured response containing the Application Snapshot.
   */
  async generateSnapshot(req) {
    try {
      // 1. Build Base Context
      const contextResult = this.contextBuilder.buildContext(req);
      const baseContext = contextResult.data || {};

      // 2. Fetch Collectors State (Async but we await fast local accessors)
      const [activityResult, healthResult, observationsResult, toolsResult] = await Promise.all([
        this.activityCollector.getCurrentState().catch(() => ({ data: {} })),
        this.systemHealthCollector.getCurrentState().catch(() => ({ data: {} })),
        Promise.resolve(this.observationPipeline.getRecentObservations(10)).catch(() => ({ data: { observations: [] } })),
        Promise.resolve(this.toolRegistry.getAllTools()).catch(() => ({ data: { tools: [] } }))
      ]);

      const snapshot = {
        Application: {
          environment: baseContext.appState?.environment || 'unknown',
          version: '4.0.0'
        },
        User: baseContext.userSession || {},
        Conversation: {
          sessionId: req?.sessionID || 'anonymous'
        },
        Health: healthResult.data || {},
        Activity: activityResult.data || {},
        CurrentTool: baseContext.toolContext || null,
        CurrentRoute: baseContext.requestData?.currentPage || null,
        RecentEvents: [], // Would normally aggregate from EventBus directly if needed
        RecentErrors: observationsResult.data.observations.filter(o => o.severity === 'CRITICAL' || o.severity === 'FATAL'),
        Observations: observationsResult.data.observations || [],
        Capabilities: toolsResult.data.tools || []
      };

      return {
        success: true,
        status: 'snapshot_generated',
        data: { snapshot },
        error: null,
        metadata: { timestamp: new Date().toISOString() }
      };

    } catch (error) {
      console.error('[ContextAggregator] Failed to generate snapshot:', error);
      // Graceful degradation: Return empty but safe snapshot
      return {
        success: false,
        status: 'error',
        data: {
          snapshot: {
            Application: {}, User: {}, Health: {}, Activity: {}, Observations: []
          }
        },
        error: 'Snapshot generation degraded gracefully',
        metadata: { timestamp: new Date().toISOString() }
      };
    }
  }
}

module.exports = ContextAggregator;
