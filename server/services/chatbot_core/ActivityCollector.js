const { EVENT_CATEGORIES, SEVERITY_LEVELS } = require('./types/constants');

/**
 * ActivityCollector Service
 * Collects frontend/backend metadata asynchronously.
 * NEVER collects passwords, cookies, tokens, or sensitive data.
 */
class ActivityCollector {
  constructor(deps) {
    this.eventBus = deps.eventBus;
    this.observationPipeline = deps.observationPipeline;
  }

  /**
   * Asynchronously collects activity metadata from an incoming request.
   * Does not block the main thread.
   * @param {Object} req - The Express request object.
   * @param {Object} clientData - Additional activity data sent by the client.
   */
  async collect(req, clientData = {}) {
    // Fire and forget logic to ensure no blocking
    setTimeout(async () => {
      try {
        // Filter out sensitive fields just in case
        const safeMetadata = {
          route: req?.path || 'unknown',
          page: clientData.page || 'unknown',
          tool: clientData.tool || 'none',
          navigationEvents: clientData.navigationEvents || 0,
          sessionDuration: clientData.sessionDuration || 0,
          repeatedClicks: clientData.repeatedClicks || 0,
          frontendErrors: clientData.frontendErrors || 0,
          backendErrors: clientData.backendErrors || 0,
          failedApiRequests: clientData.failedApiRequests || 0,
          loadingTime: clientData.loadingTime || 0,
          transitionTime: clientData.transitionTime || 0,
          browser: req?.headers?.['user-agent'] || 'unknown',
          operatingSystem: clientData.os || 'unknown',
          viewport: clientData.viewport || 'unknown',
          deviceType: clientData.deviceType || 'unknown',
          networkStatus: clientData.networkStatus || 'unknown',
          language: clientData.language || 'unknown',
          timezone: clientData.timezone || 'unknown'
        };

        const observationData = {
          source: 'activity_collector',
          category: EVENT_CATEGORIES.USER_ACTIVITY,
          severity: SEVERITY_LEVELS.INFO,
          summary: `Activity observed on route: ${safeMetadata.route}`,
          metadata: safeMetadata,
          confidence: 1.0
        };

        const normalizedResult = this.observationPipeline.normalize(observationData);
        
        if (normalizedResult.success) {
          await this.eventBus.publish(EVENT_CATEGORIES.USER_ACTIVITY, normalizedResult.data.observation);
        }

      } catch (error) {
        console.error('[ActivityCollector] Collection failure (silenced):', error.message);
      }
    }, 0);

    return {
      success: true,
      status: 'collection_initiated',
      data: null,
      error: null,
      metadata: { timestamp: new Date().toISOString() }
    };
  }

  /**
   * Retrieves the current aggregated activity state for the Snapshot.
   * @returns {Object} Structured response.
   */
  async getCurrentState() {
    return {
      success: true,
      status: 'retrieved',
      data: {
        lastCollectedRoute: 'pending', // In a real scenario, this would aggregate recent memory
        activeUsers: 'pending'
      },
      error: null,
      metadata: { timestamp: new Date().toISOString() }
    };
  }
}

module.exports = ActivityCollector;
