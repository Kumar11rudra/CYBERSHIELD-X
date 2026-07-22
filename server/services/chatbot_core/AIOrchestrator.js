const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * AIOrchestrator Service
 * Central coordinator. Contains NO business logic.
 * Uses Dependency Injection to coordinate other modules.
 */
class AIOrchestrator {
  /**
   * Constructs the AIOrchestrator.
   * @param {Object} deps - Injected dependencies.
   * @param {Object} deps.contextAggregator - ContextAggregator instance.
   * @param {Object} deps.memoryManager - MemoryManager instance.
   * @param {Object} deps.permissionManager - PermissionManager instance.
   * @param {Object} deps.policyEngine - PolicyEngine instance.
   * @param {Object} deps.responseFormatter - ResponseFormatter instance.
   * @param {Object} deps.runtimePipeline - RuntimePipeline instance.
   */
  constructor(deps) {
    this.contextAggregator = deps.contextAggregator;
    this.memoryManager = deps.memoryManager;
    this.permissionManager = deps.permissionManager;
    this.policyEngine = deps.policyEngine;
    this.responseFormatter = deps.responseFormatter;
    this.decisionEngine = deps.decisionEngine;
    this.runtimePipeline = deps.runtimePipeline;
    this.storageManager = deps.storageManager;

    const apiKey = process.env.GEMINI_API_KEY;
    this.genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;
  }

  /**
   * Processes an incoming chat request.
   * @param {Object} req - The Express request object.
   * @param {Array} messages - The conversation messages array.
   * @returns {Object} Structured response containing the formatted AI output.
   */
  async processChatRequest(req, messages) {
    if (!this.genAI && !this.runtimePipeline) {
      return this.responseFormatter.formatError('AI Services Offline and Pipeline unavailable.', 'SYSTEM_OFFLINE');
    }

    try {
      // 1. Get Unified Application Snapshot
      const snapshotResult = await this.contextAggregator.generateSnapshot(req);
      const appSnapshot = snapshotResult.data.snapshot;
      
      const latestMessage = messages[messages.length - 1].content;
      
      // 2. Memory Management (Mocked abstract interactions)
      const sessionId = req.sessionID || 'anonymous-session';
      await this.memoryManager.getHistory(sessionId);

      // 2. Execute Runtime Pipeline
      const pipelineContext = await this.runtimePipeline.execute(appSnapshot, latestMessage);

      // 3. Orchestrate Storage (Phase 10)
      if (this.storageManager) {
        await this.storageManager.persist(pipelineContext);
      }

      return pipelineContext.response;
    } catch (error) {
      console.error('AIOrchestrator Error:', error);
      return this.responseFormatter.formatError('Internal system error occurred.', 'SYSTEM_ERROR');
    }
  }
}

module.exports = AIOrchestrator;
