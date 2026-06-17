const mongoose = require('mongoose');
const axios = require('axios');
const { activeProvider } = require('../utils/cacheProvider');
const { scanQueue, aiQueue, notificationQueue, integrationQueue } = require('../workers/queueProvider');
const { getScanPerformanceAnalytics } = require('./metricsService');

const checkOllamaStatus = async () => {
  const ollamaUrl = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';
  try {
    const res = await axios.get(`${ollamaUrl}/api/tags`, { timeout: 2000 });
    if (res.status === 200) {
      return {
        mode: 'Local AI Active',
        online: true,
        detail: 'Local Ollama node is online and accessible.'
      };
    }
  } catch (err) {
    // Suppress logs
  }
  return {
    mode: 'Template Engine Active',
    online: false,
    detail: 'Local Ollama offline. Fallback Template Engine active and healthy.'
  };
};

const getDetailedHealth = async () => {
  const dbStatus = mongoose.connection.readyState === 1;
  const aiHealth = await checkOllamaStatus();
  const scanPerformance = await getScanPerformanceAnalytics();

  const cacheMetrics = activeProvider.getMetrics();
  const queueMetrics = {
    scan: scanQueue.getMetrics(),
    ai: aiQueue.getMetrics(),
    notification: notificationQueue.getMetrics(),
    integration: integrationQueue.getMetrics()
  };

  const services = {
    database: {
      status: dbStatus ? 'healthy' : 'unhealthy',
      detail: dbStatus ? 'Connected to MongoDB.' : 'Database connection unavailable.'
    },
    aiEngine: {
      status: 'healthy',
      mode: aiHealth.mode,
      online: aiHealth.online,
      detail: aiHealth.detail
    },
    cache: {
      status: 'healthy',
      metrics: cacheMetrics
    },
    queues: {
      status: 'healthy',
      metrics: queueMetrics
    },
    scanPerformance
  };

  // Platform is unhealthy only if critical DB is down
  const overallStatus = dbStatus ? 'healthy' : 'unhealthy';

  return {
    status: overallStatus,
    timestamp: new Date(),
    services
  };
};

module.exports = {
  getDetailedHealth,
  checkOllamaStatus
};
