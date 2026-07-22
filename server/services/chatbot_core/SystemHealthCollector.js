const os = require('os');
const mongoose = require('mongoose');
const { EVENT_CATEGORIES, SEVERITY_LEVELS } = require('./types/constants');

/**
 * SystemHealthCollector Service
 * Collects only system information. Exposes interfaces. No automatic fixing.
 */
class SystemHealthCollector {
  constructor(deps) {
    this.eventBus = deps.eventBus;
    this.observationPipeline = deps.observationPipeline;
  }

  /**
   * Asynchronously collects system health metrics.
   * @returns {Object} Structured response.
   */
  async collect() {
    return new Promise((resolve) => {
      // Fire and forget to not block, but return current state instantly
      setTimeout(async () => {
        try {
          const memoryUsage = process.memoryUsage();
          
          const healthData = {
            serverStatus: 'online',
            cpuUsage: os.loadavg(),
            memoryUsage: {
              rss: Math.round(memoryUsage.rss / 1024 / 1024) + ' MB',
              heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + ' MB',
              heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + ' MB'
            },
            nodeVersion: process.version,
            expressStatus: 'online',
            mongoStatus: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
            toolkitStatus: 'online',
            averageResponseTime: '0ms', // Mocked for phase 1
            apiHealth: 'healthy',
            diskUsage: 'interface_only' // Interface only as requested
          };

          const observationData = {
            source: 'system_health_collector',
            category: EVENT_CATEGORIES.SYSTEM_HEALTH,
            severity: healthData.mongoStatus === 'disconnected' ? SEVERITY_LEVELS.CRITICAL : SEVERITY_LEVELS.INFO,
            summary: `System health check completed. DB: ${healthData.mongoStatus}`,
            metadata: healthData,
            confidence: 1.0
          };

          const normalizedResult = this.observationPipeline.normalize(observationData);
          
          if (normalizedResult.success) {
            await this.eventBus.publish(EVENT_CATEGORIES.SYSTEM_HEALTH, normalizedResult.data.observation);
          }

        } catch (error) {
          console.error('[SystemHealthCollector] Collection failure (silenced):', error.message);
        }
      }, 0);

      resolve({
        success: true,
        status: 'collection_initiated',
        data: null,
        error: null,
        metadata: { timestamp: new Date().toISOString() }
      });
    });
  }

  /**
   * Retrieves the current system health state for the Snapshot.
   * @returns {Object} Structured response.
   */
  async getCurrentState() {
    try {
      const memoryUsage = process.memoryUsage();
      const state = {
        serverStatus: 'online',
        mongoStatus: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        memory: Math.round(memoryUsage.rss / 1024 / 1024) + ' MB',
        cpu: os.loadavg()
      };

      return {
        success: true,
        status: 'retrieved',
        data: state,
        error: null,
        metadata: { timestamp: new Date().toISOString() }
      };
    } catch (error) {
      return {
        success: false,
        status: 'error',
        data: null,
        error: 'Failed to retrieve system state',
        metadata: { timestamp: new Date().toISOString() }
      };
    }
  }
}

module.exports = SystemHealthCollector;
